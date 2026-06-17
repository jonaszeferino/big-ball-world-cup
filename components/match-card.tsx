"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Minus, Plus, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { CountryFlag } from "@/components/country-flag"
import { MatchSavedOddsPanel } from "@/components/match-saved-odds-panel"
import { MatchPartialResultBanner } from "@/components/match-partial-result-banner"
import { formatMatchDateTimeBrazil, isBeforeMatchKickoff } from "@/lib/match-datetime-brazil"
import type { PartialMatchResult } from "@/lib/match-partial-result"
import { isGroupStage, isKnockoutEliminationStage } from "@/lib/match-stage"
import { POINTS_EXACT, POINTS_RESULT, knockoutPointsLabel } from "@/lib/match-result-scoring"
import {
  formatPalpiteScoreDisplay,
  palpiteScoreForSubmit,
  parsePalpiteScoreInput,
} from "@/lib/score-input"

interface Match {
  id: string
  home_team: { id: string; name: string; code: string }
  away_team: { id: string; name: string; code: string }
  home_score: number | null
  away_score: number | null
  home_penalty_score: number | null
  away_penalty_score: number | null
  match_date: string
  stage: string
  group_name: string | null
  status: string
}

interface Bet {
  id: string
  match_id: string
  predicted_home_score: number
  predicted_away_score: number
  predicted_advances_team_id: string | null
  points_earned: number
}

interface MatchCardProps {
  match: Match
  bet: Bet | null
  userId: string
  onBetPlaced: () => void
  partialResult?: PartialMatchResult | null
}

export function MatchCard({ match, bet, userId, onBetPlaced, partialResult = null }: MatchCardProps) {
  const [homeScore, setHomeScore] = useState(() => palpiteScoreForSubmit(bet?.predicted_home_score ?? 0))
  const [awayScore, setAwayScore] = useState(() => palpiteScoreForSubmit(bet?.predicted_away_score ?? 0))
  const [advancesTeamId, setAdvancesTeamId] = useState<string | null>(bet?.predicted_advances_team_id ?? null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /** Só a partir do mata-mata (16-avos…); fase de grupos não pede “quem passa”. */
  const advancesRequired = !isGroupStage(match.stage) && isKnockoutEliminationStage(match.stage) && homeScore === awayScore

  useEffect(() => {
    setAdvancesTeamId(bet?.predicted_advances_team_id ?? null)
    setHomeScore(palpiteScoreForSubmit(bet?.predicted_home_score ?? 0))
    setAwayScore(palpiteScoreForSubmit(bet?.predicted_away_score ?? 0))
  }, [bet?.id, bet?.predicted_advances_team_id, bet?.predicted_home_score, bet?.predicted_away_score])

  useEffect(() => {
    if (!advancesRequired) setAdvancesTeamId(null)
  }, [advancesRequired])

  const isFinished = match.status === "finished"
  const isLocked = match.status !== "scheduled"
  const hasBet = !!bet

  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 15_000)
    return () => clearInterval(t)
  }, [])

  const beforeKickoff = isBeforeMatchKickoff(match.match_date, nowMs)
  const canBet = match.status === "scheduled" && beforeKickoff

  const stageLabels: Record<string, string> = {
    group: "Fase de Grupos",
    round_of_32: "16-avos",
    round_of_16: "Oitavas",
    quarter_final: "Quartas",
    semi_final: "Semi",
    third_place: "3o Lugar",
    final: "Final",
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    if (!canBet) {
      setError("Apostas encerradas após o início da partida (mesmo instante da base de dados).")
      setIsSubmitting(false)
      return
    }

    if (advancesRequired && !advancesTeamId) {
      setError("Em caso de empate no mata-mata, escolha quem passa de fase.")
      setIsSubmitting(false)
      return
    }

    const supabase = createClient()

    const advancesPayload =
      !isGroupStage(match.stage) && isKnockoutEliminationStage(match.stage) && homeScore === awayScore
        ? advancesTeamId
        : null

    const home = palpiteScoreForSubmit(homeScore)
    const away = palpiteScoreForSubmit(awayScore)

    try {
      if (hasBet) {
        const { error: updateErr } = await supabase
          .from("bets")
          .update({
            predicted_home_score: home,
            predicted_away_score: away,
            predicted_advances_team_id: advancesPayload,
          })
          .eq("id", bet.id)
        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase.from("bets").insert({
          user_id: userId,
          match_id: match.id,
          predicted_home_score: home,
          predicted_away_score: away,
          predicted_advances_team_id: advancesPayload,
        })
        if (insertErr) throw insertErr
      }
      onBetPlaced()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar aposta")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPointsBadge = () => {
    if (!isFinished || !bet) return null
    const points = bet.points_earned ?? 0
    if (points === 0) return <Badge variant="secondary" className="text-muted-foreground">0 pts</Badge>

    if (isKnockoutEliminationStage(match.stage)) {
      const label = knockoutPointsLabel(points)
      return (
        <Badge className="bg-primary text-primary-foreground">
          +{points} {label ?? "pts"}
        </Badge>
      )
    }

    if (points === POINTS_EXACT) return <Badge className="bg-primary text-primary-foreground">+{POINTS_EXACT} Exato!</Badge>
    if (points === POINTS_RESULT) return <Badge className="bg-accent text-accent-foreground">+{POINTS_RESULT} Resultado</Badge>
    return <Badge variant="secondary" className="text-muted-foreground">0 pts</Badge>
  }

  return (
    <Card
      id={`match-${match.id}`}
      className={cn(
        "overflow-hidden rounded-2xl border-border/80 shadow-sm transition-all scroll-mt-24",
        isFinished && "opacity-80",
        hasBet && !isFinished && "ring-2 ring-primary/25",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs text-muted-foreground border-border">
              {stageLabels[match.stage] || match.stage}
              {match.group_name ? ` - ${match.group_name}` : ""}
            </Badge>
            {isLocked && (
              <Lock className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
          <span
            className="text-xs text-muted-foreground"
            title="Data e hora no horário de Brasília"
          >
            {formatMatchDateTimeBrazil(match.match_date)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-center gap-1 text-center">
            <CountryFlag countryName={match.home_team.name} size="xl" title={match.home_team.name} />
            <span className="text-xs font-bold uppercase text-muted-foreground">{match.home_team.code}</span>
            <span className="text-sm font-medium text-card-foreground">{match.home_team.name}</span>
          </div>

          {isFinished ? (
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-card-foreground">{match.home_score}</span>
                <span className="text-sm text-muted-foreground">x</span>
                <span className="text-2xl font-bold text-card-foreground">{match.away_score}</span>
              </div>
              {match.home_score != null &&
                match.away_score != null &&
                match.home_score === match.away_score &&
                match.home_penalty_score != null &&
                match.away_penalty_score != null && (
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Pen. {match.home_penalty_score}–{match.away_penalty_score}
                  </span>
                )}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              VS
            </div>
          )}

          <div className="flex flex-1 flex-col items-center gap-1 text-center">
            <CountryFlag countryName={match.away_team.name} size="xl" title={match.away_team.name} />
            <span className="text-xs font-bold uppercase text-muted-foreground">{match.away_team.code}</span>
            <span className="text-sm font-medium text-card-foreground">{match.away_team.name}</span>
          </div>
        </div>

        {!isLocked && (
          <div className="mt-4 flex flex-col gap-3">
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent text-foreground border-border"
                  onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                  disabled={homeScore === 0 || !canBet}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={2}
                  value={formatPalpiteScoreDisplay(homeScore)}
                  onChange={(e) => setHomeScore(parsePalpiteScoreInput(e.target.value))}
                  disabled={!canBet}
                  className="h-8 w-12 text-center text-sm font-bold disabled:opacity-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent text-foreground border-border"
                  onClick={() => setHomeScore(homeScore + 1)}
                  disabled={!canBet}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <span className="text-xs font-medium text-muted-foreground">x</span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent text-foreground border-border"
                  onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                  disabled={awayScore === 0 || !canBet}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={2}
                  value={formatPalpiteScoreDisplay(awayScore)}
                  onChange={(e) => setAwayScore(parsePalpiteScoreInput(e.target.value))}
                  disabled={!canBet}
                  className="h-8 w-12 text-center text-sm font-bold disabled:opacity-50"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent text-foreground border-border"
                  onClick={() => setAwayScore(awayScore + 1)}
                  disabled={!canBet}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {advancesRequired && (
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <span className="text-xs font-medium text-foreground">Empate no mata-mata: quem passa de fase?</span>
                <span className="text-[11px] text-muted-foreground">
                  Obrigatório escolher o classificado. Placar exato +20; empate exato + classificado +18; vencedor
                  certo + placar errado +15.
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={advancesTeamId === match.home_team.id ? "default" : "outline"}
                    size="sm"
                    className="flex-1 min-w-[120px]"
                    disabled={!canBet}
                    onClick={() => setAdvancesTeamId(match.home_team.id)}
                  >
                    <CountryFlag countryName={match.home_team.name} size="sm" /> {match.home_team.code}
                  </Button>
                  <Button
                    type="button"
                    variant={advancesTeamId === match.away_team.id ? "default" : "outline"}
                    size="sm"
                    className="flex-1 min-w-[120px]"
                    disabled={!canBet}
                    onClick={() => setAdvancesTeamId(match.away_team.id)}
                  >
                    <CountryFlag countryName={match.away_team.name} size="sm" /> {match.away_team.code}
                  </Button>
                </div>
              </div>
            )}

            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !canBet || (advancesRequired && !advancesTeamId)}
              className={cn(
                "w-full",
                !canBet
                  ? "bg-gray-500 text-gray-50 hover:bg-gray-500"
                  : hasBet
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-blue-600 text-white hover:bg-blue-700",
              )}
            >
              <Check className="mr-1 h-4 w-4" />
              {isSubmitting ? "Salvando..." : hasBet ? "Atualizar Aposta" : "Confirmar Aposta"}
            </Button>
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
            {match.status === "scheduled" && !beforeKickoff && (
              <p className="text-xs text-center text-muted-foreground">
                Apostas encerradas — o jogo já começou (data/hora da partida em horário de Brasília).
              </p>
            )}
          </div>
        )}

        {hasBet && isLocked && (
          <div className="mt-3 flex flex-col gap-1 rounded-md bg-muted px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Sua aposta: {bet.predicted_home_score} x {bet.predicted_away_score}
              {bet.predicted_advances_team_id && (
                <span className="text-foreground">
                  {" "}
                  — passa:{" "}
                  {bet.predicted_advances_team_id === match.home_team.id
                    ? match.home_team.name
                    : match.away_team.name}
                </span>
              )}
            </span>
            {getPointsBadge()}
          </div>
        )}

        {partialResult ? (
          <MatchPartialResultBanner
            className="mt-3"
            result={partialResult}
            homeCode={match.home_team.code}
            awayCode={match.away_team.code}
          />
        ) : null}

        <MatchSavedOddsPanel matchId={match.id} />
      </CardContent>
    </Card>
  )
}
