/** Tabelas de grupos simuladas a partir dos placares apostados na fase de grupos. */

export interface SimTeam {
  id: string
  name: string
  code: string
  group_name: string | null
}

export interface SimMatch {
  id: string
  stage: string
  group_name: string | null
  home_team: SimTeam
  away_team: SimTeam
}

export interface SimBet {
  match_id: string
  predicted_home_score: number
  predicted_away_score: number
}

export interface SimulatedTeamStats {
  played: number
  won: number
  draw: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}

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

/** Aplica jogos da fase de grupos onde existe palpite; jogos sem aposta são ignorados. */
export function computeSimulatedGroupStandings(
  teams: SimTeam[],
  matches: SimMatch[],
  bets: SimBet[],
): Map<string, Map<string, SimulatedTeamStats>> {
  const byGroup = new Map<string, Map<string, SimulatedTeamStats>>()

  for (const t of teams) {
    if (!t.group_name) continue
    if (!byGroup.has(t.group_name)) byGroup.set(t.group_name, new Map())
    byGroup.get(t.group_name)!.set(t.id, emptyStats())
  }

  const betByMatch = new Map(bets.map((b) => [b.match_id, b]))

  for (const m of matches) {
    if (m.stage !== "group" || !m.group_name) continue
    const bet = betByMatch.get(m.id)
    if (!bet) continue

    const h = bet.predicted_home_score
    const a = bet.predicted_away_score
    const homeId = m.home_team.id
    const awayId = m.away_team.id

    const row = byGroup.get(m.group_name)
    if (!row) continue
    if (!row.has(homeId) || !row.has(awayId)) continue

    const sh = row.get(homeId)!
    const sa = row.get(awayId)!

    sh.played++
    sa.played++
    sh.goalsFor += h
    sh.goalsAgainst += a
    sa.goalsFor += a
    sa.goalsAgainst += h

    if (h > a) {
      sh.won++
      sh.points += 3
      sa.lost++
    } else if (h < a) {
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

  return byGroup
}

export function sortSimulatedStandings<T extends { stats: SimulatedTeamStats }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (b.stats.points !== a.stats.points) return b.stats.points - a.stats.points
    if (b.stats.goalDiff !== a.stats.goalDiff) return b.stats.goalDiff - a.stats.goalDiff
    return b.stats.goalsFor - a.stats.goalsFor
  })
}

export function countGroupStageMatchesWithBet(
  groupMatches: SimMatch[],
  bets: SimBet[],
): { total: number; withBet: number } {
  const ids = new Set(groupMatches.filter((m) => m.stage === "group").map((m) => m.id))
  const betSet = new Set(bets.filter((b) => ids.has(b.match_id)).map((b) => b.match_id))
  return { total: ids.size, withBet: betSet.size }
}
