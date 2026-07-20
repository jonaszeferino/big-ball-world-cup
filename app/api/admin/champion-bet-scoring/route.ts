import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAppAdminEmail } from "@/lib/app-admin"
import { reapplyChampionBetScoringForFinishedFinal } from "@/lib/champion-bet-scoring"

export async function POST() {
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

  const { error, data } = await reapplyChampionBetScoringForFinishedFinal(supabase)
  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json({ ok: true, result: data ?? null })
}
