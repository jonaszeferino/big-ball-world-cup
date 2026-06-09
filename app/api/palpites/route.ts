import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  buildBetsBoardGroups,
  type BetsBoardBet,
  type BetsBoardMatch,
  type BetsBoardProfile,
  type PalpitesApiGroup,
} from "@/lib/match-bets-board"

function redactForKickoff(groups: BetsBoardGroup[]): PalpitesApiGroup[] {
  return groups.map((group) => {
    if (!group.palpitesRevealed) {
      return {
        ...group,
        betCount: group.rows.length,
        rows: [],
      }
    }
    return {
      ...group,
      betCount: group.rows.length,
      rows: group.rows,
    }
  })
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const nowMs = Date.now()
  const matchSelect =
    "id, match_date, status, stage, group_name, home_team:home_team_id(id, code, name), away_team:away_team_id(id, code, name)"

  const [matchesRes, betsRes, profilesRes] = await Promise.all([
    supabase.from("matches").select(matchSelect).order("match_date", { ascending: true }),
    supabase
      .from("bets")
      .select("match_id, user_id, predicted_home_score, predicted_away_score, predicted_advances_team_id"),
    supabase.from("profiles").select("id, display_name, status_message").order("display_name", { ascending: true }),
  ])

  if (matchesRes.error) {
    return NextResponse.json({ error: matchesRes.error.message }, { status: 500 })
  }
  if (betsRes.error) {
    return NextResponse.json({ error: betsRes.error.message }, { status: 500 })
  }

  let profiles = profilesRes.data ?? []
  if (profilesRes.error) {
    if (profilesRes.error.message.includes("status_message")) {
      const fallback = await supabase
        .from("profiles")
        .select("id, display_name")
        .order("display_name", { ascending: true })
      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 })
      }
      profiles = (fallback.data ?? []).map((p) => ({ ...p, status_message: null }))
    } else {
      return NextResponse.json({ error: profilesRes.error.message }, { status: 500 })
    }
  }

  const groups = buildBetsBoardGroups(
    (matchesRes.data ?? []) as BetsBoardMatch[],
    (betsRes.data ?? []) as BetsBoardBet[],
    profiles as BetsBoardProfile[],
    nowMs,
  )

  return NextResponse.json(
    { groups: redactForKickoff(groups), serverNow: nowMs },
    { headers: { "Cache-Control": "no-store" } },
  )
}
