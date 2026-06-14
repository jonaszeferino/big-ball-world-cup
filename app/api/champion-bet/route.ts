import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  formatChampionBetDeadlineLabel,
  getChampionBetDeadlineMs,
  isChampionBetOpen,
} from "@/lib/champion-bet-deadline"
import type { ChampionBetPayload, ChampionBetTeam } from "@/lib/champion-bet-types"

async function loadLastGroupMatchDate(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("matches")
    .select("match_date")
    .eq("stage", "group")
    .order("match_date", { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.match_date as string | undefined) ?? null
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
  const lastGroupMatchDate = await loadLastGroupMatchDate(supabase)
  const isOpen = isChampionBetOpen(lastGroupMatchDate, nowMs)
  const deadlineMs = getChampionBetDeadlineMs(lastGroupMatchDate)
  const deadlineLabel = formatChampionBetDeadlineLabel(lastGroupMatchDate)

  const [teamsRes, betRes] = await Promise.all([
    supabase.from("teams").select("id, name, code").order("name", { ascending: true }),
    supabase
      .from("champion_bets")
      .select(
        "champion_team_id, runner_up_team_id, points_earned, updated_at, champion_team:champion_team_id(id, name, code), runner_up_team:runner_up_team_id(id, name, code)",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ])

  if (teamsRes.error) {
    return NextResponse.json({ error: teamsRes.error.message }, { status: 500 })
  }

  let bet: ChampionBetPayload | null = null
  if (betRes.error) {
    if (!betRes.error.message.includes("champion_bets")) {
      return NextResponse.json({ error: betRes.error.message }, { status: 500 })
    }
  } else if (betRes.data) {
    const row = betRes.data as Record<string, unknown>
    const championTeam = row.champion_team as ChampionBetTeam
    const runnerUpTeam = row.runner_up_team as ChampionBetTeam
    bet = {
      championTeamId: row.champion_team_id as string,
      runnerUpTeamId: row.runner_up_team_id as string,
      championTeam,
      runnerUpTeam,
      pointsEarned: (row.points_earned as number) ?? 0,
      updatedAt: row.updated_at as string,
    }
  }

  return NextResponse.json({
    isOpen,
    deadlineMs,
    deadlineLabel,
    lastGroupMatchDate,
    serverNow: nowMs,
    bet,
    teams: (teamsRes.data ?? []) as ChampionBetTeam[],
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const lastGroupMatchDate = await loadLastGroupMatchDate(supabase)
  if (!isChampionBetOpen(lastGroupMatchDate, Date.now())) {
    return NextResponse.json({ error: "Prazo do palpite do campeão encerrado." }, { status: 403 })
  }

  let body: { championTeamId?: string; runnerUpTeamId?: string }
  try {
    body = (await request.json()) as { championTeamId?: string; runnerUpTeamId?: string }
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 })
  }

  const championTeamId = body.championTeamId?.trim()
  const runnerUpTeamId = body.runnerUpTeamId?.trim()

  if (!championTeamId || !runnerUpTeamId) {
    return NextResponse.json({ error: "Escolha campeão e vice-campeão." }, { status: 400 })
  }
  if (championTeamId === runnerUpTeamId) {
    return NextResponse.json({ error: "Campeão e vice devem ser times diferentes." }, { status: 400 })
  }

  const { data: teams, error: teamsErr } = await supabase.from("teams").select("id").in("id", [championTeamId, runnerUpTeamId])
  if (teamsErr) return NextResponse.json({ error: teamsErr.message }, { status: 500 })
  if ((teams ?? []).length !== 2) {
    return NextResponse.json({ error: "Time inválido." }, { status: 400 })
  }

  const { data: existing } = await supabase.from("champion_bets").select("id").eq("user_id", user.id).maybeSingle()

  const payload = {
    champion_team_id: championTeamId,
    runner_up_team_id: runnerUpTeamId,
    updated_at: new Date().toISOString(),
  }

  const write = existing?.id
    ? await supabase.from("champion_bets").update(payload).eq("id", existing.id)
    : await supabase.from("champion_bets").insert({ user_id: user.id, ...payload })

  if (write.error) {
    return NextResponse.json({ error: write.error.message }, { status: 500 })
  }

  return GET()
}
