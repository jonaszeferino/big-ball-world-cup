import {
  formatMatchDateTimeBrazilWithYear,
  parseMatchKickoffMs,
} from "@/lib/match-datetime-brazil"

/** Referência: apito da 1ª partida dos 16-avos (round_of_32). */
export const CHAMPION_BET_CLOSE_BEFORE_KICKOFF_MS = 60 * 1000

/** Prazo extra após essa referência (2 dias para palpitar/alterar). */
export const CHAMPION_BET_EXTRA_OPEN_MS = 2 * 24 * 60 * 60 * 1000

export function getChampionBetDeadlineMs(
  firstRoundOf32MatchDateIso: string | null | undefined,
): number | null {
  const kickoff = firstRoundOf32MatchDateIso ? parseMatchKickoffMs(firstRoundOf32MatchDateIso) : null
  if (kickoff === null) return null
  return kickoff - CHAMPION_BET_CLOSE_BEFORE_KICKOFF_MS + CHAMPION_BET_EXTRA_OPEN_MS
}

export function isChampionBetOpen(
  firstRoundOf32MatchDateIso: string | null | undefined,
  nowMs: number,
): boolean {
  const deadline = getChampionBetDeadlineMs(firstRoundOf32MatchDateIso)
  if (deadline === null) return true
  return nowMs <= deadline
}

export function formatChampionBetDeadlineLabel(
  firstRoundOf32MatchDateIso: string | null | undefined,
): string | null {
  const deadlineMs = getChampionBetDeadlineMs(firstRoundOf32MatchDateIso)
  if (deadlineMs === null) return null
  return formatMatchDateTimeBrazilWithYear(new Date(deadlineMs).toISOString())
}
