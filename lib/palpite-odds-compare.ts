import type { SavedMatchOdds } from "@/lib/match-bets-board"
import { parseOdd } from "@/lib/odds-display"

export type PalpiteOutcome = "home" | "draw" | "away"

export function palpiteOutcome(homeScore: number, awayScore: number): PalpiteOutcome {
  if (homeScore > awayScore) return "home"
  if (homeScore < awayScore) return "away"
  return "draw"
}

export function outcomeLabel(
  outcome: PalpiteOutcome,
  homeCode: string,
  awayCode: string,
): string {
  if (outcome === "home") return `Casa (${homeCode})`
  if (outcome === "away") return `Fora (${awayCode})`
  return "Empate"
}

export function oddForOutcome(
  odds: SavedMatchOdds,
  bookmaker: "kto" | "bet365",
  outcome: PalpiteOutcome,
): string | null {
  if (bookmaker === "kto") {
    if (outcome === "home") return odds.ktoHome
    if (outcome === "draw") return odds.ktoDraw
    return odds.ktoAway
  }
  if (outcome === "home") return odds.bet365Home
  if (outcome === "draw") return odds.bet365Draw
  return odds.bet365Away
}

export function favoriteOutcome(odds: SavedMatchOdds, bookmaker: "kto" | "bet365"): PalpiteOutcome | null {
  const entries: Array<[PalpiteOutcome, number | null]> =
    bookmaker === "kto"
      ? [
          ["home", parseOdd(odds.ktoHome)],
          ["draw", parseOdd(odds.ktoDraw)],
          ["away", parseOdd(odds.ktoAway)],
        ]
      : [
          ["home", parseOdd(odds.bet365Home)],
          ["draw", parseOdd(odds.bet365Draw)],
          ["away", parseOdd(odds.bet365Away)],
        ]

  const valid = entries.filter(([, v]) => v != null) as Array<[PalpiteOutcome, number]>
  if (valid.length === 0) return null

  valid.sort((a, b) => a[1] - b[1])
  return valid[0][0]
}

export function hasAnySavedOdds(odds: SavedMatchOdds | null | undefined): boolean {
  if (!odds) return false
  return Boolean(
    odds.ktoHome ||
      odds.ktoDraw ||
      odds.ktoAway ||
      odds.bet365Home ||
      odds.bet365Draw ||
      odds.bet365Away,
  )
}
