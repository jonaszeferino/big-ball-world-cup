"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Medal, Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface RankedPlayer {
  id: string
  display_name: string
  total_points: number
  exact_hits: number
  result_hits: number
  /** Apostas em partidas ja concluidas (com resultado oficial) */
  settled_bets: number
}

export default function RankingPage() {
  const [players, setPlayers] = useState<RankedPlayer[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRanking() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .order("display_name", { ascending: true })

      if (!profiles?.length) {
        setPlayers([])
        setLoading(false)
        return
      }

      const { data: finishedMatches } = await supabase
        .from("matches")
        .select("id")
        .eq("status", "finished")
        .not("home_score", "is", null)
        .not("away_score", "is", null)

      const finishedIds = new Set((finishedMatches ?? []).map((m) => m.id))

      let settledBets: { user_id: string; points_earned: number | null }[] = []
      if (finishedIds.size > 0) {
        const { data: bets } = await supabase
          .from("bets")
          .select("user_id, points_earned, match_id")
          .in("match_id", [...finishedIds])

        settledBets = (bets ?? []).filter((b) => finishedIds.has(b.match_id))
      }

      const agg = new Map<
        string,
        { pts: number; exact: number; res: number; settled: number }
      >()
      for (const p of profiles) {
        agg.set(p.id, { pts: 0, exact: 0, res: 0, settled: 0 })
      }

      for (const b of settledBets) {
        const row = agg.get(b.user_id)
        if (!row) continue
        const pts = b.points_earned ?? 0
        row.pts += pts
        row.settled += 1
        if (pts === 3) row.exact += 1
        else if (pts === 1) row.res += 1
      }

      const playerStats: RankedPlayer[] = profiles.map((p) => {
        const a = agg.get(p.id) ?? { pts: 0, exact: 0, res: 0, settled: 0 }
        return {
          id: p.id,
          display_name: p.display_name,
          total_points: a.pts,
          exact_hits: a.exact,
          result_hits: a.res,
          settled_bets: a.settled,
        }
      })

      playerStats.sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points
        if (b.exact_hits !== a.exact_hits) return b.exact_hits - a.exact_hits
        if (b.result_hits !== a.result_hits) return b.result_hits - a.result_hits
        return a.display_name.localeCompare(b.display_name)
      })

      setPlayers(playerStats)
      setLoading(false)
    }
    loadRanking()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const podiumIcons = [
    { icon: Trophy, colorClass: "text-accent" },
    { icon: Medal, colorClass: "text-muted-foreground" },
    { icon: Award, colorClass: "text-chart-4" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ranking</h1>
        <p className="text-sm text-muted-foreground">
          So entram jogos com <strong className="font-medium text-foreground">placar oficial</strong> guardado no admin (Partidas →
          confirmar resultado). Partidas só agendadas ou sem placar nao pontuam.
        </p>
      </div>

      {players.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {players.slice(0, 3).map((player, i) => {
            const podium = podiumIcons[i]
            const Icon = podium.icon
            return (
              <Card
                key={player.id}
                className={cn("text-center", player.id === currentUserId && "ring-2 ring-primary/30")}
              >
                <CardContent className="flex flex-col items-center gap-2 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Icon className={cn("h-6 w-6", podium.colorClass)} />
                  </div>
                  <span className="text-lg font-bold text-card-foreground">{player.display_name}</span>
                  <span className="text-3xl font-bold text-primary">{player.total_points}</span>
                  <span className="text-xs text-muted-foreground">pontos</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="border-border text-xs text-muted-foreground">
                      {player.exact_hits} exatos
                    </Badge>
                    <Badge variant="outline" className="border-border text-xs text-muted-foreground">
                      {player.result_hits} resultados
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">Classificacao Completa</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhum participante ainda</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">#</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Jogador</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground" title="Apostas em partidas ja concluidas">
                      Apostas*
                    </th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">Exatos</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">Resultados</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Pontos</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, i) => (
                    <tr
                      key={player.id}
                      className={cn(
                        "border-b border-border last:border-0",
                        player.id === currentUserId && "bg-primary/5",
                      )}
                    >
                      <td className="py-3 text-left font-medium text-foreground">{i + 1}</td>
                      <td className="py-3 text-left">
                        <span
                          className={cn(
                            "font-medium",
                            player.id === currentUserId ? "text-primary" : "text-foreground",
                          )}
                        >
                          {player.display_name}
                          {player.id === currentUserId && (
                            <span className="ml-1 text-xs text-muted-foreground">(voce)</span>
                          )}
                        </span>
                      </td>
                      <td className="py-3 text-center text-muted-foreground">{player.settled_bets}</td>
                      <td className="py-3 text-center text-muted-foreground">{player.exact_hits}</td>
                      <td className="py-3 text-center text-muted-foreground">{player.result_hits}</td>
                      <td className="py-3 text-right font-bold text-primary">{player.total_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">
                * Apostas = quantidade de palpites em jogos que ja tem resultado oficial (partida concluida).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
