import {
  findTeamsResultForMatch,
  type PartialMatchResult,
  type TeamsResultRow,
} from "@/lib/match-partial-result"
import {
  sortSimulatedStandings,
  type SimMatch,
  type SimTeam,
  type SimulatedTeamStats,
} from "@/lib/simulated-group-standings"
import type { SimStandingRow } from "@/lib/simulated-round-of-32"

const GROUP_LETTERS = "ABCDEFGHIJKL".split("")

function emptyStats(): SimulatedTeamStats {
  return {
    played: 0,
    won: 0,
    draw: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  }
}

type LiveGroupMatch = SimMatch & {
  status: string
  home_score: number | null
  away_score: number | null
}

function resolveEffectiveScore(
  match: LiveGroupMatch,
  officialResults: TeamsResultRow[],
  partialByMatchId: Map<string, PartialMatchResult>,
): { home: number; away: number } | null {
  const teamsResult = findTeamsResultForMatch(match, officialResults)
  if (teamsResult) {
    return { home: teamsResult.goals_home, away: teamsResult.goals_away }
  }

  if (match.status === "finished" && match.home_score != null && match.away_score != null) {
    return { home: match.home_score, away: match.away_score }
  }

  const partial = partialByMatchId.get(match.id)
  if (partial) {
    return { home: partial.homeScore, away: partial.awayScore }
  }

  return null
}

function applyScoreToStats(
  homeId: string,
  awayId: string,
  homeGoals: number,
  awayGoals: number,
  row: Map<string, SimulatedTeamStats>,
) {
  const sh = row.get(homeId)
  const sa = row.get(awayId)
  if (!sh || !sa) return

  sh.played++
  sa.played++
  sh.goalsFor += homeGoals
  sh.goalsAgainst += awayGoals
  sa.goalsFor += awayGoals
  sa.goalsAgainst += homeGoals

  if (homeGoals > awayGoals) {
    sh.won++
    sh.points += 3
    sa.lost++
  } else if (homeGoals < awayGoals) {
    sa.won++
    sa.points += 3
    sh.lost++
  } else {
    sh.draw++
    sa.draw++
    sh.points += 1
    sa.points += 1
  }

  sh.goalDiff = sh.goalsFor - sh.goalsAgainst
  sa.goalDiff = sa.goalsFor - sa.goalsAgainst
}

/** Classificação real dos grupos: resultados oficiais, placares encerrados no bolão e parciais ao vivo. */
export function computeLiveGroupStandings(
  teams: SimTeam[],
  matches: LiveGroupMatch[],
  officialResults: TeamsResultRow[],
  partialByMatchId: Map<string, PartialMatchResult>,
): Record<string, SimStandingRow[]> {
  const statsByGroup = new Map<string, Map<string, SimulatedTeamStats>>()

  for (const t of teams) {
    if (!t.group_name) continue
    if (!statsByGroup.has(t.group_name)) statsByGroup.set(t.group_name, new Map())
    statsByGroup.get(t.group_name)!.set(t.id, emptyStats())
  }

  for (const m of matches) {
    if (m.stage !== "group" || !m.group_name) continue
    const score = resolveEffectiveScore(m, officialResults, partialByMatchId)
    if (!score) continue

    const row = statsByGroup.get(m.group_name)
    if (!row) continue
    applyScoreToStats(m.home_team.id, m.away_team.id, score.home, score.away, row)
  }

  const out: Record<string, SimStandingRow[]> = {}
  for (const letter of GROUP_LETTERS) {
    const groupTeams = teams.filter((t) => t.group_name === letter)
    if (!groupTeams.length) continue
    const statsForGroup = statsByGroup.get(letter)
    if (!statsForGroup) continue

    const rows = groupTeams.map((team) => ({
      team,
      stats: statsForGroup.get(team.id) ?? emptyStats(),
    }))
    out[letter] = sortSimulatedStandings(rows)
  }

  return out
}

export function countLiveGroupMatchesWithScore(
  matches: LiveGroupMatch[],
  officialResults: TeamsResultRow[],
  partialByMatchId: Map<string, PartialMatchResult>,
): { total: number; withScore: number } {
  const groupMatches = matches.filter((m) => m.stage === "group")
  let withScore = 0
  for (const m of groupMatches) {
    if (resolveEffectiveScore(m, officialResults, partialByMatchId)) withScore++
  }
  return { total: groupMatches.length, withScore }
}
