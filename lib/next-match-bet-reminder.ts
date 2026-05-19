import { isBeforeMatchKickoff } from "@/lib/match-datetime-brazil"

export interface NextMatchBetReminderMatch {
  id: string
  match_date: string
  status: string
  stage: string
  home_team: { code: string; name: string }
  away_team: { code: string; name: string }
}

/** Tab value em `/matches` (Finais agrupa final e terceiro lugar). */
export function matchStageToMatchesTab(stage: string): string {
  if (stage === "third_place" || stage === "final") return "final"
  return stage
}

/**
 * Primeira partida ainda agendada e antes do apito, por ordem de data.
 * Só devolve se o utilizador ainda não tiver linha de aposta nessa partida.
 */
export function findNextUpcomingMatchWithoutBet(
  matches: NextMatchBetReminderMatch[],
  betMatchIds: Set<string>,
  nowMs: number,
): NextMatchBetReminderMatch | null {
  const open = matches.filter(
    (m) => m.status === "scheduled" && isBeforeMatchKickoff(m.match_date, nowMs),
  )
  open.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
  const next = open[0]
  if (!next || betMatchIds.has(next.id)) return null
  return next
}

/**
 * Próximas partidas ainda agendadas e antes do apito (mesmo critério que o aviso de aposta),
 * por ordem cronológica, limitadas a `limit`.
 */
export function getUpcomingOpenMatches(
  matches: NextMatchBetReminderMatch[],
  nowMs: number,
  limit: number,
): NextMatchBetReminderMatch[] {
  const open = matches.filter(
    (m) => m.status === "scheduled" && isBeforeMatchKickoff(m.match_date, nowMs),
  )
  open.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
  return open.slice(0, Math.max(0, limit))
}
