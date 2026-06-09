import type { SupabaseClient } from "@supabase/supabase-js"
import { fetchEventOdds, fetchWorldCupEvents, sleep, type OddsApiEvent } from "@/lib/odds-api"
import { extractBookmakerUrl, extractMoneyline, type BookmakerOddsPayload } from "@/lib/odds-extract"
import { oddsApiTeamToAppName } from "@/lib/odds-team-names"

const SYNC_DELAY_MS = 120

interface DbMatch {
  id: string
  match_date: string
  home_team: { name: string }
  away_team: { name: string }
}

export interface OddsSyncResult {
  eventsTotal: number
  eventsWithOdds: number
  upserted: number
  errors: string[]
}

function findMatchId(
  matches: DbMatch[],
  homeApp: string,
  awayApp: string,
  eventDateIso: string,
): string | null {
  const eventMs = new Date(eventDateIso).getTime()
  if (!Number.isFinite(eventMs)) return null

  const candidates = matches.filter(
    (m) => m.home_team.name === homeApp && m.away_team.name === awayApp,
  )
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0].id

  let best = candidates[0]
  let bestDiff = Math.abs(new Date(best.match_date).getTime() - eventMs)
  for (const m of candidates.slice(1)) {
    const diff = Math.abs(new Date(m.match_date).getTime() - eventMs)
    if (diff < bestDiff) {
      best = m
      bestDiff = diff
    }
  }
  return bestDiff <= 3 * 60 * 60 * 1000 ? best.id : null
}

function buildRow(
  event: OddsApiEvent,
  oddsPayload: Awaited<ReturnType<typeof fetchEventOdds>>,
  matchId: string | null,
) {
  const homeApp = oddsApiTeamToAppName(event.home)
  const awayApp = oddsApiTeamToAppName(event.away)
  const payload = oddsPayload as BookmakerOddsPayload
  const kto = extractMoneyline(payload, "KTO")
  const bet365 = extractMoneyline(payload, "Bet365")

  return {
    odds_api_event_id: event.id,
    match_id: matchId,
    home_name_api: event.home,
    away_name_api: event.away,
    home_name_app: homeApp,
    away_name_app: awayApp,
    event_date: event.date,
    status: event.status ?? oddsPayload.status ?? "pending",
    kto_home: kto.home,
    kto_draw: kto.draw,
    kto_away: kto.away,
    kto_ml_updated_at: kto.updatedAt,
    kto_url: extractBookmakerUrl(payload, "KTO"),
    bet365_home: bet365.home,
    bet365_draw: bet365.draw,
    bet365_away: bet365.away,
    bet365_ml_updated_at: bet365.updatedAt,
    bet365_url: extractBookmakerUrl(payload, "Bet365"),
    kto_raw: oddsPayload.bookmakers?.KTO ?? null,
    bet365_raw: oddsPayload.bookmakers?.Bet365 ?? null,
    synced_at: new Date().toISOString(),
  }
}

export async function syncPreMatchOdds(
  supabase: SupabaseClient,
  userId: string,
): Promise<OddsSyncResult> {
  const events = await fetchWorldCupEvents()
  const errors: string[] = []
  let upserted = 0
  let eventsWithOdds = 0

  const { data: matchRows } = await supabase
    .from("matches")
    .select("id, match_date, home_team:home_team_id(name), away_team:away_team_id(name)")

  const matches = (matchRows ?? []) as unknown as DbMatch[]

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    try {
      const oddsPayload = await fetchEventOdds(event.id)
      const hasOdds =
        Boolean(oddsPayload.bookmakers?.KTO?.length) ||
        Boolean(oddsPayload.bookmakers?.Bet365?.length)
      if (hasOdds) eventsWithOdds++

      const homeApp = oddsApiTeamToAppName(event.home)
      const awayApp = oddsApiTeamToAppName(event.away)
      const matchId = findMatchId(matches, homeApp, awayApp, event.date)
      const row = buildRow(event, oddsPayload, matchId)

      const { error } = await supabase
        .from("match_pre_odds")
        .upsert(row, { onConflict: "odds_api_event_id" })

      if (error) {
        errors.push(`Evento ${event.id}: ${error.message}`)
      } else {
        upserted++
      }
    } catch (err) {
      errors.push(`Evento ${event.id}: ${err instanceof Error ? err.message : "erro"}`)
    }

    if (i < events.length - 1) await sleep(SYNC_DELAY_MS)
  }

  await supabase
    .from("odds_sync_meta")
    .update({
      last_synced_at: new Date().toISOString(),
      last_synced_by: userId,
      events_total: events.length,
      events_with_odds: eventsWithOdds,
      last_error: errors.length ? errors.slice(0, 5).join(" | ") : null,
    })
    .eq("id", 1)

  return {
    eventsTotal: events.length,
    eventsWithOdds,
    upserted,
    errors,
  }
}
