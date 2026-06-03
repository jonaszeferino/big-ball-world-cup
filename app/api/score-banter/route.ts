import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAppAdminEmail } from "@/lib/app-admin"
import { buildScoreBanter } from "@/lib/score-banter"
import { insertBroadcastToast } from "@/lib/broadcast-toast"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }
  if (!isAppAdminEmail(user.email)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { matchId, prevHome, prevAway, newHome, newAway } = body as Record<string, unknown>
  if (typeof matchId !== "string" || !matchId) {
    return NextResponse.json({ error: "matchId obrigatório" }, { status: 400 })
  }

  const pH = Number(prevHome)
  const pA = Number(prevAway)
  const nH = Number(newHome)
  const nA = Number(newAway)
  if (![pH, pA, nH, nA].every((n) => Number.isFinite(n) && n >= 0)) {
    return NextResponse.json({ error: "Placares inválidos" }, { status: 400 })
  }

  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select("id, home_team:home_team_id(code, name), away_team:away_team_id(code, name)")
    .eq("id", matchId)
    .single()

  if (matchErr || !match) {
    return NextResponse.json({ error: matchErr?.message ?? "Partida não encontrada" }, { status: 404 })
  }

  const home = match.home_team as { code: string; name: string }
  const away = match.away_team as { code: string; name: string }

  const { data: betsRaw } = await supabase
    .from("bets")
    .select("user_id, predicted_home_score, predicted_away_score")
    .eq("match_id", matchId)

  const userIds = [...new Set((betsRaw ?? []).map((b) => b.user_id as string))]
  const namesByUser = new Map<string, string>()
  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds)
    for (const p of profiles ?? []) {
      namesByUser.set(p.id as string, String(p.display_name ?? "Apostador"))
    }
  }

  const bets = (betsRaw ?? []).map((row) => ({
    displayName: namesByUser.get(row.user_id as string) ?? "Apostador",
    predHome: Number(row.predicted_home_score) || 0,
    predAway: Number(row.predicted_away_score) || 0,
  }))

  const banter = buildScoreBanter({
    homeCode: home.code,
    awayCode: away.code,
    homeName: home.name,
    awayName: away.name,
    prevHome: Math.floor(pH),
    prevAway: Math.floor(pA),
    newHome: Math.floor(nH),
    newAway: Math.floor(nA),
    bets,
  })

  if (!banter) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const { id, error: insertErr } = await insertBroadcastToast(supabase, {
    kind: "score",
    matchId,
    prevHome: Math.floor(pH),
    prevAway: Math.floor(pA),
    newHome: Math.floor(nH),
    newAway: Math.floor(nA),
    title: banter.title,
    message: banter.message,
  })

  if (insertErr) {
    return NextResponse.json({ error: insertErr }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id })
}
