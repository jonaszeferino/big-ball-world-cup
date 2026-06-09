import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SavedMatchOdds } from "@/lib/match-bets-board"

const ODDS_SELECT =
  "id, odds_api_event_id, match_id, home_name_api, away_name_api, home_name_app, away_name_app, event_date, status, kto_home, kto_draw, kto_away, kto_ml_updated_at, kto_url, bet365_home, bet365_draw, bet365_away, bet365_ml_updated_at, bet365_url, synced_at"

function mapOddsRow(row: Record<string, unknown>): SavedMatchOdds & { matchId: string | null } {
  return {
    matchId: (row.match_id as string | null) ?? null,
    ktoHome: (row.kto_home as string | null) ?? null,
    ktoDraw: (row.kto_draw as string | null) ?? null,
    ktoAway: (row.kto_away as string | null) ?? null,
    bet365Home: (row.bet365_home as string | null) ?? null,
    bet365Draw: (row.bet365_draw as string | null) ?? null,
    bet365Away: (row.bet365_away as string | null) ?? null,
    syncedAt: (row.synced_at as string | null) ?? null,
    ktoUrl: (row.kto_url as string | null) ?? null,
    bet365Url: (row.bet365_url as string | null) ?? null,
  }
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const matchId = new URL(request.url).searchParams.get("matchId")?.trim()

  if (matchId) {
    const { data, error } = await supabase
      .from("match_pre_odds")
      .select(ODDS_SELECT)
      .eq("match_id", matchId)
      .maybeSingle()

    if (error) {
      if (error.message.includes("match_pre_odds")) {
        return NextResponse.json({ row: null })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { row: data ? mapOddsRow(data as Record<string, unknown>) : null },
      { headers: { "Cache-Control": "no-store" } },
    )
  }

  const [{ data: rows, error }, { data: meta, error: metaError }] = await Promise.all([
    supabase.from("match_pre_odds").select(ODDS_SELECT).order("event_date", { ascending: true }),
    supabase.from("odds_sync_meta").select("*").eq("id", 1).maybeSingle(),
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (metaError) {
    return NextResponse.json({ error: metaError.message }, { status: 500 })
  }

  return NextResponse.json({ rows: rows ?? [], meta: meta ?? null })
}
