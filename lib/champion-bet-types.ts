export type ChampionBetTeam = {
  id: string
  name: string
  code: string
}

export type ChampionBetPayload = {
  championTeamId: string
  runnerUpTeamId: string
  championTeam: ChampionBetTeam
  runnerUpTeam: ChampionBetTeam
  pointsEarned: number
  updatedAt: string
}

export type ChampionBetApiResponse = {
  isOpen: boolean
  deadlineMs: number | null
  deadlineLabel: string | null
  lastGroupMatchDate: string | null
  serverNow: number
  bet: ChampionBetPayload | null
  teams: ChampionBetTeam[]
  error?: string
}
