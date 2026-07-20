import type { ChampionBetTeam } from "@/lib/champion-bet-types"
import { CHAMPION_BET_DEADLINE_MS } from "@/lib/champion-bet-deadline"
import { resolveAdvancingTeamId } from "@/lib/match-result-scoring"
import {
  POINTS_CHAMPION,
  POINTS_FINALIST,
  POINTS_RUNNER_UP,
} from "@/lib/champion-bet-scoring"

export { POINTS_CHAMPION, POINTS_FINALIST, POINTS_RUNNER_UP }

export const BOLAO_CHAMPION_HERO_IMAGE_URL =
  "https://pojlbomqwqiqlidennid.supabase.co/storage/v1/object/public/imagens/entende_muito_de_futebol.png"

export type CopaFinalResult = {
  championTeam: ChampionBetTeam
  runnerUpTeam: ChampionBetTeam
  homeScore: number
  awayScore: number
  homePenaltyScore: number | null
  awayPenaltyScore: number | null
}

export type CopaFinalMatchRow = {
  status: string
  stage: string
  home_score: number | null
  away_score: number | null
  home_penalty_score?: number | null
  away_penalty_score?: number | null
  home_team: ChampionBetTeam | null
  away_team: ChampionBetTeam | null
}

export function resolveCopaFinalResult(match: CopaFinalMatchRow | null | undefined): CopaFinalResult | null {
  if (!match || match.stage !== "final" || match.status !== "finished") return null
  if (match.home_score == null || match.away_score == null) return null
  const homeTeam = match.home_team
  const awayTeam = match.away_team
  if (!homeTeam?.id || !awayTeam?.id) return null

  const championId = resolveAdvancingTeamId(
    match.home_score,
    match.away_score,
    homeTeam.id,
    awayTeam.id,
    match.home_penalty_score ?? null,
    match.away_penalty_score ?? null,
    "final",
  )
  if (!championId) return null

  const championTeam = championId === homeTeam.id ? homeTeam : awayTeam
  const runnerUpTeam = championId === homeTeam.id ? awayTeam : homeTeam

  return {
    championTeam,
    runnerUpTeam,
    homeScore: match.home_score,
    awayScore: match.away_score,
    homePenaltyScore: match.home_penalty_score ?? null,
    awayPenaltyScore: match.away_penalty_score ?? null,
  }
}

export function formatCopaFinalScore(result: CopaFinalResult): string {
  const base = `${result.homeScore} × ${result.awayScore}`
  if (result.homePenaltyScore != null && result.awayPenaltyScore != null) {
    return `${base} (pênaltis ${result.homePenaltyScore} × ${result.awayPenaltyScore})`
  }
  return base
}

export type ChampionBetPublicRow = {
  userId: string
  displayName: string
  statusMessage: string | null
  championTeam: ChampionBetTeam
  runnerUpTeam: ChampionBetTeam
  pointsEarned: number
}

export function areChampionBetsPublic(nowMs = Date.now()): boolean {
  return nowMs > CHAMPION_BET_DEADLINE_MS
}

export function parseChampionBetRow(row: Record<string, unknown>): Omit<ChampionBetPublicRow, "userId" | "displayName" | "statusMessage"> | null {
  const championTeam = row.champion_team as ChampionBetTeam | null
  const runnerUpTeam = row.runner_up_team as ChampionBetTeam | null
  if (!championTeam?.id || !runnerUpTeam?.id) return null
  return {
    championTeam,
    runnerUpTeam,
    pointsEarned: (row.points_earned as number) ?? 0,
  }
}
