import type { SupabaseClient } from "@supabase/supabase-js"
import {
  isGroupStage,
  isKnockoutEliminationStage,
  requiresPenaltyScores,
  validatePenaltyPair,
} from "@/lib/match-stage"

export type BetPointsContext = {
  stage: string
  homeTeamId: string
  awayTeamId: string
  homePenalty: number | null
  awayPenalty: number | null
  predictedAdvancesTeamId: string | null
}

/** Placar exato (tempo regular). */
export const POINTS_EXACT = 10
/** Vencedor ou empate no tempo regular, sem placar exato. */
export const POINTS_RESULT = 7
/** Mata-mata: acertou quem passa quando o placar/resultado no 90' não valeria 7 ou 10. */
export const POINTS_ADVANCE_KNOCKOUT = 5

/** Equipa que passa no mata-mata (tempo regular ou penáltis). */
export function resolveAdvancingTeamId(
  actualHome: number,
  actualAway: number,
  homeTeamId: string,
  awayTeamId: string,
  homePenalty: number | null,
  awayPenalty: number | null,
  stage: string,
): string | null {
  if (actualHome > actualAway) return homeTeamId
  if (actualAway > actualHome) return awayTeamId
  if (requiresPenaltyScores(stage, actualHome, actualAway)) {
    const v = validatePenaltyPair(homePenalty, awayPenalty)
    if (v.ok) return (homePenalty as number) > (awayPenalty as number) ? homeTeamId : awayTeamId
  }
  return null
}

/** Fase de grupos: só placar exato ou vencedor/empate (sem penáltis nem “quem passa”). */
function calculateBetPointsGroupStage(
  actualHome: number,
  actualAway: number,
  predictedHome: number,
  predictedAway: number,
): number {
  if (actualHome === predictedHome && actualAway === predictedAway) return POINTS_EXACT

  const actualResult =
    actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw"
  const predictedResult =
    predictedHome > predictedAway ? "home" : predictedHome < predictedAway ? "away" : "draw"

  if (actualResult === predictedResult) return POINTS_RESULT
  return 0
}

/**
 * Mata-mata: uma única pontuação por jogo (a melhor que se aplicar, sem somar):
 * - 10 placar exato no tempo regular (inclui empate). Não se soma “quem passa” — o exato já define o quadro.
 * - 7 acertou vencedor ou empate no 90' sem placar exato.
 * - 5 acertou só quem passa (ex.: palpite de empate no 90' errado no marcador, mas equipa certa após penáltis).
 * - 0 nada disto.
 * Empate no palpite sem indicar quem passa: 0 (regra de aposta inválida).
 */
export function calculateBetPoints(
  actualHome: number,
  actualAway: number,
  predictedHome: number,
  predictedAway: number,
  ctx: BetPointsContext,
): number {
  if (isGroupStage(ctx.stage)) {
    return calculateBetPointsGroupStage(actualHome, actualAway, predictedHome, predictedAway)
  }

  const knockout = isKnockoutEliminationStage(ctx.stage)
  const predDraw = predictedHome === predictedAway

  if (knockout && predDraw && !ctx.predictedAdvancesTeamId) {
    return 0
  }

  if (predictedHome === actualHome && predictedAway === actualAway) {
    return POINTS_EXACT
  }

  const actualResult =
    actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw"
  const predictedResult =
    predictedHome > predictedAway ? "home" : predictedHome < predictedAway ? "away" : "draw"

  if (actualResult === predictedResult) {
    return POINTS_RESULT
  }

  const actualAdv = resolveAdvancingTeamId(
    actualHome,
    actualAway,
    ctx.homeTeamId,
    ctx.awayTeamId,
    ctx.homePenalty,
    ctx.awayPenalty,
    ctx.stage,
  )

  if (ctx.predictedAdvancesTeamId && actualAdv && ctx.predictedAdvancesTeamId === actualAdv) {
    return POINTS_ADVANCE_KNOCKOUT
  }

  return 0
}

export type ApplyMatchResultOptions = {
  /** Fase da partida (para exigir penáltis em empates do mata-mata). */
  stage: string
  homePenalty?: number | null
  awayPenalty?: number | null
}

/**
 * Grava placar na partida, atualiza points_earned nas apostas e ajusta total_points dos perfis (delta).
 * Pontuação do bolão usa só o tempo regular (home_score / away_score). Penáltis são só para registo / vencedor no mata-mata.
 */
export async function applyMatchResultAndUpdateBets(
  supabase: SupabaseClient,
  matchId: string,
  homeScore: number,
  awayScore: number,
  options?: ApplyMatchResultOptions,
): Promise<{ error: string | null }> {
  const stage = options?.stage ?? "group"

  let homePen: number | null = null
  let awayPen: number | null = null

  if (requiresPenaltyScores(stage, homeScore, awayScore)) {
    const v = validatePenaltyPair(options?.homePenalty, options?.awayPenalty)
    if (!v.ok) return { error: v.message }
    homePen = options!.homePenalty!
    awayPen = options!.awayPenalty!
  }

  const { error: matchErr } = await supabase
    .from("matches")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      home_penalty_score: homePen,
      away_penalty_score: awayPen,
      status: "finished",
    })
    .eq("id", matchId)

  if (matchErr) return { error: matchErr.message }

  const { data: matchRow, error: rowErr } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id, stage")
    .eq("id", matchId)
    .single()

  if (rowErr || !matchRow?.home_team_id || !matchRow?.away_team_id) {
    return { error: rowErr?.message ?? "Partida sem equipas." }
  }

  const pointsCtxBase: Omit<BetPointsContext, "predictedAdvancesTeamId"> = {
    stage: matchRow.stage as string,
    homeTeamId: matchRow.home_team_id as string,
    awayTeamId: matchRow.away_team_id as string,
    homePenalty: homePen,
    awayPenalty: awayPen,
  }

  const { data: bets } = await supabase
    .from("bets")
    .select("id, user_id, predicted_home_score, predicted_away_score, predicted_advances_team_id, points_earned")
    .eq("match_id", matchId)

  if (!bets?.length) return { error: null }

  const deltaByUser: Record<string, number> = {}

  for (const bet of bets) {
    const b = bet as {
      id: string
      user_id: string
      predicted_home_score: number
      predicted_away_score: number
      predicted_advances_team_id: string | null
      points_earned: number | null
    }
    const oldPoints = b.points_earned ?? 0
    const newPoints = calculateBetPoints(homeScore, awayScore, b.predicted_home_score, b.predicted_away_score, {
      ...pointsCtxBase,
      predictedAdvancesTeamId: b.predicted_advances_team_id,
    })
    const { error: betErr } = await supabase
      .from("bets")
      .update({ points_earned: newPoints })
      .eq("id", b.id)
    if (betErr) return { error: betErr.message }

    const delta = newPoints - oldPoints
    if (delta !== 0) {
      deltaByUser[b.user_id] = (deltaByUser[b.user_id] ?? 0) + delta
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

/**
 * Volta a partida para "agendada", apaga placar e zera pontos das apostas (e ajusta perfis).
 * Use se tiver encerrado por engano ou para testes.
 */
export async function reopenMatchAndResetBets(
  supabase: SupabaseClient,
  matchId: string,
): Promise<{ error: string | null }> {
  const { data: bets } = await supabase
    .from("bets")
    .select("id, user_id, points_earned")
    .eq("match_id", matchId)

  const deltaByUser: Record<string, number> = {}

  for (const bet of bets ?? []) {
    const oldPoints = bet.points_earned ?? 0
    if (oldPoints !== 0) {
      const { error: betErr } = await supabase
        .from("bets")
        .update({ points_earned: 0 })
        .eq("id", bet.id)
      if (betErr) return { error: betErr.message }
      deltaByUser[bet.user_id] = (deltaByUser[bet.user_id] ?? 0) - oldPoints
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
        .update({ total_points: Math.max(0, profile.total_points + delta) })
        .eq("id", userId)
      if (profErr) return { error: profErr.message }
    }
  }

  const { error: matchErr } = await supabase
    .from("matches")
    .update({
      status: "scheduled",
      home_score: null,
      away_score: null,
      home_penalty_score: null,
      away_penalty_score: null,
    })
    .eq("id", matchId)

  if (matchErr) return { error: matchErr.message }
  return { error: null }
}
