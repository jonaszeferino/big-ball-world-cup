import { formatMatchDateTimeBrazilWithYear } from "@/lib/match-datetime-brazil"

/** Fim do prazo fixo: 08/07/2026 23:59:59 (horário de Brasília). */
export const CHAMPION_BET_DEADLINE_MS = Date.UTC(2026, 6, 9, 2, 59, 59, 999)

export function getChampionBetDeadlineMs(
  _firstRoundOf32MatchDateIso?: string | null | undefined,
): number {
  return CHAMPION_BET_DEADLINE_MS
}

export function isChampionBetOpen(
  _firstRoundOf32MatchDateIso: string | null | undefined,
  nowMs: number,
): boolean {
  return nowMs <= CHAMPION_BET_DEADLINE_MS
}

export function formatChampionBetDeadlineLabel(
  _firstRoundOf32MatchDateIso?: string | null | undefined,
): string {
  return formatMatchDateTimeBrazilWithYear(new Date(CHAMPION_BET_DEADLINE_MS).toISOString())
}
