import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  buildBetsBoardGroups,
  type BetsBoardBet,
  type BetsBoardGroup,
  type BetsBoardMatch,
  type BetsBoardProfile,
  type PalpitesApiGroup,
  type SavedMatchOdds,
} from "@/lib/match-bets-board"

function redactForKickoff(groups: BetsBoardGroup[]): PalpitesApiGroup[] {
  return groups.map((group) => {
    if (!group.palpitesRevealed) {
      return {
        ...group,
        betCount: group.rows.length,
        rows: [],
        savedOdds: null,
        partialResult: group.partialResult,
        officialResult: null,
      }
    }
    return {
      ...group,
      betCount: group.rows.length,
      rows: group.rows,
    }
  })
}

function mapOddsRows(
  rows: Array<{
    match_id: string | null
    kto_home: string | null
    kto_draw: string | null
    kto_away: string | null
    bet365_home: string | null
    bet365_draw: string | null
    bet365_away: string | null
    synced_at: string | null
  }> | null,
): Map<string, SavedMatchOdds> {
  const map = new Map<string, SavedMatchOdds>()
  for (const row of rows ?? []) {
    if (!row.match_id) continue
    map.set(row.match_id, {
      ktoHome: row.kto_home,
      ktoDraw: row.kto_draw,
      ktoAway: row.kto_away,
      bet365Home: row.bet365_home,
      bet365Draw: row.bet365_draw,
      bet365Away: row.bet365_away,
      syncedAt: row.synced_at,
    })
  }
  return map
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
    "id, match_date, status, stage, group_name, home_score, away_score, home_penalty_score, away_penalty_score, home_team:home_team_id(id, code, name), away_team:away_team_id(id, code, name)"

  const [matchesRes, betsRes, profilesRes, oddsRes, teamsResultsRes] = await Promise.all([
    supabase.from("matches").select(matchSelect).order("match_date", { ascending: true }),
    supabase
      .from("bets")
      .select("match_id, user_id, predicted_home_score, predicted_away_score, predicted_advances_team_id, points_earned"),
    supabase.from("profiles").select("id, display_name, status_message").order("display_name", { ascending: true }),
    supabase
      .from("match_pre_odds")
      .select(
        "match_id, kto_home, kto_draw, kto_away, bet365_home, bet365_draw, bet365_away, synced_at",
      )
      .not("match_id", "is", null),
    supabase.from("teams_results").select("team_home, team_away, goals_home, goals_away"),
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

  const oddsByMatchId =
    oddsRes.error && !oddsRes.error.message.includes("match_pre_odds")
      ? new Map<string, SavedMatchOdds>()
      : mapOddsRows(oddsRes.data)

  const groups = buildBetsBoardGroups(
    (matchesRes.data ?? []) as BetsBoardMatch[],
    (betsRes.data ?? []) as BetsBoardBet[],
    profiles as BetsBoardProfile[],
    nowMs,
    oddsByMatchId,
    teamsResultsRes.error ? [] : (teamsResultsRes.data ?? []),
  )

  return NextResponse.json(
    { groups: redactForKickoff(groups), serverNow: nowMs },
    { headers: { "Cache-Control": "no-store" } },
  )
}
