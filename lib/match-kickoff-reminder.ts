import { isInKickoffReminderWindow } from "@/lib/match-datetime-brazil"
import type { NextMatchBetReminderMatch } from "@/lib/next-match-bet-reminder"

/** Partidas agendadas que entram na janela de aviso (10 min antes do apito). */
export function findMatchesInKickoffReminderWindow(
  matches: NextMatchBetReminderMatch[],
  nowMs: number,
): NextMatchBetReminderMatch[] {
  return matches
    .filter((m) => m.status === "scheduled" && isInKickoffReminderWindow(m.match_date, nowMs))
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
}
