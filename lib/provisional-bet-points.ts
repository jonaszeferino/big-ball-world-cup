import type { BetsBoardMatch, BetsBoardRow } from "@/lib/match-bets-board"
import type { PartialMatchResult } from "@/lib/match-partial-result"
import { isGroupStage, isKnockoutEliminationStage } from "@/lib/match-stage"
import {
  calculateBetPoints,
  knockoutPointsLabel,
  POINTS_EXACT,
  POINTS_RESULT,
} from "@/lib/match-result-scoring"

function advancesTeamIdFromRow(match: BetsBoardMatch, advancesCode: string | null): string | null {
  if (!advancesCode) return null
  if (advancesCode === match.home_team.code) return match.home_team.id
  if (advancesCode === match.away_team.code) return match.away_team.id
  return null
}

export function calculateProvisionalBetPoints(
  partial: PartialMatchResult,
  match: BetsBoardMatch,
  row: Pick<BetsBoardRow, "homeScore" | "awayScore" | "advancesCode">,
): number {
  return calculateBetPoints(partial.homeScore, partial.awayScore, row.homeScore, row.awayScore, {
    stage: match.stage,
    homeTeamId: match.home_team.id,
    awayTeamId: match.away_team.id,
    homePenalty: partial.homePenalty ?? null,
    awayPenalty: partial.awayPenalty ?? null,
    predictedAdvancesTeamId: advancesTeamIdFromRow(match, row.advancesCode),
  })
}

export function provisionalPointsHint(stage: string, points: number): string | null {
  if (isKnockoutEliminationStage(stage)) return knockoutPointsLabel(points)
  if (!isGroupStage(stage)) return null
  if (points === POINTS_EXACT) return "exato"
  if (points === POINTS_RESULT) return "resultado"
  return null
}
