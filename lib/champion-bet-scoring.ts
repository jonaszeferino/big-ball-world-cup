import type { SupabaseClient } from "@supabase/supabase-js"
import { resolveAdvancingTeamId } from "@/lib/match-result-scoring"

export const POINTS_CHAMPION = 35
export const POINTS_RUNNER_UP = 15
export const POINTS_FINALIST = 10

export function calculateChampionBetPoints(
  championPickId: string,
  runnerUpPickId: string,
  actualChampionId: string,
  actualRunnerUpId: string,
): number {
  const finalTeamIds = new Set([actualChampionId, actualRunnerUpId])
  let points = 0

  if (championPickId === actualChampionId) points += POINTS_CHAMPION
  else if (finalTeamIds.has(championPickId)) points += POINTS_FINALIST

  if (runnerUpPickId === actualRunnerUpId) points += POINTS_RUNNER_UP
  else if (finalTeamIds.has(runnerUpPickId)) points += POINTS_FINALIST

  return points
}

function rpcMissingError(message: string): boolean {
  return (
    message.includes("Could not find the function") ||
    (message.includes("schema cache") &&
      (message.includes("apply_champion_bet_scoring_for_final") ||
        message.includes("reapply_champion_bet_scoring_for_finished_final")))
  )
}

/**
 * Pontua palpites do campeão quando a final é encerrada no bolão.
 * Usa RPC SECURITY DEFINER (RLS só permite update do próprio palpite).
 */
export async function applyChampionBetScoringForFinal(
  supabase: SupabaseClient,
  matchId: string,
  _homeScore: number,
  _awayScore: number,
  _homePenalty: number | null,
  _awayPenalty: number | null,
): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc("apply_champion_bet_scoring_for_final", {
    p_match_id: matchId,
  })

  if (error) {
    if (rpcMissingError(error.message)) {
      return {
        error:
          "Execute scripts/027_champion_bet_scoring_rpc.sql no SQL Editor do Supabase para pontuar palpites do campeão.",
      }
    }
    return { error: error.message }
  }

  return { error: null }
}

/** Recalcula pontos do palpite campeão com base na final já encerrada. */
export async function reapplyChampionBetScoringForFinishedFinal(
  supabase: SupabaseClient,
): Promise<{ error: string | null; data?: Record<string, unknown> }> {
  const { data, error } = await supabase.rpc("reapply_champion_bet_scoring_for_finished_final")

  if (error) {
    if (rpcMissingError(error.message)) {
      return {
        error:
          "Execute scripts/027_champion_bet_scoring_rpc.sql no SQL Editor do Supabase para pontuar palpites do campeão.",
      }
    }
    return { error: error.message }
  }

  return { error: null, data: (data as Record<string, unknown> | null) ?? undefined }
}
