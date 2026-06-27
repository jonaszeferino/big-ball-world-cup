import { parseMatchKickoffMs } from "@/lib/match-datetime-brazil"

export type MatchesStageTab = {
  value: string
  label: string
}

export const MATCHES_STAGE_TABS: MatchesStageTab[] = [
  { value: "group", label: "Fase de grupos" },
  { value: "round_of_32", label: "16-avos" },
  { value: "round_of_16", label: "Oitavas" },
  { value: "quarter_final", label: "Quartas" },
  { value: "semi_final", label: "Semi" },
  { value: "final", label: "Finais" },
]

/** Após o último jogo de grupos + este intervalo, a aba padrão em Partidas passa a ser 16-avos. */
export const GROUP_STAGE_DEFAULT_TAB_BUFFER_MS = 2 * 60 * 60 * 1000

type MatchLike = { stage: string; status: string; match_date?: string }

export function getLastGroupStageMatchDateIso(
  matches: { stage: string; match_date: string }[],
): string | null {
  const groupMatches = matches.filter((m) => m.stage === "group")
  if (groupMatches.length === 0) return null

  let latest = groupMatches[0]!.match_date
  let latestMs = parseMatchKickoffMs(latest) ?? Number.NEGATIVE_INFINITY
  for (const m of groupMatches) {
    const ms = parseMatchKickoffMs(m.match_date)
    if (ms !== null && ms > latestMs) {
      latest = m.match_date
      latestMs = ms
    }
  }
  return latest
}

export function isAfterGroupStageDefaultTabThreshold(
  matches: { stage: string; match_date: string }[],
  nowMs: number,
): boolean {
  const lastGroupDate = getLastGroupStageMatchDateIso(matches)
  if (!lastGroupDate) return false
  const kickoffMs = parseMatchKickoffMs(lastGroupDate)
  if (kickoffMs === null) return false
  return nowMs >= kickoffMs + GROUP_STAGE_DEFAULT_TAB_BUFFER_MS
}

export function getDefaultMatchesStageTab(
  matches: { stage: string; match_date: string }[],
  nowMs: number,
): string {
  return isAfterGroupStageDefaultTabThreshold(matches, nowMs) ? "round_of_32" : "group"
}

export function matchesForStageValue(matches: MatchLike[], stageValue: string): MatchLike[] {
  return matches.filter((m) => {
    if (stageValue === "final") return m.stage === "final" || m.stage === "third_place"
    return m.stage === stageValue
  })
}

export function isMatchesStageFullyFinished(matches: MatchLike[], stageValue: string): boolean {
  const stageMatches = matchesForStageValue(matches, stageValue)
  if (stageMatches.length === 0) return false
  return stageMatches.every((m) => m.status === "finished")
}

export function getNextMatchesStageTab(currentValue: string): MatchesStageTab | null {
  const idx = MATCHES_STAGE_TABS.findIndex((tab) => tab.value === currentValue)
  if (idx === -1 || idx >= MATCHES_STAGE_TABS.length - 1) return null
  return MATCHES_STAGE_TABS[idx + 1] ?? null
}

export function getMatchesStageTab(value: string): MatchesStageTab | undefined {
  return MATCHES_STAGE_TABS.find((tab) => tab.value === value)
}
