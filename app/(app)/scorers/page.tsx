"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Target } from "lucide-react"
import { getCountryFlag } from "@/lib/country-flags"

interface GoalRow {
  goals: number
  scorer_name: string
  team_id: string
  team: { name: string; code: string } | null
}

interface RankRow {
  rank: number
  scorer_name: string
  teamName: string
  teamCode: string
  goals: number
}

export default function ScorersPage() {
  const [rows, setRows] = useState<GoalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      const { data, error: qErr } = await supabase
        .from("match_goal_scorers")
        .select("goals, scorer_name, team_id, team:team_id (name, code)")

      if (cancelled) return
      if (qErr) {
        setError(qErr.message)
        setRows([])
        setLoading(false)
        return
      }

      setRows((data ?? []) as unknown as GoalRow[])
      setLoading(false)
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const ranked = useMemo(() => {
    const map = new Map<string, { scorer_name: string; teamName: string; teamCode: string; goals: number }>()
    for (const r of rows) {
      const teamName = r.team?.name ?? "—"
      const teamCode = r.team?.code ?? ""
      const normName = r.scorer_name.trim().toLowerCase()
      const key = `${r.team_id}\0${normName}`
      const prev = map.get(key)
      if (prev) prev.goals += r.goals
      else map.set(key, { scorer_name: r.scorer_name.trim(), teamName, teamCode, goals: r.goals })
    }
    const list = [...map.values()].sort(
      (a, b) => b.goals - a.goals || a.scorer_name.localeCompare(b.scorer_name, "pt"),
    )
    const out: RankRow[] = []
    for (let i = 0; i < list.length; i++) {
      const item = list[i]!
      let rank: number
      if (i === 0) rank = 1
      else {
        const prevItem = list[i - 1]!
        rank = item.goals === prevItem.goals ? out[i - 1]!.rank : i + 1
      }
      out.push({
        rank,
        scorer_name: item.scorer_name,
        teamName: item.teamName,
        teamCode: item.teamCode,
        goals: item.goals,
      })
    }
    return out
  }, [rows])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Target className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Artilheiros</h1>
          <p className="text-sm text-muted-foreground">
            Ranking por gols no tempo regulamentar e prorrogação. Pênaltis da decisão não entram. Os nomes vêm do admin — na
            soma final, o mesmo jogador no mesmo time conta junto, mesmo com maiúsculas diferentes (ex.{" "}
            <span className="whitespace-nowrap">&quot;João&quot; / &quot;joão&quot;</span>).
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Erro ao carregar</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!error && ranked.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Ainda não há marcadores registados. Quando o admin atualizar os jogos, a lista aparece aqui.
          </CardContent>
        </Card>
      )}

      {!error && ranked.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Tabela de gols</CardTitle>
            <CardDescription>
              Jogador · time · total — nomes iguais no mesmo time são somados (sem diferenciar maiúsculas).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14 text-center">#</TableHead>
                  <TableHead>Jogador</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Gols</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((r) => (
                  <TableRow key={`${r.teamCode}-${r.scorer_name}-${r.rank}`}>
                    <TableCell className="text-center font-semibold text-muted-foreground">{r.rank}</TableCell>
                    <TableCell className="font-medium">{r.scorer_name}</TableCell>
                    <TableCell>
                      <span className="mr-2" aria-hidden>
                        {getCountryFlag(r.teamName)}
                      </span>
                      <span className="text-muted-foreground">{r.teamName}</span>
                      {r.teamCode ? (
                        <span className="ml-1 text-xs text-muted-foreground">({r.teamCode})</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right font-bold tabular-nums text-primary">{r.goals}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
