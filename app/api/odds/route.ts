import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const [{ data: rows, error }, { data: meta, error: metaError }] = await Promise.all([
    supabase
      .from("match_pre_odds")
      .select(
        "id, odds_api_event_id, match_id, home_name_api, away_name_api, home_name_app, away_name_app, event_date, status, kto_home, kto_draw, kto_away, kto_ml_updated_at, kto_url, bet365_home, bet365_draw, bet365_away, bet365_ml_updated_at, bet365_url, synced_at",
      )
      .order("event_date", { ascending: true }),
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
