"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  getUpcomingOpenMatches,
  type NextMatchBetReminderMatch,
} from "@/lib/next-match-bet-reminder"
import { formatMatchDateTimeBrazil } from "@/lib/match-datetime-brazil"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

const NEXT_MATCH_COUNT = 6

interface ProfileRow {
  id: string
  display_name: string
}

export function AdminUpcomingBetsMatrix() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [upcoming, setUpcoming] = useState<NextMatchBetReminderMatch[]>([])
  const [betKeys, setBetKeys] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const nowMs = Date.now()

    const matchSelect =
      "id, match_date, status, stage, home_team:home_team_id(code, name), away_team:away_team_id(code, name)"

    const [matchesRes, profilesRes] = await Promise.all([
      supabase.from("matches").select(matchSelect).order("match_date", { ascending: true }),
      supabase.from("profiles").select("id, display_name").order("display_name", { ascending: true }),
    ])

    if (matchesRes.error) {
      setError(matchesRes.error.message)
      setLoading(false)
      return
    }
    if (profilesRes.error) {
      setError(profilesRes.error.message)
      setLoading(false)
      return
    }

    const matchRows = (matchesRes.data ?? []) as unknown as NextMatchBetReminderMatch[]
    const nextSix = getUpcomingOpenMatches(matchRows, nowMs, NEXT_MATCH_COUNT)
    setUpcoming(nextSix)

    const profileList = (profilesRes.data ?? []) as ProfileRow[]
    setProfiles(profileList)

    if (nextSix.length === 0) {
      setBetKeys(new Set())
      setLoading(false)
      return
    }

    const matchIds = nextSix.map((m) => m.id)
    const { data: betsData, error: betsErr } = await supabase
      .from("bets")
      .select("user_id, match_id")
      .in("match_id", matchIds)

    if (betsErr) {
      setError(betsErr.message)
      setLoading(false)
      return
    }

    const keys = new Set<string>()
    for (const b of betsData ?? []) {
      keys.add(`${String((b as { user_id: string }).user_id)}:${String((b as { match_id: string }).match_id)}`)
    }
    setBetKeys(keys)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos {NEXT_MATCH_COUNT} jogos — apostas por jogador</CardTitle>
        <CardDescription>
          Visível só neste painel. Mostra se cada apostador já tem palpite nas próximas partidas ainda
          abertas (agendadas e antes do apito), por ordem de data — até {NEXT_MATCH_COUNT} jogos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Não há partidas agendadas antes do apito neste momento. Volta mais tarde ou verifica as datas
            das partidas no separador Partidas.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 min-w-[140px] bg-background font-semibold">
                    Apostador
                  </TableHead>
                  {upcoming.map((m) => (
                    <TableHead key={m.id} className="min-w-[100px] whitespace-normal text-center align-bottom">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold leading-tight">
                          {m.home_team.code} × {m.away_team.code}
                        </span>
                        <span className="text-[10px] font-normal leading-tight text-muted-foreground">
                          {formatMatchDateTimeBrazil(m.match_date)}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="sticky left-0 z-10 bg-background font-medium">
                      {p.display_name}
                    </TableCell>
                    {upcoming.map((m) => {
                      const has = betKeys.has(`${p.id}:${m.id}`)
                      return (
                        <TableCell key={m.id} className="text-center">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center rounded-full p-1",
                              has ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
                            )}
                            title={has ? "Tem aposta" : "Sem aposta"}
                          >
                            {has ? (
                              <Check className="h-5 w-5" strokeWidth={2.5} aria-label="Tem aposta" />
                            ) : (
                              <Minus className="h-5 w-5" strokeWidth={2} aria-label="Sem aposta" />
                            )}
                          </span>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
