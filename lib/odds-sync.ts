import type { SupabaseClient } from "@supabase/supabase-js"
import {
  fetchEventOdds,
  fetchWorldCupEvents,
  sleep,
  type OddsApiEvent,
  type OddsSyncBookmaker,
} from "@/lib/odds-api"
import { extractBookmakerUrl, extractMoneyline, type BookmakerOddsPayload } from "@/lib/odds-extract"
import { oddsApiTeamToAppName } from "@/lib/odds-team-names"

const SYNC_DELAY_MS = 120

interface DbMatch {
  id: string
  match_date: string
  status: string
  home_team: { name: string }
  away_team: { name: string }
}

interface ExistingOddsRow {
  odds_api_event_id: number
  match_id: string | null
  kto_home: string | null
  kto_draw: string | null
  kto_away: string | null
  kto_ml_updated_at: string | null
  kto_url: string | null
  kto_raw: unknown
  bet365_home: string | null
  bet365_draw: string | null
  bet365_away: string | null
  bet365_ml_updated_at: string | null
  bet365_url: string | null
  bet365_raw: unknown
}

export interface OddsSyncResult {
  bookmaker: OddsSyncBookmaker
  eventsTotal: number
  eventsSkippedFinished: number
  eventsWithOdds: number
  eventsMissingOdds: number
  upserted: number
  apiCalls: number
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

function isEventLinkedToFinishedMatch(
  event: OddsApiEvent,
  matches: DbMatch[],
  finishedMatchIds: Set<string>,
  existing: ExistingOddsRow | null,
): boolean {
  if (existing?.match_id && finishedMatchIds.has(existing.match_id)) return true

  const homeApp = oddsApiTeamToAppName(event.home)
  const awayApp = oddsApiTeamToAppName(event.away)
  const matchId = findMatchId(matches, homeApp, awayApp, event.date)
  return matchId != null && finishedMatchIds.has(matchId)
}

function mergeOddsRow(
  event: OddsApiEvent,
  oddsPayload: Awaited<ReturnType<typeof fetchEventOdds>>,
  matchId: string | null,
  bookmaker: OddsSyncBookmaker,
  existing: ExistingOddsRow | null,
) {
  const homeApp = oddsApiTeamToAppName(event.home)
  const awayApp = oddsApiTeamToAppName(event.away)
  const payload = oddsPayload as BookmakerOddsPayload
  const now = new Date().toISOString()

  const row: Record<string, unknown> = {
    odds_api_event_id: event.id,
    match_id: matchId ?? existing?.match_id ?? null,
    home_name_api: event.home,
    away_name_api: event.away,
    home_name_app: homeApp,
    away_name_app: awayApp,
    event_date: event.date,
    status: event.status ?? oddsPayload.status ?? "pending",
    synced_at: now,
    kto_home: existing?.kto_home ?? null,
    kto_draw: existing?.kto_draw ?? null,
    kto_away: existing?.kto_away ?? null,
    kto_ml_updated_at: existing?.kto_ml_updated_at ?? null,
    kto_url: existing?.kto_url ?? null,
    kto_raw: existing?.kto_raw ?? null,
    bet365_home: existing?.bet365_home ?? null,
    bet365_draw: existing?.bet365_draw ?? null,
    bet365_away: existing?.bet365_away ?? null,
    bet365_ml_updated_at: existing?.bet365_ml_updated_at ?? null,
    bet365_url: existing?.bet365_url ?? null,
    bet365_raw: existing?.bet365_raw ?? null,
  }

  if (bookmaker === "KTO" || bookmaker === "both") {
    const kto = extractMoneyline(payload, "KTO")
    row.kto_home = kto.home
    row.kto_draw = kto.draw
    row.kto_away = kto.away
    row.kto_ml_updated_at = kto.updatedAt
    row.kto_url = extractBookmakerUrl(payload, "KTO")
    row.kto_raw = oddsPayload.bookmakers?.KTO ?? null
  }

  if (bookmaker === "Bet365" || bookmaker === "both") {
    const bet365 = extractMoneyline(payload, "Bet365")
    row.bet365_home = bet365.home
    row.bet365_draw = bet365.draw
    row.bet365_away = bet365.away
    row.bet365_ml_updated_at = bet365.updatedAt
    row.bet365_url = extractBookmakerUrl(payload, "Bet365")
    row.bet365_raw = oddsPayload.bookmakers?.Bet365 ?? null
  }

  return row
}

function eventHasBookmakerOdds(
  oddsPayload: Awaited<ReturnType<typeof fetchEventOdds>>,
  bookmaker: OddsSyncBookmaker,
): boolean {
  if (bookmaker === "KTO") return Boolean(oddsPayload.bookmakers?.KTO?.length)
  if (bookmaker === "Bet365") return Boolean(oddsPayload.bookmakers?.Bet365?.length)
  return (
    Boolean(oddsPayload.bookmakers?.KTO?.length) ||
    Boolean(oddsPayload.bookmakers?.Bet365?.length)
  )
}

function hasSavedBookmakerOdds(existing: ExistingOddsRow | null, bookmaker: "KTO" | "Bet365"): boolean {
  if (!existing) return false
  if (bookmaker === "KTO") {
    return Boolean(existing.kto_home || existing.kto_draw || existing.kto_away)
  }
  return Boolean(existing.bet365_home || existing.bet365_draw || existing.bet365_away)
}

/** 0 = sem odds (prioridade), 1 = parcial (só both), 2 = completo para a sync pedida */
function getSyncPriority(existing: ExistingOddsRow | null, bookmaker: OddsSyncBookmaker): number {
  if (!existing) return 0

  const hasKto = hasSavedBookmakerOdds(existing, "KTO")
  const hasBet365 = hasSavedBookmakerOdds(existing, "Bet365")

  if (bookmaker === "KTO") return hasKto ? 1 : 0
  if (bookmaker === "Bet365") return hasBet365 ? 1 : 0

  if (!hasKto && !hasBet365) return 0
  if (hasKto && hasBet365) return 2
  return 1
}

function sortEventsForSync(
  events: OddsApiEvent[],
  existingByEventId: Map<number, ExistingOddsRow>,
  bookmaker: OddsSyncBookmaker,
): OddsApiEvent[] {
  return [...events].sort((a, b) => {
    const priorityA = getSyncPriority(existingByEventId.get(a.id) ?? null, bookmaker)
    const priorityB = getSyncPriority(existingByEventId.get(b.id) ?? null, bookmaker)
    if (priorityA !== priorityB) return priorityA - priorityB

    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) return dateA - dateB
    return a.id - b.id
  })
}

export async function syncPreMatchOdds(
  supabase: SupabaseClient,
  userId: string,
  bookmaker: OddsSyncBookmaker = "both",
): Promise<OddsSyncResult> {
  const events = await fetchWorldCupEvents()
  const errors: string[] = []
  let upserted = 0
  let eventsWithOdds = 0
  let apiCalls = 1

  const [{ data: matchRows }, { data: existingRows }] = await Promise.all([
    supabase
      .from("matches")
      .select("id, match_date, status, home_team:home_team_id(name), away_team:away_team_id(name)"),
    supabase
      .from("match_pre_odds")
      .select(
        "odds_api_event_id, match_id, kto_home, kto_draw, kto_away, kto_ml_updated_at, kto_url, kto_raw, bet365_home, bet365_draw, bet365_away, bet365_ml_updated_at, bet365_url, bet365_raw",
      ),
  ])

  const matches = (matchRows ?? []) as unknown as DbMatch[]
  const finishedMatchIds = new Set(matches.filter((m) => m.status === "finished").map((m) => m.id))
  const existingByEventId = new Map<number, ExistingOddsRow>(
    (existingRows ?? []).map((r) => [r.odds_api_event_id as number, r as ExistingOddsRow]),
  )

  const sortedEvents = sortEventsForSync(events, existingByEventId, bookmaker)
  const syncableEvents = sortedEvents.filter(
    (event) => !isEventLinkedToFinishedMatch(event, matches, finishedMatchIds, existingByEventId.get(event.id) ?? null),
  )
  const eventsSkippedFinished = sortedEvents.length - syncableEvents.length
  const eventsMissingOdds = syncableEvents.filter(
    (event) => getSyncPriority(existingByEventId.get(event.id) ?? null, bookmaker) === 0,
  ).length

  for (let i = 0; i < syncableEvents.length; i++) {
    const event = syncableEvents[i]
    try {
      const oddsPayload = await fetchEventOdds(event.id, bookmaker)
      apiCalls++

      if (eventHasBookmakerOdds(oddsPayload, bookmaker)) eventsWithOdds++

      const homeApp = oddsApiTeamToAppName(event.home)
      const awayApp = oddsApiTeamToAppName(event.away)
      const matchId = findMatchId(matches, homeApp, awayApp, event.date)
      const existing = existingByEventId.get(event.id) ?? null
      const row = mergeOddsRow(event, oddsPayload, matchId, bookmaker, existing)

      const { error } = await supabase
        .from("match_pre_odds")
        .upsert(row, { onConflict: "odds_api_event_id" })

      if (error) {
        errors.push(`Evento ${event.id}: ${error.message}`)
      } else {
        upserted++
        existingByEventId.set(event.id, {
          odds_api_event_id: event.id,
          match_id: (row.match_id as string | null) ?? null,
          kto_home: row.kto_home as string | null,
          kto_draw: row.kto_draw as string | null,
          kto_away: row.kto_away as string | null,
          kto_ml_updated_at: row.kto_ml_updated_at as string | null,
          kto_url: row.kto_url as string | null,
          kto_raw: row.kto_raw,
          bet365_home: row.bet365_home as string | null,
          bet365_draw: row.bet365_draw as string | null,
          bet365_away: row.bet365_away as string | null,
          bet365_ml_updated_at: row.bet365_ml_updated_at as string | null,
          bet365_url: row.bet365_url as string | null,
          bet365_raw: row.bet365_raw,
        })
      }
    } catch (err) {
      errors.push(`Evento ${event.id}: ${err instanceof Error ? err.message : "erro"}`)
    }

    if (i < syncableEvents.length - 1) await sleep(SYNC_DELAY_MS)
  }

  const bookmakerLabel =
    bookmaker === "both" ? "KTO + Bet365" : bookmaker === "KTO" ? "KTO" : "Bet365"

  await supabase
    .from("odds_sync_meta")
    .update({
      last_synced_at: new Date().toISOString(),
      last_synced_by: userId,
      events_total: syncableEvents.length,
      events_with_odds: eventsWithOdds,
      last_error: errors.length
        ? `[${bookmakerLabel}] ${errors.slice(0, 5).join(" | ")}`
        : null,
    })
    .eq("id", 1)

  return {
    bookmaker,
    eventsTotal: syncableEvents.length,
    eventsSkippedFinished,
    eventsWithOdds,
    eventsMissingOdds,
    upserted,
    apiCalls,
    errors,
  }
}
