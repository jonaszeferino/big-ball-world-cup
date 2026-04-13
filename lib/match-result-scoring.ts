import type { SupabaseClient } from "@supabase/supabase-js"

/** 3 pts placar exato, 1 pt vencedor/empate certo, 0 caso contrario */
export function calculateBetPoints(
  actualHome: number,
  actualAway: number,
  predictedHome: number,
  predictedAway: number,
): number {
  if (actualHome === predictedHome && actualAway === predictedAway) return 3

  const actualResult =
    actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw"
  const predictedResult =
    predictedHome > predictedAway ? "home" : predictedHome < predictedAway ? "away" : "draw"

  if (actualResult === predictedResult) return 1
  return 0
}

/**
 * Grava placar na partida, atualiza points_earned nas apostas e ajusta total_points dos perfis (delta).
 */
export async function applyMatchResultAndUpdateBets(
  supabase: SupabaseClient,
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<{ error: string | null }> {
  const { error: matchErr } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: "finished",
      completed_at: new Date().toISOString(),
    })
    .eq("id", matchId)

  if (matchErr) return { error: matchErr.message }

  const { data: bets } = await supabase
    .from("bets")
    .select("id, user_id, predicted_home_score, predicted_away_score, points_earned")
    .eq("match_id", matchId)

  if (!bets?.length) return { error: null }

  const deltaByUser: Record<string, number> = {}

  for (const bet of bets) {
    const oldPoints = bet.points_earned ?? 0
    const newPoints = calculateBetPoints(
      homeScore,
      awayScore,
      bet.predicted_home_score,
      bet.predicted_away_score,
    )
    const { error: betErr } = await supabase
      .from("bets")
      .update({ points_earned: newPoints })
      .eq("id", bet.id)
    if (betErr) return { error: betErr.message }

    const delta = newPoints - oldPoints
    if (delta !== 0) {
      deltaByUser[bet.user_id] = (deltaByUser[bet.user_id] ?? 0) + delta
    }
  }

  for (const [userId, delta] of Object.entries(deltaByUser)) {
    if (delta === 0) continue
    const { data: profile } = await supabase
      .from("profiles")
      .select("total_points")
      .eq("id", userId)
      .single()

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
