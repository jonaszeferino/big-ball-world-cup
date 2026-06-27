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

const BRAZIL_TZ = "America/Sao_Paulo"

/** Converte ISO UTC para valor de `<input type="datetime-local">` em horário de Brasília. */
export function isoToBrazilDatetimeLocal(matchDateIso: string): string {
  const kickoff = parseMatchKickoffMs(matchDateIso)
  if (kickoff === null) return ""
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(kickoff))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ""
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`
}

/** Valor de datetime-local interpretado como horário de Brasília → ISO UTC. */
export function brazilDatetimeLocalToIso(datetimeLocal: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(datetimeLocal.trim())
  if (!m) {
    const fallback = parseMatchKickoffMs(datetimeLocal)
    return fallback !== null ? new Date(fallback).toISOString() : new Date().toISOString()
  }
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const h = Number(m[4])
  const mi = Number(m[5])
  // Brasília = UTC−3 (sem horário de verão desde 2019)
  return new Date(Date.UTC(y, mo - 1, d, h + 3, mi)).toISOString()
}

/** Ano civil do apito no fuso de Brasília (útil para validar cadastro Copa 2026). */
export function matchKickoffYearBrazil(matchDateIso: string): number | null {
  const kickoff = parseMatchKickoffMs(matchDateIso)
  if (kickoff === null) return null
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TZ,
    year: "numeric",
  }).formatToParts(new Date(kickoff))
  const year = parts.find((p) => p.type === "year")?.value
  return year ? Number(year) : null
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
