"use client"

import React from "react"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getCountryFlag } from "@/lib/country-flags"

interface Match {
  id: string
  home_team: { id: string; name: string; code: string }
  away_team: { id: string; name: string; code: string }
  match_date: string
  group_name: string | null
  stage: string
}

interface TeamResult {
  home_goals: number
  away_goals: number
}

interface SavedResult {
  code: string
  team_home: string
  team_away: string
  goals_home: number
  goals_away: number
  created_at: string
}

export function AdminOfficialResults() {
  const [matches, setMatches] = useState<Match[]>([])
  const [results, setResults] = useState<Record<string, TeamResult>>({})
  const [savedResults, setSavedResults] = useState<SavedResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadMatches = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("matches")
      .select("id, match_date, group_name, stage, home_team:home_team_id(id, name, code), away_team:away_team_id(id, name, code)")
      .order("match_date", { ascending: true })

    if (data) {
      const mapped = data.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        home_team: m.home_team as { id: string; name: string; code: string },
        away_team: m.away_team as { id: string; name: string; code: string },
        match_date: m.match_date as string,
        group_name: m.group_name as string | null,
        stage: m.stage as string,
      }))
      setMatches(mapped)

      // Carregar resultados já salvos
      const { data: saved } = await supabase.from("teams_results").select("*")
      setSavedResults((saved || []) as SavedResult[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  const updateResult = (matchId: string, field: "home_goals" | "away_goals", value: number) => {
    setResults((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { home_goals: 0, away_goals: 0 }),
        [field]: Math.max(0, value),
      },
    }))
  }

  const getMatchResult = (homeGoals: number, awayGoals: number): { home: string; away: string } => {
    if (homeGoals > awayGoals) {
      return { home: "W", away: "L" }
    } else if (homeGoals < awayGoals) {
      return { home: "L", away: "W" }
    } else {
      return { home: "T", away: "T" }
    }
  }

  const handleSaveResult = async (match: Match) => {
    const matchResult = results[match.id]
    if (!matchResult) return

    setIsSubmitting(true)
    const supabase = createClient()

    const matchRes = getMatchResult(matchResult.home_goals, matchResult.away_goals)

    const { error } = await supabase.from("teams_results").insert({
      name: `${match.home_team.code} vs ${match.away_team.code}`,
      code: `${match.home_team.code}-${match.away_team.code}`,
      group: match.group_name,
      team_home: match.home_team.name,
      team_away: match.away_team.name,
      goals_home: matchResult.home_goals,
      goals_away: matchResult.away_goals,
      match_result_home: matchRes.home,
      match_result_away: matchRes.away,
    })

    if (!error) {
      setSavedResults((prev) => [
        ...prev,
        {
          code: `${match.home_team.code}-${match.away_team.code}`,
          team_home: match.home_team.name,
          team_away: match.away_team.name,
          goals_home: matchResult.home_goals,
          goals_away: matchResult.away_goals,
          created_at: new Date().toISOString(),
        },
      ])
      setResults((prev) => {
        const newResults = { ...prev }
        delete newResults[match.id]
        return newResults
      })
    }

    setIsSubmitting(false)
  }

  const handleDeleteResult = async (match: Match) => {
    const supabase = createClient()
    const code = `${match.home_team.code}-${match.away_team.code}`

    await supabase.from("teams_results").delete().eq("code", code)
    setSavedResults((prev) => prev.filter((r) => r.code !== code))
  }

  if (isLoading) {
    return <div className="text-center text-muted-foreground">Carregando...</div>
  }

  const pendingMatches = matches.filter((m) => !savedResults.some((r) => r.code === `${m.home_team.code}-${m.away_team.code}`))

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Registrar Resultados Oficiais ({pendingMatches.length} pendentes)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingMatches.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Todos os resultados foram registrados
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {format(new Date(match.match_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                      {match.group_name && (
                        <Badge variant="outline" className="text-xs">
                          Grupo {match.group_name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getCountryFlag(match.home_team.name)}</span>
                        <span className="font-semibold">{match.home_team.name}</span>
                      </div>
                      <span className="text-muted-foreground">vs</span>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getCountryFlag(match.away_team.name)}</span>
                        <span className="font-semibold">{match.away_team.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        value={results[match.id]?.home_goals ?? ""}
                        onChange={(e) =>
                          updateResult(match.id, "home_goals", parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="h-10 w-16 text-center text-lg font-bold"
                      />
                      <span className="text-muted-foreground">x</span>
                      <Input
                        type="number"
                        min={0}
                        value={results[match.id]?.away_goals ?? ""}
                        onChange={(e) =>
                          updateResult(match.id, "away_goals", parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="h-10 w-16 text-center text-lg font-bold"
                      />
                    </div>

                    <Button
                      onClick={() => handleSaveResult(match)}
                      disabled={!results[match.id] || isSubmitting}
                      size="sm"
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Salvar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados já salvos */}
      {savedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-card-foreground">Resultados Registrados ({savedResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {savedResults.map((result) => {
                const match = matches.find((m) => m.home_team.code === result.code.split("-")[0])
                return (
                  <div
                    key={result.code}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3"
                  >
                    <div className="flex flex-col gap-2 text-sm flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCountryFlag(result.team_home)}</span>
                        <span className="font-semibold">{result.team_home}</span>
                        <span className="text-xl font-bold text-card-foreground">{result.goals_home}</span>
                        <span className="text-muted-foreground">×</span>
                        <span className="text-xl font-bold text-card-foreground">{result.goals_away}</span>
                        <span className="text-lg">{getCountryFlag(result.team_away)}</span>
                        <span className="font-semibold">{result.team_away}</span>
                      </div>
                      {match && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(match.match_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        const m = matches.find((match) => 
                          match.home_team.name === result.team_home && 
                          match.away_team.name === result.team_away
                        )
                        if (m) handleDeleteResult(m)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
