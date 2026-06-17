import type { SupabaseClient } from "@supabase/supabase-js"
import {
  isGroupStage,
  isKnockoutEliminationStage,
  requiresPenaltyScores,
  validatePenaltyPair,
} from "@/lib/match-stage"
import { applyChampionBetScoringForFinal } from "@/lib/champion-bet-scoring"

/** PostgREST quando as colunas home_penalty_score / away_penalty_score ainda não existem no banco. Rode scripts/005_match_penalties.sql no Supabase. */
export function matchesPenaltyColumnsMissingError(message: string): boolean {
  return (
    typeof message === "string" &&
    message.includes("penalty_score") &&
    (message.includes("schema cache") || message.includes("Could not find"))
  )
}

export type BetPointsContext = {
  stage: string
  homeTeamId: string
  awayTeamId: string
  homePenalty: number | null
  awayPenalty: number | null
  predictedAdvancesTeamId: string | null
}

/** Fase de grupos (tempo regular). */
export const POINTS_EXACT = 10
export const POINTS_RESULT = 7

/** Mata-mata — tempo regular + classificado nos empates. */
export const KO_POINTS_EXACT = 20
export const KO_POINTS_WINNER_WRONG_SCORE = 12
export const KO_POINTS_EXACT_DRAW_CLASSIFIED = 15
export const KO_POINTS_GENERIC_DRAW_CLASSIFIED = 8
export const KO_POINTS_GENERIC_DRAW_NO_CLASS = 3
export const KO_POINTS_CLASSIFIED_ONLY = 5

/** @deprecated aliases */
export const KO_POINTS_EXACT_WIN = KO_POINTS_EXACT
export const KO_POINTS_WINNER_ONLY = KO_POINTS_CLASSIFIED_ONLY
export const KO_POINTS_EXACT_DRAW_UNCLASSIFIED = KO_POINTS_GENERIC_DRAW_NO_CLASS
export const KO_POINTS_GENERIC_DRAW_UNCLASSIFIED = KO_POINTS_GENERIC_DRAW_NO_CLASS

/** @deprecated Use KO_POINTS_* no mata-mata. */
export const POINTS_ADVANCE_KNOCKOUT = KO_POINTS_GENERIC_DRAW_CLASSIFIED

export const KNOCKOUT_POINT_VALUES = [
  KO_POINTS_EXACT,
  KO_POINTS_WINNER_WRONG_SCORE,
  KO_POINTS_EXACT_DRAW_CLASSIFIED,
  KO_POINTS_GENERIC_DRAW_CLASSIFIED,
  KO_POINTS_GENERIC_DRAW_NO_CLASS,
  KO_POINTS_CLASSIFIED_ONLY,
] as const

export function knockoutPointsLabel(points: number): string | null {
  switch (points) {
    case KO_POINTS_EXACT:
      return "Placar exato"
    case KO_POINTS_WINNER_WRONG_SCORE:
      return "Vencedor + placar errado"
    case KO_POINTS_EXACT_DRAW_CLASSIFIED:
      return "Empate exato + classificado"
    case KO_POINTS_GENERIC_DRAW_CLASSIFIED:
      return "Empate genérico + classificado"
    case KO_POINTS_GENERIC_DRAW_NO_CLASS:
      return "Empate genérico"
    case KO_POINTS_CLASSIFIED_ONLY:
      return "Apenas classificado"
    default:
      return null
  }
}

function predictedWinnerTeamId(
  predictedHome: number,
  predictedAway: number,
  homeTeamId: string,
  awayTeamId: string,
): string | null {
  if (predictedHome > predictedAway) return homeTeamId
  if (predictedAway > predictedHome) return awayTeamId
  return null
}

function actualWinnerTeamId(
  actualHome: number,
  actualAway: number,
  homeTeamId: string,
  awayTeamId: string,
): string | null {
  if (actualHome > actualAway) return homeTeamId
  if (actualAway > actualHome) return awayTeamId
  return null
}

function calculateBetPointsKnockout(
  actualHome: number,
  actualAway: number,
  predictedHome: number,
  predictedAway: number,
  ctx: BetPointsContext,
): number {
  const predDraw = predictedHome === predictedAway
  const actualDraw = actualHome === actualAway
  const exact = predictedHome === actualHome && predictedAway === actualAway

  if (predDraw && !ctx.predictedAdvancesTeamId) {
    return 0
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
  const classifiedCorrect =
    !!ctx.predictedAdvancesTeamId && !!actualAdv && ctx.predictedAdvancesTeamId === actualAdv

  if (exact) {
    if (actualDraw) {
      return classifiedCorrect ? KO_POINTS_EXACT_DRAW_CLASSIFIED : KO_POINTS_GENERIC_DRAW_NO_CLASS
    }
    return KO_POINTS_EXACT
  }

  if (actualDraw && predDraw) {
    return classifiedCorrect ? KO_POINTS_GENERIC_DRAW_CLASSIFIED : KO_POINTS_GENERIC_DRAW_NO_CLASS
  }

  if (!actualDraw) {
    const predWinner = predictedWinnerTeamId(
      predictedHome,
      predictedAway,
      ctx.homeTeamId,
      ctx.awayTeamId,
    )
    const actualWinner = actualWinnerTeamId(actualHome, actualAway, ctx.homeTeamId, ctx.awayTeamId)
    if (predWinner && actualWinner && predWinner === actualWinner) {
      return KO_POINTS_WINNER_WRONG_SCORE
    }
  }

  if (actualAdv) {
    if (classifiedCorrect) return KO_POINTS_CLASSIFIED_ONLY
    const predWinner = predictedWinnerTeamId(
      predictedHome,
      predictedAway,
      ctx.homeTeamId,
      ctx.awayTeamId,
    )
    if (predWinner && predWinner === actualAdv) {
      return KO_POINTS_CLASSIFIED_ONLY
    }
  }

  return 0
}

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
 * Fase de grupos: placar exato ou vencedor/empate no 90'.
 * Mata-mata: tabela KO_POINTS_* (vitória, empate + classificado, etc.).
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

  if (isKnockoutEliminationStage(ctx.stage)) {
    return calculateBetPointsKnockout(actualHome, actualAway, predictedHome, predictedAway, ctx)
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

  const patch: Record<string, unknown> = {
    home_score: homeScore,
    away_score: awayScore,
    status: "finished",
  }
  if (requiresPenaltyScores(stage, homeScore, awayScore)) {
    patch.home_penalty_score = homePen
    patch.away_penalty_score = awayPen
  }

  const { error: matchErr } = await supabase.from("matches").update(patch).eq("id", matchId)

  if (matchErr && matchesPenaltyColumnsMissingError(matchErr.message) && requiresPenaltyScores(stage, homeScore, awayScore)) {
    return {
      error: `${matchErr.message} — No Supabase, execute o script scripts/005_match_penalties.sql para criar as colunas de pênaltis.`,
    }
  }

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

  if (stage === "final") {
    const { error: champErr } = await applyChampionBetScoringForFinal(
      supabase,
      matchId,
      homeScore,
      awayScore,
      homePen,
      awayPen,
    )
    if (champErr) return { error: champErr }
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
  const { error: delScorersErr } = await supabase.from("match_goal_scorers").delete().eq("match_id", matchId)
  if (delScorersErr) return { error: delScorersErr.message }

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

  let { error: matchErr } = await supabase
    .from("matches")
    .update({
      status: "scheduled",
      home_score: null,
      away_score: null,
      home_penalty_score: null,
      away_penalty_score: null,
    })
    .eq("id", matchId)

  if (matchErr && matchesPenaltyColumnsMissingError(matchErr.message)) {
    ;({ error: matchErr } = await supabase
      .from("matches")
      .update({
        status: "scheduled",
        home_score: null,
        away_score: null,
      })
      .eq("id", matchId))
  }

  if (matchErr) return { error: matchErr.message }
  return { error: null }
}
