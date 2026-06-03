import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/** Avisos para utilizadores autenticados (bootstrap ao entrar + polling). */
export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const url = new URL(request.url)
  const bootstrap = url.searchParams.get("bootstrap") === "1"

  if (bootstrap) {
    const { data, error } = await supabase
      .from("match_score_banter")
      .select("id, title, message, created_at")
      .order("created_at", { ascending: false })
      .limit(30)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ rows: data ?? [] })
  }

  const sinceParam = url.searchParams.get("since")
  const sinceParsed = sinceParam ? Date.parse(sinceParam) : NaN
  const since = Number.isFinite(sinceParsed)
    ? new Date(sinceParsed).toISOString()
    : new Date(Date.now() - 2 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("match_score_banter")
    .select("id, title, message, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(30)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rows: data ?? [] })
}
