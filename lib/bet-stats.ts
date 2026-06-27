import { resolveAdvancingTeamId } from "@/lib/match-result-scoring"
import { isKnockoutEliminationStage } from "@/lib/match-stage"

export type MatchOutcome = "home" | "draw" | "away"

export type MatchOdds = {
  home: number | null
  draw: number | null
  away: number | null
}

export type FinishedMatchForStats = {
  id: string
  home_score: number
  away_score: number
  home_team_id: string
  away_team_id: string
  stage: string
  home_penalty_score: number | null
  away_penalty_score: number | null
}

export type BetForStats = {
  user_id: string
  match_id: string
  predicted_home_score: number
  predicted_away_score: number
  predicted_advances_team_id: string | null
}

export type PlayerBetStats = {
  userId: string
  displayName: string
  statusMessage: string | null
  betGroupId: string | null
  exactScoreHits: number
  resultHits: number
  goalDiffHits: number
  upsetHits: number
  totalGoalsHits: number
  advanceHits: number
  /** Classificados da fase de grupos (1º/2º + 8 melhores 3º) acertados nos palpites. */
  groupQualificationHits: number
  /** Total de vagas (32) quando a fase de grupos está encerrada. */
  groupQualificationTotal: number
  /** Fase de grupos concluída — ranking de classificação disponível. */
  groupQualificationReady: boolean
  /** Maior odd decimal do palpite certo contra favorito (0 = nenhuma). */
  bestUpsetOdd: number
  /** Percentual de acerto de resultado (0–100). */
  resultHitRatePercent: number
  evaluatedBets: number
  upsetEligible: number
}

export type BetStatCategory =
  | "exact"
  | "result"
  | "goalDiff"
  | "upset"
  | "totalGoals"
  | "resultRate"
  | "bestUpsetOdd"
  | "advance"
  | "groupQualification"

export type BetStatCategoryMeta = {
  key: BetStatCategory
  title: string
  description: string
  pick: (p: PlayerBetStats) => number
  formatValue: (p: PlayerBetStats) => string
  /** Jogador entra no ranking desta categoria. */
  qualifies: (p: PlayerBetStats) => boolean
}

/** Mínimo de palpites para ranking de taxa de acerto. */
export const RESULT_RATE_MIN_BETS = 3

export const BET_STAT_CATEGORIES: BetStatCategoryMeta[] = [
  {
    key: "exact",
    title: "Placar exato",
    description: "Acertou o placar completo (gols casa e fora).",
    pick: (p) => p.exactScoreHits,
    formatValue: (p) => String(p.exactScoreHits),
    qualifies: (p) => p.exactScoreHits > 0,
  },
  {
    key: "result",
    title: "Resultado",
    description: "Acertou vitória, empate ou derrota — independente do placar.",
    pick: (p) => p.resultHits,
    formatValue: (p) => String(p.resultHits),
    qualifies: (p) => p.resultHits > 0,
  },
  {
    key: "goalDiff",
    title: "Diferença de gols",
    description: "Acertou o saldo (ex.: 2×0 e 1×0 contam; 3×1 e 2×0 também).",
    pick: (p) => p.goalDiffHits,
    formatValue: (p) => String(p.goalDiffHits),
    qualifies: (p) => p.goalDiffHits > 0,
  },
  {
    key: "totalGoals",
    title: "Total de gols",
    description: "Acertou a soma de gols do jogo (ex.: 2×1 e 3×0 = 3 gols).",
    pick: (p) => p.totalGoalsHits,
    formatValue: (p) => String(p.totalGoalsHits),
    qualifies: (p) => p.totalGoalsHits > 0,
  },
  {
    key: "upset",
    title: "Improváveis",
    description:
      "Palpitou contra o favorito das odds (Bet365 ou KTO) e acertou o resultado — zebras certas.",
    pick: (p) => p.upsetHits,
    formatValue: (p) => String(p.upsetHits),
    qualifies: (p) => p.upsetHits > 0,
  },
  {
    key: "bestUpsetOdd",
    title: "Maior zebra",
    description: "Maior odd do palpite certo contra o favorito — a zebra mais ousada que deu certo.",
    pick: (p) => Math.round(p.bestUpsetOdd * 100),
    formatValue: (p) => formatOddDisplay(p.bestUpsetOdd),
    qualifies: (p) => p.bestUpsetOdd > 0,
  },
  {
    key: "resultRate",
    title: "Taxa de acerto",
    description: `Percentual de resultados certos (mín. ${RESULT_RATE_MIN_BETS} jogos avaliados).`,
    pick: (p) => Math.round(p.resultHitRatePercent * 10),
    formatValue: (p) => formatRateDisplay(p.resultHitRatePercent),
    qualifies: (p) => p.evaluatedBets >= RESULT_RATE_MIN_BETS && p.resultHits > 0,
  },
  {
    key: "advance",
    title: "Classificados",
    description: "No mata-mata, acertou quem passa de fase (inclui penaltis).",
    pick: (p) => p.advanceHits,
    formatValue: (p) => String(p.advanceHits),
    qualifies: (p) => p.advanceHits > 0,
  },
  {
    key: "groupQualification",
    title: "Grupos",
    description:
      "Quantos dos 32 classificados (1º e 2º de cada grupo + 8 melhores terceiros) você acertou nos palpites da fase de grupos.",
    pick: (p) => p.groupQualificationHits,
    formatValue: (p) =>
      p.groupQualificationReady
        ? `${p.groupQualificationHits}/${p.groupQualificationTotal}`
        : "—",
    qualifies: (p) => p.groupQualificationReady && p.groupQualificationHits > 0,
  },
]

export function formatOddDisplay(odd: number): string {
  if (odd <= 0) return "—"
  return odd.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatRateDisplay(percent: number): string {
  return `${percent.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
}

export function parseOddDecimal(value: string | null | undefined): number | null {
  if (value == null || value === "") return null
  const n = Number.parseFloat(String(value).trim().replace(",", "."))
  return Number.isFinite(n) && n > 1 ? n : null
}

export function matchOutcome(home: number, away: number): MatchOutcome {
  if (home > away) return "home"
  if (away > home) return "away"
  return "draw"
}

export function outcomeOdd(odds: MatchOdds, outcome: MatchOutcome): number | null {
  switch (outcome) {
    case "home":
      return odds.home
    case "draw":
      return odds.draw
    case "away":
      return odds.away
  }
}

export function isExactScoreHit(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): boolean {
  return predictedHome === actualHome && predictedAway === actualAway
}

export function isResultHit(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): boolean {
  return matchOutcome(predictedHome, predictedAway) === matchOutcome(actualHome, actualAway)
}

export function isGoalDiffHit(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): boolean {
  return predictedHome - predictedAway === actualHome - actualAway
}

export function isTotalGoalsHit(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
): boolean {
  return predictedHome + predictedAway === actualHome + actualAway
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

export function isAdvanceHit(
  match: FinishedMatchForStats,
  bet: Pick<BetForStats, "predicted_home_score" | "predicted_away_score" | "predicted_advances_team_id">,
): boolean {
  if (!isKnockoutEliminationStage(match.stage)) return false

  const actualAdv = resolveAdvancingTeamId(
    match.home_score,
    match.away_score,
    match.home_team_id,
    match.away_team_id,
    match.home_penalty_score,
    match.away_penalty_score,
    match.stage,
  )
  if (!actualAdv) return false

  if (bet.predicted_home_score === bet.predicted_away_score) {
    return bet.predicted_advances_team_id === actualAdv
  }

  const predWinner = predictedWinnerTeamId(
    bet.predicted_home_score,
    bet.predicted_away_score,
    match.home_team_id,
    match.away_team_id,
  )
  return predWinner === actualAdv
}

/** Menor odd = favorito; empate entre favoritos → sem zebra definida. */
export function favoriteOutcome(odds: MatchOdds): MatchOutcome | null {
  const entries: [MatchOutcome, number][] = []
  if (odds.home != null) entries.push(["home", odds.home])
  if (odds.draw != null) entries.push(["draw", odds.draw])
  if (odds.away != null) entries.push(["away", odds.away])
  if (entries.length < 2) return null

  const min = Math.min(...entries.map((e) => e[1]))
  const favorites = entries.filter((e) => e[1] === min)
  if (favorites.length !== 1) return null
  return favorites[0]![0]
}

export function oddsFromRow(row: {
  bet365_home?: string | null
  bet365_draw?: string | null
  bet365_away?: string | null
  kto_home?: string | null
  kto_draw?: string | null
  kto_away?: string | null
}): MatchOdds | null {
  const bet365: MatchOdds = {
    home: parseOddDecimal(row.bet365_home),
    draw: parseOddDecimal(row.bet365_draw),
    away: parseOddDecimal(row.bet365_away),
  }
  const kto: MatchOdds = {
    home: parseOddDecimal(row.kto_home),
    draw: parseOddDecimal(row.kto_draw),
    away: parseOddDecimal(row.kto_away),
  }

  if (favoriteOutcome(bet365)) return bet365
  if (favoriteOutcome(kto)) return kto
  return null
}

export function isUpsetHit(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  odds: MatchOdds | null,
): boolean {
  if (!odds) return false
  const fav = favoriteOutcome(odds)
  if (!fav) return false
  const predicted = matchOutcome(predictedHome, predictedAway)
  const actual = matchOutcome(actualHome, actualAway)
  return predicted !== fav && predicted === actual
}

export function upsetHitOdd(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  odds: MatchOdds | null,
): number | null {
  if (!isUpsetHit(predictedHome, predictedAway, actualHome, actualAway, odds) || !odds) return null
  const predicted = matchOutcome(predictedHome, predictedAway)
  return outcomeOdd(odds, predicted)
}

export function isUpsetEligible(
  predictedHome: number,
  predictedAway: number,
  odds: MatchOdds | null,
): boolean {
  if (!odds) return false
  const fav = favoriteOutcome(odds)
  if (!fav) return false
  return matchOutcome(predictedHome, predictedAway) !== fav
}

export function computeResultHitRatePercent(resultHits: number, evaluatedBets: number): number {
  if (evaluatedBets <= 0) return 0
  return Math.round((resultHits / evaluatedBets) * 1000) / 10
}

export function sortPlayersByStat(
  players: PlayerBetStats[],
  category: BetStatCategory,
): PlayerBetStats[] {
  const meta = BET_STAT_CATEGORIES.find((c) => c.key === category)
  const pick = meta?.pick ?? ((p) => p.exactScoreHits)

  return [...players].sort((a, b) => {
    const diff = pick(b) - pick(a)
    if (diff !== 0) return diff

    if (category === "resultRate" && b.resultHits !== a.resultHits) {
      return b.resultHits - a.resultHits
    }
    if (category === "bestUpsetOdd" && b.upsetHits !== a.upsetHits) {
      return b.upsetHits - a.upsetHits
    }
    if (category === "groupQualification" && b.groupQualificationHits !== a.groupQualificationHits) {
      return b.groupQualificationHits - a.groupQualificationHits
    }
    if (b.evaluatedBets !== a.evaluatedBets) return b.evaluatedBets - a.evaluatedBets
    return a.displayName.localeCompare(b.displayName, "pt")
  })
}

const EMPTY_AGG: Omit<PlayerBetStats, "userId" | "displayName" | "statusMessage" | "betGroupId"> = {
  exactScoreHits: 0,
  resultHits: 0,
  goalDiffHits: 0,
  upsetHits: 0,
  totalGoalsHits: 0,
  advanceHits: 0,
  groupQualificationHits: 0,
  groupQualificationTotal: 0,
  groupQualificationReady: false,
  bestUpsetOdd: 0,
  resultHitRatePercent: 0,
  evaluatedBets: 0,
  upsetEligible: 0,
}

export function applyGroupQualificationStats(
  players: PlayerBetStats[],
  hitsByUserId: Map<string, number>,
  ready: boolean,
  totalSlots: number,
): PlayerBetStats[] {
  return players.map((p) => {
    const hits = hitsByUserId.get(p.userId) ?? 0
    return {
      ...p,
      groupQualificationHits: ready ? hits : 0,
      groupQualificationTotal: ready ? totalSlots : 0,
      groupQualificationReady: ready,
    }
  })
}

export function computePlayerBetStats(input: {
  profiles: {
    id: string
    display_name: string
    status_message?: string | null
    bet_group_id?: string | number | null
  }[]
  finishedMatches: FinishedMatchForStats[]
  bets: BetForStats[]
  oddsByMatchId: Map<string, MatchOdds>
}): PlayerBetStats[] {
  const matchById = new Map(input.finishedMatches.map((m) => [m.id, m]))
  const agg = new Map<string, Omit<PlayerBetStats, "userId" | "displayName" | "statusMessage" | "betGroupId">>()

  for (const p of input.profiles) {
    agg.set(p.id, { ...EMPTY_AGG })
  }

  for (const bet of input.bets) {
    const match = matchById.get(bet.match_id)
    const row = agg.get(bet.user_id)
    if (!match || !row) continue

    const { home_score: ah, away_score: aa } = match
    const ph = bet.predicted_home_score
    const pa = bet.predicted_away_score
    const odds = input.oddsByMatchId.get(bet.match_id) ?? null

    row.evaluatedBets += 1
    if (isExactScoreHit(ph, pa, ah, aa)) row.exactScoreHits += 1
    if (isResultHit(ph, pa, ah, aa)) row.resultHits += 1
    if (isGoalDiffHit(ph, pa, ah, aa)) row.goalDiffHits += 1
    if (isTotalGoalsHit(ph, pa, ah, aa)) row.totalGoalsHits += 1
    if (isAdvanceHit(match, bet)) row.advanceHits += 1

    if (isUpsetEligible(ph, pa, odds)) row.upsetEligible += 1
    if (isUpsetHit(ph, pa, ah, aa, odds)) {
      row.upsetHits += 1
      const odd = upsetHitOdd(ph, pa, ah, aa, odds)
      if (odd != null && odd > row.bestUpsetOdd) row.bestUpsetOdd = odd
    }
  }

  for (const row of agg.values()) {
    row.resultHitRatePercent = computeResultHitRatePercent(row.resultHits, row.evaluatedBets)
  }

  return input.profiles.map((p) => {
    const a = agg.get(p.id) ?? { ...EMPTY_AGG }
    const bgRaw = p.bet_group_id
    return {
      userId: p.id,
      displayName: p.display_name,
      statusMessage: p.status_message ?? null,
      betGroupId:
        bgRaw !== undefined && bgRaw !== null && String(bgRaw) !== "" ? String(bgRaw) : null,
      ...a,
    }
  })
}

export function getCategoryMeta(category: BetStatCategory): BetStatCategoryMeta {
  return BET_STAT_CATEGORIES.find((c) => c.key === category)!
}
