export type OddHighlight = "favorite" | "underdog" | "neutral"

export function parseOdd(value: string | null | undefined): number | null {
  if (value == null || value === "") return null
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : null
}

export function getOddHighlight(
  value: string | null,
  home: string | null,
  draw: string | null,
  away: string | null,
): OddHighlight {
  const parsed = [
    parseOdd(home),
    parseOdd(draw),
    parseOdd(away),
  ].filter((v): v is number => v != null)

  if (parsed.length === 0) return "neutral"

  const current = parseOdd(value)
  if (current == null) return "neutral"

  const min = Math.min(...parsed)
  const max = Math.max(...parsed)

  if (min !== max && current === min) return "favorite"
  if (min !== max && current === max) return "underdog"
  return "neutral"
}

export function oddHighlightClass(highlight: OddHighlight): string {
  switch (highlight) {
    case "favorite":
      return "font-semibold text-green-600 dark:text-green-400"
    case "underdog":
      return "font-semibold text-red-600 dark:text-red-400"
    default:
      return "text-foreground"
  }
}
