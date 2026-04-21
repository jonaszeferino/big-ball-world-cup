"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Trophy, Medal, Award, Flag, Swords } from "lucide-react"
import { cn } from "@/lib/utils"
import { isGroupStage } from "@/lib/match-stage"
import { POINTS_ADVANCE_KNOCKOUT, POINTS_EXACT, POINTS_RESULT } from "@/lib/match-result-scoring"

interface RankedPlayer {
  id: string
  display_name: string
  total_points: number
  group_points: number
  knockout_points: number
  exact_hits: number
  result_hits: number
  advance_hits: number
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
        .select("id, stage")
        .eq("status", "finished")
        .not("home_score", "is", null)
        .not("away_score", "is", null)

      const finishedIds = new Set((finishedMatches ?? []).map((m) => m.id))
      const stageByMatch = new Map((finishedMatches ?? []).map((m) => [m.id, m.stage as string]))

      let settledBets: {
        user_id: string
        points_earned: number | null
        match_id: string
      }[] = []
      if (finishedIds.size > 0) {
        const { data: bets } = await supabase
          .from("bets")
          .select("user_id, points_earned, match_id")
          .in("match_id", [...finishedIds])

        settledBets = (bets ?? []).filter((b) => finishedIds.has(b.match_id))
      }

      const agg = new Map<
        string,
        {
          pts: number
          groupPts: number
          koPts: number
          exact: number
          res: number
          adv: number
          settled: number
        }
      >()
      for (const p of profiles) {
        agg.set(p.id, { pts: 0, groupPts: 0, koPts: 0, exact: 0, res: 0, adv: 0, settled: 0 })
      }

      for (const b of settledBets) {
        const row = agg.get(b.user_id)
        if (!row) continue
        const pts = b.points_earned ?? 0
        const stage = stageByMatch.get(b.match_id) ?? "group"
        row.pts += pts
        row.settled += 1
        if (isGroupStage(stage)) row.groupPts += pts
        else row.koPts += pts

        if (pts === POINTS_EXACT) row.exact += 1
        else if (pts === POINTS_RESULT) row.res += 1
        else if (pts === POINTS_ADVANCE_KNOCKOUT) row.adv += 1
      }

      const playerStats: RankedPlayer[] = profiles.map((p) => {
        const a = agg.get(p.id) ?? {
          pts: 0,
          groupPts: 0,
          koPts: 0,
          exact: 0,
          res: 0,
          adv: 0,
          settled: 0,
        }
        return {
          id: p.id,
          display_name: p.display_name,
          total_points: a.pts,
          group_points: a.groupPts,
          knockout_points: a.koPts,
          exact_hits: a.exact,
          result_hits: a.res,
          advance_hits: a.adv,
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

  const byGroup = [...players].sort((a, b) => {
    if (b.group_points !== a.group_points) return b.group_points - a.group_points
    if (b.exact_hits !== a.exact_hits) return b.exact_hits - a.exact_hits
    return a.display_name.localeCompare(b.display_name)
  })

  const byKnockout = [...players].sort((a, b) => {
    if (b.knockout_points !== a.knockout_points) return b.knockout_points - a.knockout_points
    if (b.exact_hits !== a.exact_hits) return b.exact_hits - a.exact_hits
    return a.display_name.localeCompare(b.display_name)
  })

  const leaderGroup = byGroup[0]
  const leaderKo = byKnockout[0]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ranking</h1>
        <p className="text-sm text-muted-foreground">
          So entram jogos com <strong className="font-medium text-foreground">placar oficial</strong> guardado no admin.
          Pontos: +{POINTS_EXACT} exato, +{POINTS_RESULT} resultado, +{POINTS_ADVANCE_KNOCKOUT} quem passa (mata-mata).
        </p>
      </div>

      {(leaderGroup && leaderGroup.group_points > 0) || (leaderKo && leaderKo.knockout_points > 0) ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {leaderGroup && leaderGroup.group_points > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                  <Flag className="h-5 w-5 text-primary" />
                  Fase de grupos — líder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-foreground">{leaderGroup.display_name}</p>
                <p className="text-2xl font-bold text-primary">{leaderGroup.group_points}</p>
                <p className="text-xs text-muted-foreground">pontos só em jogos de grupos</p>
              </CardContent>
            </Card>
          )}
          {leaderKo && leaderKo.knockout_points > 0 && (
            <Card className="border-secondary/30 bg-secondary/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base text-foreground">
                  <Swords className="h-5 w-5 text-secondary-foreground" />
                  Mata-mata — líder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-foreground">{leaderKo.display_name}</p>
                <p className="text-2xl font-bold text-primary">{leaderKo.knockout_points}</p>
                <p className="text-xs text-muted-foreground">pontos só em jogos eliminatórios</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}

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
                  <span className="text-xs text-muted-foreground">pontos totais</span>
                  <div className="flex flex-wrap justify-center gap-1">
                    <Badge variant="outline" className="border-border text-xs text-muted-foreground">
                      G {player.group_points}
                    </Badge>
                    <Badge variant="outline" className="border-border text-xs text-muted-foreground">
                      KO {player.knockout_points}
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
          <CardTitle className="text-card-foreground">Classificacao completa</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhum participante ainda</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">#</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Jogador</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground" title="Apostas em partidas concluidas">
                      Apostas*
                    </th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">Grupos</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">Mata-mata</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">Exatos</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">+7</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">+5</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Total</th>
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
                      <td className="py-3 text-center text-muted-foreground">{player.group_points}</td>
                      <td className="py-3 text-center text-muted-foreground">{player.knockout_points}</td>
                      <td className="py-3 text-center text-muted-foreground">{player.exact_hits}</td>
                      <td className="py-3 text-center text-muted-foreground">{player.result_hits}</td>
                      <td className="py-3 text-center text-muted-foreground">{player.advance_hits}</td>
                      <td className="py-3 text-right font-bold text-primary">{player.total_points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">
                * Apostas em jogos com resultado oficial. +7 = acerto de resultado sem exato; +5 = quem passa (mata-mata).
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
