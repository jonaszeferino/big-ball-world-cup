"use client"

import React from "react"
import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Loader2, RotateCcw, Save } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getCountryFlag } from "@/lib/country-flags"
import { applyMatchResultAndUpdateBets, reopenMatchAndResetBets, matchesPenaltyColumnsMissingError } from "@/lib/match-result-scoring"
import {
  getOfficialResultLetters,
  requiresPenaltyScores,
  validatePenaltyPair,
} from "@/lib/match-stage"
import { MatchGoalScorersInline, type MatchGoalScorerRow } from "@/components/admin/match-goal-scorers-inline"

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
  const [goalRows, setGoalRows] = useState<MatchGoalScorerRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reopenTarget, setReopenTarget] = useState<Match | null>(null)

  const loadMatches = useCallback(async () => {
    setError(null)
    const supabase = createClient()
    const selectWithPens =
      "id, match_date, group_name, stage, status, home_score, away_score, home_penalty_score, away_penalty_score, home_team:home_team_id(id, name, code), away_team:away_team_id(id, name, code)"
    const selectBase =
      "id, match_date, group_name, stage, status, home_score, away_score, home_team:home_team_id(id, name, code), away_team:away_team_id(id, name, code)"

    const first = await supabase.from("matches").select(selectWithPens).order("match_date", { ascending: true })
    const goalsFetch = supabase.from("match_goal_scorers").select("id, match_id, team_id, scorer_name, goals")

    const rows =
      first.error != null
        ? (await supabase.from("matches").select(selectBase).order("match_date", { ascending: true })).data
        : first.data

    const { data: goalsData, error: goalsErr } = await goalsFetch

    if (rows) {
      const mapped = rows.map((m: Record<string, unknown>) => ({
        id: m.id as string,
        home_team: m.home_team as { id: string; name: string; code: string },
        away_team: m.away_team as { id: string; name: string; code: string },
        match_date: m.match_date as string,
        group_name: m.group_name as string | null,
        stage: m.stage as string,
        status: m.status as string,
        home_score: m.home_score as number | null,
        away_score: m.away_score as number | null,
        home_penalty_score: (m.home_penalty_score as number | null | undefined) ?? null,
        away_penalty_score: (m.away_penalty_score as number | null | undefined) ?? null,
      }))
      setMatches(mapped)

      if (goalsErr) {
        setError(goalsErr.message)
        setGoalRows([])
      } else {
        setGoalRows((goalsData ?? []) as MatchGoalScorerRow[])
      }

      const { data: saved } = await supabase.from("teams_results").select("*")
      const normalized = (saved ?? []).map((r: Record<string, unknown>) => ({
        code: String(r.code ?? ""),
        team_home: String(r.team_home ?? ""),
        team_away: String(r.team_away ?? ""),
        goals_home: Math.max(0, Math.floor(Number(r.goals_home)) || 0),
        goals_away: Math.max(0, Math.floor(Number(r.goals_away)) || 0),
        created_at: String(r.created_at ?? ""),
      }))
      setSavedResults(normalized as SavedResult[])
    } else {
      setMatches([])
      setGoalRows([])
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
      const t: TeamResult = {
        home_goals: Math.max(0, Math.floor(Number(sr.goals_home)) || 0),
        away_goals: Math.max(0, Math.floor(Number(sr.goals_away)) || 0),
      }
      if (requiresPenaltyScores(match.stage, t.home_goals, t.away_goals)) {
        t.home_pens = match.home_penalty_score ?? 0
        t.away_pens = match.away_penalty_score ?? 0
      }
      return t
    }
    if (match.home_score != null && match.away_score != null) {
      const t: TeamResult = {
        home_goals: Math.max(0, Math.floor(Number(match.home_score)) || 0),
        away_goals: Math.max(0, Math.floor(Number(match.away_score)) || 0),
      }
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

    const needPenUpdate = requiresPenaltyScores(match.stage, homeGoals, awayGoals)
    if (needPenUpdate) {
      const { error: penErr } = await supabase
        .from("matches")
        .update({
          home_penalty_score: homePens,
          away_penalty_score: awayPens,
        })
        .eq("id", match.id)

      if (penErr) {
        if (penErr.message && matchesPenaltyColumnsMissingError(penErr.message)) {
          setError(
            `${penErr.message} Para salvar pênaltis no mata-mata, rode no Supabase (SQL Editor) o arquivo scripts/005_match_penalties.sql.`,
          )
        } else {
          setError(penErr.message)
        }
        setIsSubmitting(false)
        return
      }
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

  const performReopenBolao = async (match: Match) => {
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
    setReopenTarget(null)
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
      <AlertDialog open={reopenTarget !== null} onOpenChange={(open) => !open && !isSubmitting && setReopenTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reabrir esta partida no bolão?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left">
                <p>
                  <strong className="font-medium text-foreground">
                    {reopenTarget?.home_team.name} × {reopenTarget?.away_team.name}
                  </strong>
                </p>
                <p>
                  Os pontos deste jogo nas apostas são zerados, o placar sai da partida e o{" "}
                  <strong className="font-medium text-foreground">resultado oficial guardado</strong> (tabela de grupos) é removido.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              className="gap-2"
              disabled={isSubmitting || !reopenTarget}
              onClick={() => reopenTarget && void performReopenBolao(reopenTarget)}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirmar reabertura
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {error && (
        <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">Resultados e encerramento no bolão</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
              <strong className="font-medium text-foreground">Salvar resultado</strong> grava só a tabela de grupos (resultados oficiais); o bolão segue
              aberto para apostas até você clicar em <strong className="font-medium text-foreground">Encerrar partida no bolão</strong>, que aplica
              placar, pontos e ranking. O bloco <strong className="font-medium text-foreground">Marcadores</strong> usa o mesmo placar dos campos{" "}
              <strong className="font-medium text-foreground">Tempo regular</strong> (mesmo depois de salvar o resultado) — você pode preencher antes ou
              depois, só não pode passar do número de <strong className="font-medium text-foreground">gols</strong> de cada time. Nas{" "}
              <strong className="font-medium text-foreground">fases eliminatórias</strong>, empate no tempo regulamentar exige placar de{" "}
              <strong className="font-medium text-foreground">pênaltis</strong> com vencedor (o bolão continua pontuando só o resultado do tempo
              regulamentar).
            </p>
        </CardHeader>
        <CardContent>
          {openBolaoMatches.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhuma partida aberta no bolão (todas encerradas ou sem partidas).</p>
          ) : (
            <div className="flex flex-col gap-4">
              {openBolaoMatches.map((match) => {
                const s = getScores(match)
                const maxMarcadoresHome = Math.max(0, Math.floor(Number(s.home_goals)) || 0)
                const maxMarcadoresAway = Math.max(0, Math.floor(Number(s.away_goals)) || 0)
                const hasOfficial = !!savedByCode(resultCode(match))
                const showPens = requiresPenaltyScores(match.stage, s.home_goals, s.away_goals)
                return (
                  <div
                    key={match.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
                      <MatchGoalScorersInline
                        matchId={match.id}
                        homeTeamId={match.home_team.id}
                        awayTeamId={match.away_team.id}
                        homeTeamCode={match.home_team.code}
                        awayTeamCode={match.away_team.code}
                        maxHomeGoals={maxMarcadoresHome}
                        maxAwayGoals={maxMarcadoresAway}
                      rows={goalRows.filter((r) => r.match_id === match.id)}
                      disabled={isSubmitting}
                      onRefresh={loadMatches}
                    />
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
              {closedBolaoMatches.map((match) => {
                const hg = Math.max(0, Math.floor(Number(match.home_score ?? 0)) || 0)
                const ag = Math.max(0, Math.floor(Number(match.away_score ?? 0)) || 0)
                return (
                <div
                  key={match.id}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                    onClick={() => setReopenTarget(match)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reabrir bolão
                  </Button>
                  </div>
                  <MatchGoalScorersInline
                    matchId={match.id}
                    homeTeamId={match.home_team.id}
                    awayTeamId={match.away_team.id}
                    homeTeamCode={match.home_team.code}
                    awayTeamCode={match.away_team.code}
                    maxHomeGoals={hg}
                    maxAwayGoals={ag}
                    rows={goalRows.filter((r) => r.match_id === match.id)}
                    disabled={isSubmitting}
                    onRefresh={loadMatches}
                  />
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
