const ODDS_API_BASE = "https://api.odds-api.io/v3"
const WORLD_CUP_LEAGUE = "international-fifa-world-cup"

export interface OddsApiEvent {
  id: number
  home: string
  away: string
  date: string
  status?: string
}

export interface OddsApiOddsResponse {
  id: number
  home: string
  away: string
  date: string
  status?: string
  urls?: Record<string, string>
  bookmakers?: Record<string, unknown[]>
}

function getOddsApiKey(): string {
  const key = process.env.ODDS_API_KEY?.trim()
  if (!key) {
    throw new Error("ODDS_API_KEY não configurada — adiciona em .env.local")
  }
  return key
}

async function fetchOddsApi<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${ODDS_API_BASE}${path}`)
  url.searchParams.set("apiKey", getOddsApiKey())
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), { cache: "no-store" })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`odds-api.io ${res.status}: ${body.slice(0, 200) || res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function fetchWorldCupEvents(): Promise<OddsApiEvent[]> {
  const data = await fetchOddsApi<OddsApiEvent[]>("/events", {
    sport: "football",
    league: WORLD_CUP_LEAGUE,
  })
  return Array.isArray(data) ? data : []
}

export type OddsSyncBookmaker = "KTO" | "Bet365" | "both"

export async function fetchEventOdds(
  eventId: number,
  bookmakers: OddsSyncBookmaker = "both",
): Promise<OddsApiOddsResponse> {
  const param =
    bookmakers === "both" ? "KTO,Bet365" : bookmakers === "KTO" ? "KTO" : "Bet365"
  return fetchOddsApi<OddsApiOddsResponse>("/odds", {
    eventId: String(eventId),
    bookmakers: param,
  })
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
