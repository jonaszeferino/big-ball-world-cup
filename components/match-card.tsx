"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Minus, Plus, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getCountryFlag } from "@/lib/country-flags"

interface Match {
  id: string
  home_team: { id: string; name: string; code: string }
  away_team: { id: string; name: string; code: string }
  home_score: number | null
  away_score: number | null
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
  points_earned: number
}

interface MatchCardProps {
  match: Match
  bet: Bet | null
  userId: string
  onBetPlaced: () => void
}

export function MatchCard({ match, bet, userId, onBetPlaced }: MatchCardProps) {
  const [homeScore, setHomeScore] = useState(bet?.predicted_home_score ?? 0)
  const [awayScore, setAwayScore] = useState(bet?.predicted_away_score ?? 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFinished = match.status === "finished"
  const isLocked = match.status !== "scheduled"
  const hasBet = !!bet

  // Verificar se a aposta pode ser feita (até 5 minutos antes)
  const now = new Date()
  const matchTime = new Date(match.match_date)
  const timeDiffInMinutes = (matchTime.getTime() - now.getTime()) / (1000 * 60)
  const canBet = timeDiffInMinutes > 5 && !isLocked && !isFinished
  const betLocked = timeDiffInMinutes <= 5 && timeDiffInMinutes > 0 && match.status === "scheduled"

  const stageLabels: Record<string, string> = {
    group: "Fase de Grupos",
    round_of_16: "Oitavas",
    quarter_final: "Quartas",
    semi_final: "Semi",
    third_place: "3o Lugar",
    final: "Final",
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)

    // Validar se ainda pode fazer aposta (5 minutos antes do jogo)
    if (!canBet) {
      setError("Aposta bloqueada. A aposta só pode ser feita até 5 minutos antes da partida.")
      setIsSubmitting(false)
      return
    }

    const supabase = createClient()

    try {
      if (hasBet) {
        const { error: updateErr } = await supabase
          .from("bets")
          .update({
            predicted_home_score: homeScore,
            predicted_away_score: awayScore,
          })
          .eq("id", bet.id)
        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase.from("bets").insert({
          user_id: userId,
          match_id: match.id,
          predicted_home_score: homeScore,
          predicted_away_score: awayScore,
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
    const points = bet.points_earned
    if (points === 3) return <Badge className="bg-primary text-primary-foreground">+3 Exato!</Badge>
    if (points === 1) return <Badge className="bg-accent text-accent-foreground">+1 Acertou</Badge>
    return <Badge variant="secondary" className="text-muted-foreground">0 pts</Badge>
  }

  return (
    <Card className={cn(
      "transition-all",
      isFinished && "opacity-80",
      hasBet && !isFinished && "ring-2 ring-primary/30"
    )}>
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
          <span className="text-xs text-muted-foreground">
            {format(new Date(match.match_date), "dd/MM HH:mm", { locale: ptBR })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-center gap-1 text-center">
            <span className="text-2xl" title={match.home_team.name}>{getCountryFlag(match.home_team.name)}</span>
            <span className="text-xs font-bold uppercase text-muted-foreground">{match.home_team.code}</span>
            <span className="text-sm font-medium text-card-foreground">{match.home_team.name}</span>
          </div>

          {isFinished ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-card-foreground">{match.home_score}</span>
              <span className="text-sm text-muted-foreground">x</span>
              <span className="text-2xl font-bold text-card-foreground">{match.away_score}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
              VS
            </div>
          )}

          <div className="flex flex-1 flex-col items-center gap-1 text-center">
            <span className="text-2xl" title={match.away_team.name}>{getCountryFlag(match.away_team.name)}</span>
            <span className="text-xs font-bold uppercase text-muted-foreground">{match.away_team.code}</span>
            <span className="text-sm font-medium text-card-foreground">{match.away_team.name}</span>
          </div>
        </div>

        {!isLocked && !betLocked && (
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
                  type="number"
                  min={0}
                  value={homeScore}
                  onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={!canBet}
                  className="h-8 w-12 text-center text-sm font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-50"
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
                  type="number"
                  min={0}
                  value={awayScore}
                  onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                  disabled={!canBet}
                  className="h-8 w-12 text-center text-sm font-bold [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-50"
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

            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !canBet}
              className="w-full"
            >
              <Check className="mr-1 h-4 w-4" />
              {isSubmitting ? "Salvando..." : hasBet ? "Atualizar Aposta" : "Confirmar Aposta"}
            </Button>
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
          </div>
        )}

        {betLocked && (
          <div className="mt-4 flex items-center justify-center rounded-md bg-destructive/10 px-3 py-2">
            <Lock className="mr-2 h-4 w-4 text-destructive" />
            <span className="text-xs text-destructive font-medium">
              Aposta bloqueada há {Math.abs(Math.ceil(timeDiffInMinutes))} min
            </span>
          </div>
        )}

        {hasBet && isLocked && (
          <div className="mt-3 flex items-center justify-between rounded-md bg-muted px-3 py-2">
            <span className="text-xs text-muted-foreground">
              Sua aposta: {bet.predicted_home_score} x {bet.predicted_away_score}
            </span>
            {getPointsBadge()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
