"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, Trash2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MatchGoalScorerRow {
  id: string
  match_id: string
  team_id: string
  scorer_name: string
  goals: number
}

interface MatchGoalScorersInlineProps {
  matchId: string
  homeTeamId: string
  awayTeamId: string
  homeTeamCode: string
  awayTeamCode: string
  /** Máximo de gols por time (mesmo placar dos campos "Tempo regular"). */
  maxHomeGoals: number
  maxAwayGoals: number
  rows: MatchGoalScorerRow[]
  disabled?: boolean
  onRefresh: () => void | Promise<void>
}

export function MatchGoalScorersInline({
  matchId,
  homeTeamId,
  awayTeamId,
  homeTeamCode,
  awayTeamCode,
  maxHomeGoals,
  maxAwayGoals,
  rows,
  disabled = false,
  onRefresh,
}: MatchGoalScorersInlineProps) {
  const [side, setSide] = useState<"home" | "away">("home")
  const [scorerName, setScorerName] = useState("")
  const [goalCount, setGoalCount] = useState("1")
  const [busy, setBusy] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const totals = useMemo(() => {
    let home = 0
    let away = 0
    for (const r of rows) {
      if (r.team_id === homeTeamId) home += r.goals
      else if (r.team_id === awayTeamId) away += r.goals
    }
    return { home, away }
  }, [rows, homeTeamId, awayTeamId])

  const noGoalsOnPlacar = maxHomeGoals <= 0 && maxAwayGoals <= 0
  const withinLimits = totals.home <= maxHomeGoals && totals.away <= maxAwayGoals
  const fullyAttributed =
    withinLimits && totals.home === maxHomeGoals && totals.away === maxAwayGoals

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = scorerName.trim()
    const n = Math.max(1, parseInt(goalCount, 10) || 1)
    if (!name) return

    const teamId = side === "home" ? homeTeamId : awayTeamId
    const existingRow = rows.find((r) => r.team_id === teamId && r.scorer_name === name)
    const prevForScorer = existingRow?.goals ?? 0
    const otherHome =
      totals.home - (teamId === homeTeamId ? prevForScorer : 0) + (teamId === homeTeamId ? n : 0)
    const otherAway =
      totals.away - (teamId === awayTeamId ? prevForScorer : 0) + (teamId === awayTeamId ? n : 0)

    if (otherHome > maxHomeGoals || otherAway > maxAwayGoals) {
      setLocalError(
        `Passou do placar: no máximo ${homeTeamCode} ${maxHomeGoals} gol(s), ${awayTeamCode} ${maxAwayGoals}. Reduza a quantidade ou altere o marcador já salvo.`,
      )
      return
    }

    setBusy(true)
    setLocalError(null)
    const supabase = createClient()

    const { error: upErr } = await supabase.from("match_goal_scorers").upsert(
      {
        match_id: matchId,
        team_id: teamId,
        scorer_name: name,
        goals: n,
      },
      { onConflict: "match_id,team_id,scorer_name" },
    )

    setBusy(false)
    if (upErr) {
      setLocalError(upErr.message)
      return
    }
    setScorerName("")
    setGoalCount("1")
    await onRefresh()
  }

  async function handleDelete(id: string) {
    setBusy(true)
    setLocalError(null)
    const supabase = createClient()
    const { error: delErr } = await supabase.from("match_goal_scorers").delete().eq("id", id)
    setBusy(false)
    if (delErr) {
      setLocalError(delErr.message)
      return
    }
    await onRefresh()
  }

  if (noGoalsOnPlacar) {
    return (
      <div className="mt-3 w-full rounded-lg border border-dashed border-border bg-muted/30 p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Marcadores (só tempo de jogo · sem disputa de pênaltis)
        </p>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Este bloco fica <strong className="font-medium text-foreground">neste mesmo cartão</strong>, logo abaixo dos botões{" "}
          <strong className="font-medium text-foreground">Salvar resultado</strong> e <strong className="font-medium text-foreground">Encerrar partida no bolão</strong>.
          Enquanto o placar em <strong className="font-medium text-foreground">Tempo regular</strong> estiver{" "}
          <strong className="font-medium text-foreground">0 a 0</strong>, não dá para distribuir gols entre jogadores — coloque pelo menos um gol em
          algum time (o formulário abre na hora).
        </p>
        {rows.length > 0 && (
          <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300">
            Existem {rows.length} marcador(es) salvos neste jogo, mas o placar atual é 0×0. Ajuste o placar ou apague entradas antigas.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="mt-3 w-full rounded-lg border border-border/90 bg-background/80 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Marcadores (só tempo de jogo · sem disputa de pênaltis)
      </p>
      <p className="mb-3 text-[11px] leading-snug text-muted-foreground">
        Você pode incluir ou mudar os marcadores quando quiser; a regra é não ultrapassar os gols de cada time no placar
        acima. Não há cadastro de jogador — na página Artilheiros, nomes iguais no mesmo time são somados (sem diferenciar
        maiúsculas de minúsculas).
      </p>

      {localError && (
        <p className="mb-2 text-xs text-destructive" role="alert">
          {localError}
        </p>
      )}

      <div
        className={cn(
          "mb-3 flex flex-wrap items-center gap-2 rounded-md border px-2 py-1.5 text-[11px]",
          !withinLimits && "border-destructive/50 bg-destructive/10",
          withinLimits && fullyAttributed && "border-green-600/35 bg-green-600/5",
          withinLimits && !fullyAttributed && "border-sky-600/35 bg-sky-600/5",
        )}
      >
        {!withinLimits ? (
          <>
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
            <span className="text-destructive">
              A soma dos marcadores ({totals.home}×{totals.away}) passou do placar permitido ({maxHomeGoals}×{maxAwayGoals}
              ). Remova ou edite linhas até ficar dentro do limite (ou corrija o placar).
            </span>
          </>
        ) : fullyAttributed ? (
          <span className="font-medium text-green-800 dark:text-green-300">
            Todos os gols do placar foram para marcadores ({maxHomeGoals}×{maxAwayGoals}).
          </span>
        ) : (
          <span className="text-sky-950 dark:text-sky-100">
            Limite do placar: <strong>{maxHomeGoals}×{maxAwayGoals}</strong> · Marcadores por enquanto:{" "}
            <strong>
              {totals.home}×{totals.away}
            </strong>
            . Você pode completar depois — só não pode passar do limite por time.
          </span>
        )}
      </div>

      {rows.length > 0 && (
        <ul className="mb-3 divide-y divide-border/70 rounded-md border border-border/60">
          {rows.map((r) => {
            const code = r.team_id === homeTeamId ? homeTeamCode : awayTeamCode
            return (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5 text-xs"
              >
                <span>
                  <span className="font-medium">{r.scorer_name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    ({code}) · {r.goals} {r.goals === 1 ? "gol" : "gols"}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  disabled={disabled || busy}
                  aria-label={`Remover ${r.scorer_name}`}
                  onClick={() => void handleDelete(r.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full space-y-1 sm:w-auto">
          <Label className="text-[10px] text-muted-foreground">Time</Label>
          <Select value={side} onValueChange={(v) => setSide(v as "home" | "away")}>
            <SelectTrigger className="h-9 w-full text-xs sm:w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="home">{homeTeamCode}</SelectItem>
              <SelectItem value="away">{awayTeamCode}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full min-w-0 flex-1 space-y-1 sm:min-w-[140px]">
          <Label htmlFor={`scorer-${matchId}`} className="text-[10px] text-muted-foreground">
            Nome do jogador
          </Label>
          <Input
            id={`scorer-${matchId}`}
            value={scorerName}
            onChange={(e) => setScorerName(e.target.value)}
            placeholder="Ex.: Neymar"
            className="h-9 text-xs"
            autoComplete="off"
          />
        </div>
        <div className="w-20 space-y-1">
          <Label htmlFor={`goals-${matchId}`} className="text-[10px] text-muted-foreground">
            Gols
          </Label>
          <Input
            id={`goals-${matchId}`}
            type="number"
            min={1}
            value={goalCount}
            onChange={(e) => setGoalCount(e.target.value)}
            className="h-9 text-xs"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          className="h-9 w-full gap-1 sm:w-auto"
          disabled={disabled || busy || !withinLimits || !scorerName.trim()}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Salvar
        </Button>
      </form>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Se o mesmo nome já existir neste jogo para o time, a quantidade de gols é substituída pelo valor que você acabou de
        salvar.
      </p>
    </div>
  )
}
