/** Horário de Brasília (exibição) e comparação pelo mesmo instante absoluto que o backend (timestamptz). */

export function formatMatchDateTimeBrazil(matchDateIso: string): string {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(matchDateIso))
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ""
  return `${get("day")}/${get("month")} ${get("hour")}:${get("minute")}`
}

/** true se o relógio do utilizador ainda não passou do instante de início guardado em ISO (UTC). */
export function isBeforeMatchKickoff(matchDateIso: string, nowMs: number): boolean {
  return nowMs < new Date(matchDateIso).getTime()
}
