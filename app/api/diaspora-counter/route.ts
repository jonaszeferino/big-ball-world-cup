import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildDiasporaCounterState, type DiasporaCounterRow } from "@/lib/diaspora-counter"

async function loadCounterRow(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase.from("diaspora_counter").select("count, last_click_at, last_click_user_id").eq("id", 1).maybeSingle()

  if (error) {
    return { error: error.message as string, row: null }
  }

  if (!data) {
    return {
      error: null,
      row: {
        count: 0,
        last_click_at: null,
        last_click_user_id: null,
        last_click_display_name: null,
      } satisfies DiasporaCounterRow,
    }
  }

  let lastClickDisplayName: string | null = null
  if (data.last_click_user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", data.last_click_user_id)
      .maybeSingle()
    lastClickDisplayName = (profile?.display_name as string | undefined) ?? null
  }

  return {
    error: null,
    row: {
      count: Number(data.count ?? 0),
      last_click_at: (data.last_click_at as string | null) ?? null,
      last_click_user_id: (data.last_click_user_id as string | null) ?? null,
      last_click_display_name: lastClickDisplayName,
    } satisfies DiasporaCounterRow,
  }
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { error, row } = await loadCounterRow(supabase)
  if (error || !row) {
    return NextResponse.json({ error: error ?? "Contador indisponível" }, { status: 500 })
  }

  return NextResponse.json(buildDiasporaCounterState(row, user.id))
}

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { data, error } = await supabase.rpc("increment_diaspora_counter")

  if (error) {
    if (error.message.includes("increment_diaspora_counter")) {
      return NextResponse.json(
        { error: "Contador de Diáspora ainda não configurado — corre scripts/023_diaspora_counter.sql no Supabase." },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const payload = data as {
    ok: boolean
    code?: string
    message?: string
    count: number
    last_click_at: string | null
    last_click_user_id: string | null
    last_click_display_name?: string | null
    cooldown_until?: string | null
    cooldown_remaining_ms?: number
  }

  const row: DiasporaCounterRow = {
    count: Number(payload.count ?? 0),
    last_click_at: payload.last_click_at ?? null,
    last_click_user_id: payload.last_click_user_id ?? null,
    last_click_display_name: payload.last_click_display_name ?? null,
  }

  const state = buildDiasporaCounterState(row, user.id)

  if (!payload.ok) {
    return NextResponse.json(
      {
        ...state,
        ok: false,
        code: payload.code ?? "cooldown",
        message: payload.message ?? "Aguarde 1 minuto antes de clicar novamente.",
        cooldownUntil: payload.cooldown_until ?? state.cooldownUntil,
        cooldownRemainingMs: payload.cooldown_remaining_ms ?? state.cooldownRemainingMs,
      },
      { status: 429 },
    )
  }

  return NextResponse.json({ ...state, ok: true })
}
