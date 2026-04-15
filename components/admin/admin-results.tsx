"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Team {
  id: string
  name: string
  code: string
}

interface Match {
  id: string
  home_team: Team
  away_team: Team
  home_score: number | null
  away_score: number | null
  match_date: string
  stage: string
  group_name: string | null
  status: string
}

export function AdminResults() {
  const [matches, setMatches] = useState<Match[]>([])
  const [scores, setScores] = useState<Record<string, { home: number; away: number }>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadMatches = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("matches")
      .select("id, home_score, away_score, match_date, stage, group_name, status, home_team:home_team_id(id, name, code), away_team:away_team_id(id, name, code)")
      .order("match_date", { ascending: true })

    if (data) {
      const mapped = data.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        home_team: m.home_team as Team,
        away_team: m.away_team as Team,
        home_score: m.home_score as number | null,
        away_score: m.away_score as number | null,
        match_date: m.match_date as string,
        stage: m.stage as string,
        group_name: m.group_name as string | null,
        status: m.status as string,
      }))
      setMatches(mapped)

      const initialScores: Record<string, { home: number; away: number }> = {}
      mapped.forEach((m) => {
        initialScores[m.id] = {
          home: m.home_score ?? 0,
          away: m.away_score ?? 0,
        }
      })
      setScores(initialScores)
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadMatches() }, [loadMatches])

  const calculatePoints = (
    actualHome: number,
    actualAway: number,
    predictedHome: number,
    predictedAway: number
  ) => {
    if (actualHome === predictedHome && actualAway === predictedAway) return 3

    const actualResult = actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw"
    const predictedResult = predictedHome > predictedAway ? "home" : predictedHome < predictedAway ? "away" : "draw"

    if (actualResult === predictedResult) return 1
    return 0
  }

  const handleSetResult = async (matchId: string) => {
    setSubmittingId(matchId)
    const supabase = createClient()
    const matchScores = scores[matchId]
    if (!matchScores) return

    const { error: matchErr } = await supabase
      .from("matches")
      .update({
        home_score: matchScores.home,
        away_score: matchScores.away,
        status: "finished",
      })
      .eq("id", matchId)

    if (matchErr) {
      setSubmittingId(null)
      return
    }

    const { data: bets } = await supabase
      .from("bets")
      .select("id, user_id, predicted_home_score, predicted_away_score")
      .eq("match_id", matchId)

    if (bets && bets.length > 0) {
      const pointsMap: Record<string, number> = {}

      for (const bet of bets) {
        const points = calculatePoints(
          matchScores.home,
          matchScores.away,
          bet.predicted_home_score,
          bet.predicted_away_score
        )

        await supabase
          .from("bets")
          .update({ points_earned: points })
          .eq("id", bet.id)

        if (!pointsMap[bet.user_id]) pointsMap[bet.user_id] = 0
        pointsMap[bet.user_id] += points
      }

      for (const [userId, points] of Object.entries(pointsMap)) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_points")
          .eq("id", userId)
          .single()

        if (profile) {
          await supabase
            .from("profiles")
            .update({ total_points: profile.total_points + points })
            .eq("id", userId)
        }
      }
    }

    await loadMatches()
    setSubmittingId(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const pendingMatches = matches.filter((m) => m.status !== "finished")
  const finishedMatches = matches.filter((m) => m.status === "finished")

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Definir Resultados ({pendingMatches.length} pendentes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingMatches.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nenhuma partida pendente de resultado
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {match.home_team.name} vs {match.away_team.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(match.match_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase">{match.home_team.code}</span>
                    <Input
                      type="number"
                      min={0}
                      value={scores[match.id]?.home ?? 0}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [match.id]: { ...prev[match.id], home: Math.max(0, parseInt(e.target.value) || 0) },
                        }))
                      }
                      className="h-8 w-14 text-center text-sm font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-xs text-muted-foreground">x</span>
                    <Input
                      type="number"
                      min={0}
                      value={scores[match.id]?.away ?? 0}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [match.id]: { ...prev[match.id], away: Math.max(0, parseInt(e.target.value) || 0) },
                        }))
                      }
                      className="h-8 w-14 text-center text-sm font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <span className="text-xs font-bold text-muted-foreground uppercase">{match.away_team.code}</span>
                    <Button
                      size="sm"
                      onClick={() => handleSetResult(match.id)}
                      disabled={submittingId === match.id}
                    >
                      {submittingId === match.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="mr-1 h-4 w-4" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {finishedMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-card-foreground">
              Resultados Definidos ({finishedMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {finishedMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-foreground">
                      {match.home_team.code}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {match.home_score} x {match.away_score}
                    </span>
                    <span className="text-sm text-foreground">
                      {match.away_team.code}
                    </span>
                  </div>
                  <Badge className="bg-primary/10 text-primary text-xs">
                    Encerrada
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
