import type { OfficialMatchResult } from "@/lib/match-bets-board"
import { isDuringMatchScheduleWindow } from "@/lib/match-datetime-brazil"

export interface PartialMatchResult {
  homeScore: number
  awayScore: number
  homePenalty?: number | null
  awayPenalty?: number | null
}

export interface TeamsResultRow {
  team_home: string
  team_away: string
  goals_home: number
  goals_away: number
}

type MatchTeams = {
  home_team: { name: string; code: string }
  away_team: { name: string; code: string }
}

type MatchScores = {
  status: string
  match_date: string
  home_score: number | null
  away_score: number | null
  home_penalty_score?: number | null
  away_penalty_score?: number | null
}

export function findTeamsResultForMatch(
  match: MatchTeams,
  rows: TeamsResultRow[],
): TeamsResultRow | null {
  return (
    rows.find((r) => r.team_home === match.home_team.name && r.team_away === match.away_team.name) ?? null
  )
}

export function resolvePartialMatchResult(
  match: MatchTeams & MatchScores,
  teamsResult: TeamsResultRow | null,
): PartialMatchResult | null {
  if (match.status === "finished") return null

  if (teamsResult) {
    return {
      homeScore: teamsResult.goals_home,
      awayScore: teamsResult.goals_away,
      homePenalty: match.home_penalty_score ?? null,
      awayPenalty: match.away_penalty_score ?? null,
    }
  }

  if (match.home_score != null && match.away_score != null) {
    return {
      homeScore: match.home_score,
      awayScore: match.away_score,
      homePenalty: match.home_penalty_score ?? null,
      awayPenalty: match.away_penalty_score ?? null,
    }
  }

  return null
}

export function shouldShowPartialResult(
  match: MatchScores,
  partial: PartialMatchResult | null,
  nowMs: number,
): PartialMatchResult | null {
  if (!partial || match.status === "finished") return null
  if (!isDuringMatchScheduleWindow(match.match_date, nowMs)) return null
  return partial
}

export function resolveOfficialMatchResult(match: Omit<MatchScores, "match_date">): OfficialMatchResult | null {
  if (match.status !== "finished") return null
  if (match.home_score == null || match.away_score == null) return null
  return { homeScore: match.home_score, awayScore: match.away_score }
}
