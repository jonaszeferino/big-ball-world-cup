import { isBeforeMatchKickoff } from "@/lib/match-datetime-brazil"
import { isGroupStage } from "@/lib/match-stage"
import type { PalpitesApiGroup } from "@/lib/match-bets-board"

export type GroupStageProgress = {
  total: number
  remaining: number
  missingBets: number
  missingBetsOpen: number
}

export function computeGroupStageProgress(
  groups: PalpitesApiGroup[],
  nowMs: number,
): GroupStageProgress {
  const groupMatches = groups.filter((g) => isGroupStage(g.match.stage))
  const remainingMatches = groupMatches.filter((g) => g.match.status !== "finished")
  const missingInRemaining = remainingMatches.filter((g) => !g.myRow)
  const missingOpen = missingInRemaining.filter(
    (g) => g.match.status === "scheduled" && isBeforeMatchKickoff(g.match.match_date, nowMs),
  )

  return {
    total: groupMatches.length,
    remaining: remainingMatches.length,
    missingBets: missingInRemaining.length,
    missingBetsOpen: missingOpen.length,
  }
}
