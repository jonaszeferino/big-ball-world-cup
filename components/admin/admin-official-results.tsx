"use client"

import React from "react"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, RotateCcw, Save } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getCountryFlag } from "@/lib/country-flags"
import { applyMatchResultAndUpdateBets, reopenMatchAndResetBets } from "@/lib/match-result-scoring"
import {
  getOfficialResultLetters,
  requiresPenaltyScores,
  validatePenaltyPair,
} from "@/lib/match-stage"

interface Match {
  id: string
  home_team: { id: string; name: string; code: string }
  away_team: { id: string; name: string; code: string }
  match_date: string
  group_name: string | null
  stage: string
  status: string
  home_score: number | null
  away_score: number | null
  home_penalty_score: number | null
  away_penalty_score: number | null
}

interface TeamResult {
  home_goals: number
  away_goals: number
  home_pens?: number
  away_pens?: number
}

interface SavedResult {
  code: string
  team_home: string
  team_away: string
  goals_home: number
  goals_away: number
  created_at: string
}

function resultCode(m: Match) {
  return `${m.home_team.code}-${m.away_team.code}`
}

async function upsertTeamsResultsRow(
  supabase: ReturnType<typeof createClient>,
  match: Match,
  homeGoals: number,
  awayGoals: number,
  homePens?: number | null,
  awayPens?: number | null,
): Promise<{ error: string | null }> {
  const code = resultCode(match)
  const matchRes = getOfficialResultLetters(homeGoals, awayGoals, match.stage, homePens, awayPens)
  const row = {
    name: `${match.home_team.code} vs ${match.away_team.code}`,
    code,
    group: match.group_name,
    team_home: match.home_team.name,
    team_away: match.away_team.name,
    goals_home: homeGoals,
    goals_away: awayGoals,
    match_result_home: matchRes.home,
    match_result_away: matchRes.away,
  }

  const { data: existing } = await supabase.from("teams_results").select("code").eq("code", code).maybeSingle()

  if (existing) {
    const { error } = await supabase.from("teams_results").update(row).eq("code", code)
    return { error: error?.message ?? null }
  }

  const { error } = await supabase.from("teams_results").insert(row)
  return { error: error?.message ?? null }
}

export function AdminOfficialResults() {
  const [matches, setMatches] = useState<Match[]>([])
  const [savedResults, setSavedResults] = useState<SavedResult[]>([])
  const [results, setResults] = useState<Record<string, TeamResult>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMatches = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("matches")
      .select(
        "id, match_date, group_name, stage, status, home_score, away_score, home_penalty_score, away_penalty_score, home_team:home_team_id(id, name, code), away_team:away_team_id(id, name, code)",
      )
      .order("match_date", { ascending: true })

    if (data) {
      const mapped = data.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        home_team: m.home_team as { id: string; name: string; code: string },
        away_team: m.away_team as { id: string; name: string; code: string },
        match_date: m.match_date as string,
        group_name: m.group_name as string | null,
        stage: m.stage as string,
        status: m.status as string,
        home_score: m.home_score as number | null,
        away_score: m.away_score as number | null,
        home_penalty_score: m.home_penalty_score as number | null,
        away_penalty_score: m.away_penalty_score as number | null,
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

  const savedByCode = useCallback(
    (code: string) => savedResults.find((r) => r.code === code),
    [savedResults],
  )

  const getDefaultScores = (match: Match): TeamResult => {
    const sr = savedByCode(resultCode(match))
    if (sr) {
      const t: TeamResult = { home_goals: sr.goals_home, away_goals: sr.goals_away }
      if (requiresPenaltyScores(match.stage, t.home_goals, t.away_goals)) {
        t.home_pens = match.home_penalty_score ?? 0
        t.away_pens = match.away_penalty_score ?? 0
      }
      return t
    }
    if (match.home_score != null && match.away_score != null) {
      const t: TeamResult = { home_goals: match.home_score, away_goals: match.away_score }
      if (requiresPenaltyScores(match.stage, t.home_goals, t.away_goals)) {
        t.home_pens = match.home_penalty_score ?? 0
        t.away_pens = match.away_penalty_score ?? 0
      }
      return t
    }
    return { home_goals: 0, away_goals: 0 }
  }

  const getScores = (match: Match): TeamResult => {
    return results[match.id] ?? getDefaultScores(match)
  }

  const updateResult = (
    matchId: string,
    field: "home_goals" | "away_goals" | "home_pens" | "away_pens",
    value: number,
  ) => {
    setResults((prev) => {
      const m = matches.find((x) => x.id === matchId)
      if (!m) return prev
      const base = { ...(prev[matchId] ?? getDefaultScores(m)) }
      if (field === "home_goals" || field === "away_goals") {
        const ng = field === "home_goals" ? Math.max(0, value) : base.home_goals
        const na = field === "away_goals" ? Math.max(0, value) : base.away_goals
        const next: TeamResult = { ...base, home_goals: ng, away_goals: na }
        if (!requiresPenaltyScores(m.stage, ng, na)) {
          delete next.home_pens
          delete next.away_pens
        } else {
          next.home_pens = base.home_pens ?? m.home_penalty_score ?? 0
          next.away_pens = base.away_pens ?? m.away_penalty_score ?? 0
        }
        return { ...prev, [matchId]: next }
      }
      const v = Math.max(0, value)
      return { ...prev, [matchId]: { ...base, [field]: v } }
    })
  }

  const readGoals = (match: Match) => {
    const s = getScores(match)
    const needPens = requiresPenaltyScores(match.stage, s.home_goals, s.away_goals)
    return {
      homeGoals: s.home_goals,
      awayGoals: s.away_goals,
      homePens: needPens ? (s.home_pens ?? 0) : null,
      awayPens: needPens ? (s.away_pens ?? 0) : null,
    }
  }

  const validateBeforeWrite = (match: Match): string | null => {
    const { homeGoals, awayGoals, homePens, awayPens } = readGoals(match)
    if (requiresPenaltyScores(match.stage, homeGoals, awayGoals)) {
      const v = validatePenaltyPair(homePens, awayPens)
      if (!v.ok) return v.message
    }
    return null
  }

  const handleSaveOfficialOnly = async (match: Match) => {
    setError(null)
    const err = validateBeforeWrite(match)
    if (err) {
      setError(err)
      return
    }
    const { homeGoals, awayGoals, homePens, awayPens } = readGoals(match)
    setIsSubmitting(true)
    const supabase = createClient()

    const { error: upErr } = await upsertTeamsResultsRow(supabase, match, homeGoals, awayGoals, homePens, awayPens)
    if (upErr) {
      setError(upErr)
      setIsSubmitting(false)
      return
    }

    const { error: penErr } = await supabase
      .from("matches")
      .update(
        requiresPenaltyScores(match.stage, homeGoals, awayGoals)
          ? { home_penalty_score: homePens, away_penalty_score: awayPens }
          : { home_penalty_score: null, away_penalty_score: null },
      )
      .eq("id", match.id)

    if (penErr) {
      setError(penErr.message)
      setIsSubmitting(false)
      return
    }

    await loadMatches()
    setIsSubmitting(false)
  }

  const handleCloseBolao = async (match: Match) => {
    setError(null)
    const err = validateBeforeWrite(match)
    if (err) {
      setError(err)
      return
    }
    const { homeGoals, awayGoals, homePens, awayPens } = readGoals(match)
    setIsSubmitting(true)
    const supabase = createClient()

    const { error: bolaoErr } = await applyMatchResultAndUpdateBets(supabase, match.id, homeGoals, awayGoals, {
      stage: match.stage,
      homePenalty: homePens,
      awayPenalty: awayPens,
    })
    if (bolaoErr) {
      setError(bolaoErr)
      setIsSubmitting(false)
      return
    }

    const { error: upErr } = await upsertTeamsResultsRow(supabase, match, homeGoals, awayGoals, homePens, awayPens)
    if (upErr) {
      await reopenMatchAndResetBets(supabase, match.id)
      setError(upErr)
      setIsSubmitting(false)
      await loadMatches()
      return
    }

    setResults((prev) => {
      const next = { ...prev }
      delete next[match.id]
      return next
    })
    await loadMatches()
    setIsSubmitting(false)
  }

  const handleReopenBolao = async (match: Match) => {
    if (
      !window.confirm(
        "Reabrir esta partida no bolão? Os pontos deste jogo são zerados, o placar sai da partida e a linha de resultado oficial é removida.",
      )
    ) {
      return
    }
    setError(null)
    setIsSubmitting(true)
    const supabase = createClient()
    const code = resultCode(match)

    const { error: reopenErr } = await reopenMatchAndResetBets(supabase, match.id)
    if (reopenErr) {
      setError(reopenErr)
      setIsSubmitting(false)
      return
    }

    await supabase.from("teams_results").delete().eq("code", code)
    await loadMatches()
    setIsSubmitting(false)
  }

  const handleReopenAll = async () => {
    if (
      !window.confirm(
        "Reabrir TODAS as partidas no bolão e apagar todos os resultados oficiais? Isto zera pontos dos jogos fechados e limpa a tabela de grupos.",
      )
    ) {
      return
    }
    setError(null)
    setIsSubmitting(true)
    const supabase = createClient()

    const { data: finished } = await supabase.from("matches").select("id").eq("status", "finished")
    for (const row of finished ?? []) {
      const { error: e } = await reopenMatchAndResetBets(supabase, row.id as string)
      if (e) {
        setError(e)
        setIsSubmitting(false)
        await loadMatches()
        return
      }
    }

    const { data: allCodes } = await supabase.from("teams_results").select("code")
    const codes = (allCodes ?? []).map((r) => r.code as string).filter(Boolean)
    if (codes.length > 0) {
      const { error: delErr } = await supabase.from("teams_results").delete().in("code", codes)
      if (delErr) {
        setError(delErr.message)
        setIsSubmitting(false)
        await loadMatches()
        return
      }
    }

    setResults({})
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

  const openBolaoMatches = matches.filter((m) => m.status !== "finished")
  const closedBolaoMatches = matches.filter((m) => m.status === "finished")

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-card-foreground">Resultados e encerramento no bolão</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              <strong className="font-medium text-foreground">Salvar resultado</strong> grava só a tabela de grupos (resultados oficiais); o bolão continua
              aberto para apostas até você clicar em <strong className="font-medium text-foreground">Encerrar partida no bolão</strong>, que aplica
              placar, pontos e ranking. A partir dos <strong className="font-medium text-foreground">16-avos</strong>, empate no tempo regular exige
              placar de <strong className="font-medium text-foreground">penáltis</strong> com vencedor (o bolão continua a pontuar só o resultado do
              tempo regular).
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={() => void handleReopenAll()} className="shrink-0 gap-1.5">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Reabrir tudo
          </Button>
        </CardHeader>
        <CardContent>
          {openBolaoMatches.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhuma partida aberta no bolão (todas encerradas ou sem partidas).</p>
          ) : (
            <div className="flex flex-col gap-4">
              {openBolaoMatches.map((match) => {
                const s = getScores(match)
                const hasOfficial = !!savedByCode(resultCode(match))
                const showPens = requiresPenaltyScores(match.stage, s.home_goals, s.away_goals)
                return (
                  <div
                    key={match.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex flex-1 flex-col gap-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          {format(new Date(match.match_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                        {match.group_name && (
                          <Badge variant="outline" className="text-xs">
                            Grupo {match.group_name}
                          </Badge>
                        )}
                        {hasOfficial ? (
                          <Badge className="text-xs bg-sky-500/15 text-sky-900 dark:text-sky-100">Resultado oficial guardado</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Bolão aberto
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-lg shrink-0">{getCountryFlag(match.home_team.name)}</span>
                          <span className="font-semibold truncate">{match.home_team.name}</span>
                        </div>
                        <span className="text-muted-foreground">vs</span>
                        <div className="flex items-center gap-1 min-w-0">
                          <span className="text-lg shrink-0">{getCountryFlag(match.away_team.name)}</span>
                          <span className="font-semibold truncate">{match.away_team.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Tempo regular</span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            value={s.home_goals}
                            onChange={(e) => updateResult(match.id, "home_goals", parseInt(e.target.value, 10) || 0)}
                            placeholder="0"
                            className="h-10 w-16 text-center text-lg font-bold"
                          />
                          <span className="text-muted-foreground">x</span>
                          <Input
                            type="number"
                            min={0}
                            value={s.away_goals}
                            onChange={(e) => updateResult(match.id, "away_goals", parseInt(e.target.value, 10) || 0)}
                            placeholder="0"
                            className="h-10 w-16 text-center text-lg font-bold"
                          />
                        </div>
                        {showPens && (
                          <div className="flex flex-col gap-1 pt-1">
                            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Penáltis (vencedor)</span>
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min={0}
                                value={s.home_pens ?? 0}
                                onChange={(e) => updateResult(match.id, "home_pens", parseInt(e.target.value, 10) || 0)}
                                className="h-9 w-14 text-center text-sm font-semibold"
                              />
                              <span className="text-muted-foreground text-sm">x</span>
                              <Input
                                type="number"
                                min={0}
                                value={s.away_pens ?? 0}
                                onChange={(e) => updateResult(match.id, "away_pens", parseInt(e.target.value, 10) || 0)}
                                className="h-9 w-14 text-center text-sm font-semibold"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="gap-2"
                          disabled={isSubmitting}
                          onClick={() => void handleSaveOfficialOnly(match)}
                        >
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Salvar resultado
                        </Button>
                        <Button type="button" size="sm" className="gap-2" disabled={isSubmitting} onClick={() => void handleCloseBolao(match)}>
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Encerrar partida no bolão
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {closedBolaoMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-card-foreground">Encerradas no bolão ({closedBolaoMatches.length})</CardTitle>
            <p className="text-sm text-muted-foreground">Estas partidas já contaram para pontos e ranking. Reabrir zera pontos do jogo e remove o resultado oficial.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {closedBolaoMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-1 flex-col gap-1 text-sm sm:flex-row sm:flex-wrap sm:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg">{getCountryFlag(match.home_team.name)}</span>
                      <span className="font-semibold">{match.home_team.name}</span>
                      <span className="text-xl font-bold tabular-nums">{match.home_score ?? "—"}</span>
                      <span className="text-muted-foreground">×</span>
                      <span className="text-xl font-bold tabular-nums">{match.away_score ?? "—"}</span>
                      <span className="text-lg">{getCountryFlag(match.away_team.name)}</span>
                      <span className="font-semibold">{match.away_team.name}</span>
                      <Badge className="text-xs bg-emerald-500/15 text-emerald-900 dark:text-emerald-100">Encerrada no bolão</Badge>
                    </div>
                    {match.home_score != null &&
                      match.away_score != null &&
                      match.home_score === match.away_score &&
                      match.home_penalty_score != null &&
                      match.away_penalty_score != null && (
                        <span className="text-xs text-muted-foreground pl-7 sm:pl-0">
                          Penáltis: {match.home_penalty_score} × {match.away_penalty_score}
                        </span>
                      )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    className="gap-2 shrink-0"
                    onClick={() => void handleReopenBolao(match)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reabrir bolão
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
