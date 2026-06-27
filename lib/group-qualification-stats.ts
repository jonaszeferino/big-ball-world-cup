import { computeLiveGroupStandings } from "@/lib/live-group-standings"
import type { TeamsResultRow } from "@/lib/match-partial-result"
import {
  computeSimulatedGroupStandings,
  sortSimulatedStandings,
  type SimBet,
  type SimTeam,
  type SimulatedTeamStats,
} from "@/lib/simulated-group-standings"
import {
  extractQualifiedTeamIds,
  resolveSimulatedRoundOf32,
  type SimStandingRow,
} from "@/lib/simulated-round-of-32"

const GROUP_LETTERS = "ABCDEFGHIJKL".split("")
export const GROUP_QUALIFICATION_SLOTS = 32

const EMPTY_STATS: SimulatedTeamStats = {
  played: 0,
  won: 0,
  draw: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDiff: 0,
  points: 0,
}

export type GroupMatchForQualification = {
  id: string
  stage: string
  group_name: string | null
  status: string
  home_score: number | null
  away_score: number | null
  home_team: SimTeam
  away_team: SimTeam
}

export type GroupBetForQualification = {
  user_id: string
  match_id: string
  predicted_home_score: number
  predicted_away_score: number
}

export function isGroupStageComplete(
  groupMatches: Pick<GroupMatchForQualification, "status" | "home_score" | "away_score">[],
): boolean {
  if (groupMatches.length === 0) return false
  return groupMatches.every(
    (m) => m.status === "finished" && m.home_score != null && m.away_score != null,
  )
}

function buildStandingsByGroup(
  teams: SimTeam[],
  standingsMap: Map<string, Map<string, SimulatedTeamStats>>,
): Record<string, SimStandingRow[]> {
  const out: Record<string, SimStandingRow[]> = {}
  for (const letter of GROUP_LETTERS) {
    const groupTeams = teams.filter((t) => t.group_name === letter)
    if (!groupTeams.length) continue
    const statsForGroup = standingsMap.get(letter)
    if (!statsForGroup) continue
    const rows = groupTeams.map((team) => ({
      team,
      stats: statsForGroup.get(team.id) ?? EMPTY_STATS,
    }))
    out[letter] = sortSimulatedStandings(rows)
  }
  return out
}

function countSetIntersection(a: Set<string>, b: Set<string>): number {
  let n = 0
  for (const id of a) {
    if (b.has(id)) n++
  }
  return n
}

export type GroupQualificationResult = {
  ready: boolean
  totalSlots: number
  hitsByUserId: Map<string, number>
}

export function computeGroupQualificationHits(input: {
  teams: SimTeam[]
  groupMatches: GroupMatchForQualification[]
  officialResults: TeamsResultRow[]
  bets: GroupBetForQualification[]
  profileIds: string[]
}): GroupQualificationResult {
  const emptyHits = new Map(input.profileIds.map((id) => [id, 0]))
  const groupMatches = input.groupMatches.filter((m) => m.stage === "group")

  if (!isGroupStageComplete(groupMatches)) {
    return { ready: false, totalSlots: GROUP_QUALIFICATION_SLOTS, hitsByUserId: emptyHits }
  }

  const liveStandings = computeLiveGroupStandings(
    input.teams,
    groupMatches,
    input.officialResults,
    new Map(),
  )
  const actualQualified = extractQualifiedTeamIds(resolveSimulatedRoundOf32(liveStandings))
  if (!actualQualified) {
    return { ready: false, totalSlots: GROUP_QUALIFICATION_SLOTS, hitsByUserId: emptyHits }
  }

  const groupMatchIds = new Set(groupMatches.map((m) => m.id))
  const betsByUser = new Map<string, SimBet[]>()
  for (const id of input.profileIds) betsByUser.set(id, [])

  for (const bet of input.bets) {
    if (!groupMatchIds.has(bet.match_id)) continue
    betsByUser.get(bet.user_id)?.push({
      match_id: bet.match_id,
      predicted_home_score: bet.predicted_home_score,
      predicted_away_score: bet.predicted_away_score,
    })
  }

  const hitsByUserId = new Map<string, number>()
  for (const userId of input.profileIds) {
    const userBets = betsByUser.get(userId) ?? []
    const standingsMap = computeSimulatedGroupStandings(input.teams, groupMatches, userBets)
    const simStandings = buildStandingsByGroup(input.teams, standingsMap)
    const predictedQualified = extractQualifiedTeamIds(resolveSimulatedRoundOf32(simStandings))
    hitsByUserId.set(
      userId,
      predictedQualified ? countSetIntersection(predictedQualified, actualQualified) : 0,
    )
  }

  return { ready: true, totalSlots: GROUP_QUALIFICATION_SLOTS, hitsByUserId }
}
