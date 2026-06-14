import { formatMatchDateTimeBrazilWithYear, isBeforeMatchKickoff, arePalpitesRevealed } from "@/lib/match-datetime-brazil"
import {
  findTeamsResultForMatch,
  resolveOfficialMatchResult,
  resolvePartialMatchResult,
  shouldShowPartialResult,
  type PartialMatchResult,
  type TeamsResultRow,
} from "@/lib/match-partial-result"

export interface BetsBoardMatch {
  id: string
  match_date: string
  status: string
  stage: string
  group_name: string | null
  home_score: number | null
  away_score: number | null
  home_penalty_score?: number | null
  away_penalty_score?: number | null
  home_team: { id: string; code: string; name: string }
  away_team: { id: string; code: string; name: string }
}

export interface BetsBoardBet {
  match_id: string
  user_id: string
  predicted_home_score: number
  predicted_away_score: number
  predicted_advances_team_id: string | null
  points_earned?: number | null
}

export interface SavedMatchOdds {
  ktoHome: string | null
  ktoDraw: string | null
  ktoAway: string | null
  bet365Home: string | null
  bet365Draw: string | null
  bet365Away: string | null
  syncedAt: string | null
  ktoUrl?: string | null
  bet365Url?: string | null
}

export interface OfficialMatchResult {
  homeScore: number
  awayScore: number
  homePenalty?: number | null
  awayPenalty?: number | null
}

export interface BetsBoardProfile {
  id: string
  display_name: string
  status_message?: string | null
}

export interface BetsBoardRow {
  userId: string
  displayName: string
  statusMessage: string | null
  homeScore: number
  awayScore: number
  advancesCode: string | null
  pointsEarned: number | null
}

export interface BetsBoardGroup {
  match: BetsBoardMatch
  whenLabel: string
  bettingOpen: boolean
  /** Palpites só ficam visíveis a partir do horário de início (apito). */
  palpitesRevealed: boolean
  rows: BetsBoardRow[]
  savedOdds: SavedMatchOdds | null
  partialResult: PartialMatchResult | null
  officialResult: OfficialMatchResult | null
}

/** Resposta da API /api/palpites — antes do apito não inclui rows dos outros; myRow é sempre do usuário logado. */
export type PalpitesApiGroup = Omit<BetsBoardGroup, "rows"> & {
  betCount: number
  rows: BetsBoardRow[]
  myRow: BetsBoardRow | null
}

const STAGE_LABELS: Record<string, string> = {
  group: "Fase de grupos",
  round_of_32: "16-avos",
  round_of_16: "Oitavas",
  quarter_final: "Quartas",
  semi_final: "Semi",
  third_place: "3º lugar",
  final: "Final",
}

export function matchStageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage
}

function advancesCodeForBet(
  bet: BetsBoardBet,
  match: BetsBoardMatch,
): string | null {
  if (!bet.predicted_advances_team_id) return null
  if (bet.predicted_advances_team_id === match.home_team.id) return match.home_team.code
  if (bet.predicted_advances_team_id === match.away_team.id) return match.away_team.code
  return null
}

export function buildBetsBoardGroups(
  matches: BetsBoardMatch[],
  bets: BetsBoardBet[],
  profiles: BetsBoardProfile[],
  nowMs: number,
  oddsByMatchId: Map<string, SavedMatchOdds> = new Map(),
  teamsResults: TeamsResultRow[] = [],
): BetsBoardGroup[] {
  const profileById = Object.fromEntries(
    profiles.map((p) => [p.id, { name: p.display_name, status: p.status_message ?? null }]),
  )
  const betsByMatch = new Map<string, BetsBoardBet[]>()

  for (const bet of bets) {
    const list = betsByMatch.get(bet.match_id) ?? []
    list.push(bet)
    betsByMatch.set(bet.match_id, list)
  }

  return [...matches]
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
    .map((match) => {
      const matchBets = betsByMatch.get(match.id) ?? []
      const rows = matchBets
        .map((bet) => {
          const prof = profileById[bet.user_id]
          return {
            userId: bet.user_id,
            displayName: prof?.name ?? "Apostador",
            statusMessage: prof?.status ?? null,
            homeScore: bet.predicted_home_score,
            awayScore: bet.predicted_away_score,
            advancesCode: advancesCodeForBet(bet, match),
            pointsEarned: bet.points_earned ?? null,
          }
        })
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"))

      const teamsResult = findTeamsResultForMatch(match, teamsResults)
      const partialResult = shouldShowPartialResult(
        match,
        resolvePartialMatchResult(match, teamsResult),
        nowMs,
      )
      const officialResult = resolveOfficialMatchResult(match)

      return {
        match,
        whenLabel: formatMatchDateTimeBrazilWithYear(match.match_date),
        bettingOpen: match.status === "scheduled" && isBeforeMatchKickoff(match.match_date, nowMs),
        palpitesRevealed: arePalpitesRevealed(match.match_date, nowMs),
        rows,
        savedOdds: oddsByMatchId.get(match.id) ?? null,
        partialResult,
        officialResult,
      }
    })
}
