import {
  MATCH_PARTIAL_RESULT_WINDOW_MS,
  formatMatchDateTimeBrazilWithYear,
  parseMatchKickoffMs,
} from "@/lib/match-datetime-brazil"

/** Fecha 10 minutos antes do fim estimado da última partida da fase de grupos. */
export const CHAMPION_BET_CLOSE_BEFORE_END_MS = 10 * 60 * 1000

export function getChampionBetDeadlineMs(lastGroupMatchDateIso: string | null | undefined): number | null {
  const kickoff = lastGroupMatchDateIso ? parseMatchKickoffMs(lastGroupMatchDateIso) : null
  if (kickoff === null) return null
  return kickoff + MATCH_PARTIAL_RESULT_WINDOW_MS - CHAMPION_BET_CLOSE_BEFORE_END_MS
}

export function isChampionBetOpen(lastGroupMatchMatchDateIso: string | null | undefined, nowMs: number): boolean {
  const deadline = getChampionBetDeadlineMs(lastGroupMatchMatchDateIso)
  if (deadline === null) return true
  return nowMs <= deadline
}

export function formatChampionBetDeadlineLabel(lastGroupMatchDateIso: string | null | undefined): string | null {
  const deadlineMs = getChampionBetDeadlineMs(lastGroupMatchDateIso)
  if (deadlineMs === null) return null
  return formatMatchDateTimeBrazilWithYear(new Date(deadlineMs).toISOString())
}
