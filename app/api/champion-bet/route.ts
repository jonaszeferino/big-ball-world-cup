import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  formatChampionBetDeadlineLabel,
  getChampionBetDeadlineMs,
  isChampionBetOpen,
} from "@/lib/champion-bet-deadline"
import type { ChampionBetPayload, ChampionBetTeam } from "@/lib/champion-bet-types"

async function loadFirstRoundOf32MatchDate(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("matches")
    .select("match_date")
    .eq("stage", "round_of_32")
    .order("match_date", { ascending: true })
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
  const firstRoundOf32MatchDate = await loadFirstRoundOf32MatchDate(supabase)
  const isOpen = isChampionBetOpen(firstRoundOf32MatchDate, nowMs)
  const deadlineMs = getChampionBetDeadlineMs(firstRoundOf32MatchDate)
  const deadlineLabel = formatChampionBetDeadlineLabel(firstRoundOf32MatchDate)

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
    firstRoundOf32MatchDate,
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

  const firstRoundOf32MatchDate = await loadFirstRoundOf32MatchDate(supabase)
  if (!isChampionBetOpen(firstRoundOf32MatchDate, Date.now())) {
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

  const { error: rpcErr } = await supabase.rpc("upsert_champion_bet", {
    p_champion_team_id: championTeamId,
    p_runner_up_team_id: runnerUpTeamId,
  })

  if (rpcErr) {
    const msg = rpcErr.message ?? "Erro ao salvar"
    if (
      msg.includes("Could not find the function") ||
      (msg.includes("schema cache") && msg.includes("upsert_champion_bet"))
    ) {
      return NextResponse.json(
        {
          error:
            "Atualização pendente no banco. Execute scripts/024_champion_bet_deadline_round_of_32.sql no SQL Editor do Supabase.",
        },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return GET()
}
