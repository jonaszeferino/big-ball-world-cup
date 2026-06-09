export interface MoneylineOdds {
  home: string | null
  draw: string | null
  away: string | null
  updatedAt: string | null
}

interface OddsMarket {
  name: string
  updatedAt?: string
  odds?: Array<Record<string, string>>
}

export interface BookmakerOddsPayload {
  bookmakers?: Record<string, OddsMarket[]>
  urls?: Record<string, string>
}

function pickMlMarket(markets: OddsMarket[] | undefined): OddsMarket | undefined {
  if (!markets?.length) return undefined
  return markets.find((m) => m.name === "ML") ?? markets[0]
}

export function extractMoneyline(
  payload: BookmakerOddsPayload,
  bookmaker: "KTO" | "Bet365",
): MoneylineOdds {
  const markets = payload.bookmakers?.[bookmaker]
  const ml = pickMlMarket(markets)
  const row = ml?.odds?.[0]
  return {
    home: row?.home ?? null,
    draw: row?.draw ?? null,
    away: row?.away ?? null,
    updatedAt: ml?.updatedAt ?? null,
  }
}

export function extractBookmakerUrl(payload: BookmakerOddsPayload, bookmaker: "KTO" | "Bet365"): string | null {
  return payload.urls?.[bookmaker] ?? null
}
