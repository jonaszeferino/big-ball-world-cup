"use client"

import React from "react"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Trash2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getCountryFlag } from "@/lib/country-flags"
import { applyMatchResultAndUpdateBets, reopenMatchAndResetBets } from "@/lib/match-result-scoring"

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
  const [error, setError] = useState<string | null>(null)

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
    }
    if (homeGoals < awayGoals) {
      return { home: "L", away: "W" }
    }
    return { home: "T", away: "T" }
  }

  const handleSaveResult = async (match: Match) => {
    setError(null)
    const raw = results[match.id]
    const homeGoals = raw?.home_goals ?? 0
    const awayGoals = raw?.away_goals ?? 0

    setIsSubmitting(true)
    const supabase = createClient()

    const { error: bolaoErr } = await applyMatchResultAndUpdateBets(supabase, match.id, homeGoals, awayGoals)
    if (bolaoErr) {
      setError(bolaoErr)
      setIsSubmitting(false)
      return
    }

    const matchRes = getMatchResult(homeGoals, awayGoals)

    const { error: insertErr } = await supabase.from("teams_results").insert({
      name: `${match.home_team.code} vs ${match.away_team.code}`,
      code: `${match.home_team.code}-${match.away_team.code}`,
      group: match.group_name,
      team_home: match.home_team.name,
      team_away: match.away_team.name,
      goals_home: homeGoals,
      goals_away: awayGoals,
      match_result_home: matchRes.home,
      match_result_away: matchRes.away,
    })

    if (insertErr) {
      await reopenMatchAndResetBets(supabase, match.id)
      setError(insertErr.message)
      setIsSubmitting(false)
      await loadMatches()
      return
    }

    setSavedResults((prev) => [
      ...prev,
      {
        code: `${match.home_team.code}-${match.away_team.code}`,
        team_home: match.home_team.name,
        team_away: match.away_team.name,
        goals_home: homeGoals,
        goals_away: awayGoals,
        created_at: new Date().toISOString(),
      },
    ])
    setResults((prev) => {
      const next = { ...prev }
      delete next[match.id]
      return next
    })
    await loadMatches()
    setIsSubmitting(false)
  }

  const handleDeleteResult = async (match: Match) => {
    if (
      !window.confirm(
        "Remover este resultado? A partida volta a agendada no bolao, os pontos deste jogo sao zerados e a linha sai da tabela oficial.",
      )
    ) {
      return
    }
    setError(null)
    setIsSubmitting(true)
    const supabase = createClient()
    const code = `${match.home_team.code}-${match.away_team.code}`

    const { error: reopenErr } = await reopenMatchAndResetBets(supabase, match.id)
    if (reopenErr) {
      setError(reopenErr)
      setIsSubmitting(false)
      return
    }

    await supabase.from("teams_results").delete().eq("code", code)
    setSavedResults((prev) => prev.filter((r) => r.code !== code))
    await loadMatches()
    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        Carregando...
      </div>
    )
  }

  const pendingMatches = matches.filter((m) => !savedResults.some((r) => r.code === `${m.home_team.code}-${m.away_team.code}`))

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">Registrar Resultados Oficiais ({pendingMatches.length} pendentes)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ao salvar: grava a tabela de grupos (resultados oficiais), <strong className="font-medium text-foreground">encerra a partida no bolao</strong>{" "}
            (placar na partida) e calcula pontos das apostas. Isto é o unico sitio para fechar jogos para o ranking.
          </p>
        </CardHeader>
        <CardContent>
          {pendingMatches.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Todos os resultados foram registrados</p>
          ) : (
            <div className="flex flex-col gap-4">
              {pendingMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-1 flex-col gap-2">
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

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        value={results[match.id]?.home_goals ?? ""}
                        onChange={(e) => updateResult(match.id, "home_goals", parseInt(e.target.value, 10) || 0)}
                        placeholder="0"
                        className="h-10 w-16 text-center text-lg font-bold"
                      />
                      <span className="text-muted-foreground">x</span>
                      <Input
                        type="number"
                        min={0}
                        value={results[match.id]?.away_goals ?? ""}
                        onChange={(e) => updateResult(match.id, "away_goals", parseInt(e.target.value, 10) || 0)}
                        placeholder="0"
                        className="h-10 w-16 text-center text-lg font-bold"
                      />
                    </div>

                    <Button onClick={() => handleSaveResult(match)} disabled={isSubmitting} size="sm" className="gap-2">
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Salvar e encerrar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {savedResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-card-foreground">Resultados Registrados ({savedResults.length})</CardTitle>
            <p className="text-sm text-muted-foreground">Apagar devolve a partida ao estado agendado no bolao e remove da tabela de grupos.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {savedResults.map((result) => {
                const m = matches.find(
                  (match) => `${match.home_team.code}-${match.away_team.code}` === result.code,
                )
                return (
                  <div
                    key={result.code}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3"
                  >
                    <div className="flex flex-1 flex-col gap-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg">{getCountryFlag(result.team_home)}</span>
                        <span className="font-semibold">{result.team_home}</span>
                        <span className="text-xl font-bold text-card-foreground">{result.goals_home}</span>
                        <span className="text-muted-foreground">×</span>
                        <span className="text-xl font-bold text-card-foreground">{result.goals_away}</span>
                        <span className="text-lg">{getCountryFlag(result.team_away)}</span>
                        <span className="font-semibold">{result.team_away}</span>
                      </div>
                      {m && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(m.match_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    {m && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={isSubmitting}
                        onClick={() => handleDeleteResult(m)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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
