import type { SavedMatchOdds } from "@/lib/match-bets-board"
import { Odds1x2Line } from "@/components/odds-1x2-line"
import {
  favoriteOutcome,
  hasAnySavedOdds,
  oddForOutcome,
  outcomeLabel,
  palpiteOutcome,
} from "@/lib/palpite-odds-compare"

export function SavedOddsSummary({ odds }: { odds: SavedMatchOdds }) {
  const syncedLabel = odds.syncedAt
    ? new Date(odds.syncedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : null

  return (
    <div className="border-b border-border/50 bg-muted/15 px-4 py-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Odds pré-jogo salvas
        {syncedLabel ? <span className="font-normal normal-case"> · sync {syncedLabel}</span> : null}
      </p>
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">KTO</p>
          <p className="mt-0.5 text-sm">
            <Odds1x2Line home={odds.ktoHome} draw={odds.ktoDraw} away={odds.ktoAway} />
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Casa · Empate · Fora</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/80 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Bet365</p>
          <p className="mt-0.5 text-sm">
            <Odds1x2Line home={odds.bet365Home} draw={odds.bet365Draw} away={odds.bet365Away} />
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Casa · Empate · Fora</p>
        </div>
      </div>
    </div>
  )
}

export function PalpiteRowOddsCompare({
  homeScore,
  awayScore,
  homeCode,
  awayCode,
  odds,
}: {
  homeScore: number
  awayScore: number
  homeCode: string
  awayCode: string
  odds: SavedMatchOdds | null
}) {
  if (!hasAnySavedOdds(odds)) {
    return <span className="text-xs text-muted-foreground">Sem odds sincronizadas</span>
  }

  const outcome = palpiteOutcome(homeScore, awayScore)
  const label = outcomeLabel(outcome, homeCode, awayCode)
  const ktoOdd = oddForOutcome(odds!, "kto", outcome)
  const bet365Odd = oddForOutcome(odds!, "bet365", outcome)
  const ktoFav = favoriteOutcome(odds!, "kto")
  const matchesFavorite = ktoFav === outcome

  return (
    <div className="flex min-w-[9rem] flex-col items-end gap-1 text-right text-xs sm:min-w-[11rem]">
      <span className="font-medium text-foreground">{label}</span>
      <span className="tabular-nums text-muted-foreground">
        KTO {ktoOdd ?? "—"}
        <span className="mx-1 text-border">|</span>
        Bet365 {bet365Odd ?? "—"}
      </span>
      {ktoFav && matchesFavorite ? (
        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:text-amber-100">
          Favorito KTO
        </span>
      ) : null}
    </div>
  )
}
