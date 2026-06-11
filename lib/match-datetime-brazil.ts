/** Horário de Brasília (exibição) e comparação pelo mesmo instante absoluto que o backend (timestamptz). */

export function parseMatchKickoffMs(matchDateIso: string): number | null {
  const ms = new Date(matchDateIso).getTime()
  return Number.isFinite(ms) ? ms : null
}

export function formatMatchDateTimeBrazil(matchDateIso: string): string {
  const kickoff = parseMatchKickoffMs(matchDateIso)
  if (kickoff === null) return "—"
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(kickoff))
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ""
  return `${get("day")}/${get("month")} ${get("hour")}:${get("minute")}`
}

/** Com ano — útil quando o palpite depende da data correta no banco. */
export function formatMatchDateTimeBrazilWithYear(matchDateIso: string): string {
  const kickoff = parseMatchKickoffMs(matchDateIso)
  if (kickoff === null) return "—"
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(kickoff))
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ""
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`
}

/** true se o relógio do utilizador ainda não passou do instante de início guardado em ISO (UTC). */
export function isBeforeMatchKickoff(matchDateIso: string, nowMs: number): boolean {
  const kickoff = parseMatchKickoffMs(matchDateIso)
  if (kickoff === null) return true
  return nowMs < kickoff
}

/** Palpites públicos só a partir do apito; se a data for inválida, mantém oculto. */
export function arePalpitesRevealed(matchDateIso: string, nowMs: number): boolean {
  const kickoff = parseMatchKickoffMs(matchDateIso)
  if (kickoff === null) return false
  return nowMs >= kickoff
}

/** Janela estimada do jogo (90'+intervalo+acréscimos+prorrogação). */
export const MATCH_PARTIAL_RESULT_WINDOW_MS = 3 * 60 * 60 * 1000

/** Resultado parcial só durante o horário em que o jogo está a decorrer. */
export function isDuringMatchScheduleWindow(matchDateIso: string, nowMs: number): boolean {
  const kickoff = parseMatchKickoffMs(matchDateIso)
  if (kickoff === null) return false
  return nowMs >= kickoff && nowMs < kickoff + MATCH_PARTIAL_RESULT_WINDOW_MS
}

export const KICKOFF_REMINDER_MS = 10 * 60 * 1000

/** true nos 10 minutos antes do apito (inclusive), ainda sem o jogo ter começado. */
export function isInKickoffReminderWindow(matchDateIso: string, nowMs: number): boolean {
  const kickoffMs = new Date(matchDateIso).getTime()
  return nowMs >= kickoffMs - KICKOFF_REMINDER_MS && nowMs < kickoffMs
}
