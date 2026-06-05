import { formatMatchDateTimeBrazilWithYear, isBeforeMatchKickoff, arePalpitesRevealed } from "@/lib/match-datetime-brazil"

export interface BetsBoardMatch {
  id: string
  match_date: string
  status: string
  stage: string
  group_name: string | null
  home_team: { id: string; code: string; name: string }
  away_team: { id: string; code: string; name: string }
}

export interface BetsBoardBet {
  match_id: string
  user_id: string
  predicted_home_score: number
  predicted_away_score: number
  predicted_advances_team_id: string | null
}

export interface BetsBoardProfile {
  id: string
  display_name: string
}

export interface BetsBoardRow {
  userId: string
  displayName: string
  homeScore: number
  awayScore: number
  advancesCode: string | null
}

export interface BetsBoardGroup {
  match: BetsBoardMatch
  whenLabel: string
  bettingOpen: boolean
  /** Palpites só ficam visíveis a partir do horário de início (apito). */
  palpitesRevealed: boolean
  rows: BetsBoardRow[]
}

/** Resposta da API /api/palpites — antes do apito não inclui rows com placares. */
export type PalpitesApiGroup = Omit<BetsBoardGroup, "rows"> & {
  betCount: number
  rows: BetsBoardRow[]
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
): BetsBoardGroup[] {
  const namesById = Object.fromEntries(profiles.map((p) => [p.id, p.display_name]))
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
        .map((bet) => ({
          userId: bet.user_id,
          displayName: namesById[bet.user_id] ?? "Apostador",
          homeScore: bet.predicted_home_score,
          awayScore: bet.predicted_away_score,
          advancesCode: advancesCodeForBet(bet, match),
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName, "pt-BR"))

      return {
        match,
        whenLabel: formatMatchDateTimeBrazilWithYear(match.match_date),
        bettingOpen: match.status === "scheduled" && isBeforeMatchKickoff(match.match_date, nowMs),
        palpitesRevealed: arePalpitesRevealed(match.match_date, nowMs),
        rows,
      }
    })
}
