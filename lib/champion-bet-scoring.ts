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

/**
 * Pontua palpites do campeão quando a final é encerrada no bolão.
 */
export async function applyChampionBetScoringForFinal(
  supabase: SupabaseClient,
  matchId: string,
  homeScore: number,
  awayScore: number,
  homePenalty: number | null,
  awayPenalty: number | null,
): Promise<{ error: string | null }> {
  const { data: matchRow, error: matchErr } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id, stage")
    .eq("id", matchId)
    .single()

  if (matchErr || !matchRow) return { error: matchErr?.message ?? "Partida não encontrada." }
  if (matchRow.stage !== "final") return { error: null }

  const homeTeamId = matchRow.home_team_id as string
  const awayTeamId = matchRow.away_team_id as string

  const championId = resolveAdvancingTeamId(
    homeScore,
    awayScore,
    homeTeamId,
    awayTeamId,
    homePenalty,
    awayPenalty,
    "final",
  )
  if (!championId) return { error: "Não foi possível determinar o campeão (penáltis?)." }

  const runnerUpId = championId === homeTeamId ? awayTeamId : homeTeamId

  const { data: bets, error: betsErr } = await supabase
    .from("champion_bets")
    .select("id, user_id, champion_team_id, runner_up_team_id, points_earned")

  if (betsErr) {
    if (betsErr.message.includes("champion_bets") && betsErr.message.includes("schema cache")) {
      return { error: null }
    }
    return { error: betsErr.message }
  }

  if (!bets?.length) return { error: null }

  const deltaByUser: Record<string, number> = {}

  for (const bet of bets) {
    const b = bet as {
      id: string
      user_id: string
      champion_team_id: string
      runner_up_team_id: string
      points_earned: number | null
    }
    const oldPoints = b.points_earned ?? 0
    const newPoints = calculateChampionBetPoints(
      b.champion_team_id,
      b.runner_up_team_id,
      championId,
      runnerUpId,
    )

    const { error: upErr } = await supabase
      .from("champion_bets")
      .update({ points_earned: newPoints, updated_at: new Date().toISOString() })
      .eq("id", b.id)
    if (upErr) return { error: upErr.message }

    const delta = newPoints - oldPoints
    if (delta !== 0) deltaByUser[b.user_id] = (deltaByUser[b.user_id] ?? 0) + delta
  }

  for (const [userId, delta] of Object.entries(deltaByUser)) {
    if (delta === 0) continue
    const { data: profile } = await supabase.from("profiles").select("total_points").eq("id", userId).single()
    if (profile) {
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ total_points: profile.total_points + delta })
        .eq("id", userId)
      if (profErr) return { error: profErr.message }
    }
  }

  return { error: null }
}
