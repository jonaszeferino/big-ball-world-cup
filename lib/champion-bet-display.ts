import type { ChampionBetTeam } from "@/lib/champion-bet-types"
import { CHAMPION_BET_DEADLINE_MS } from "@/lib/champion-bet-deadline"

export const BOLAO_CHAMPION_HERO_IMAGE_URL =
  "https://pojlbomqwqiqlidennid.supabase.co/storage/v1/object/public/imagens/entende_muito_de_futebol.png"

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
