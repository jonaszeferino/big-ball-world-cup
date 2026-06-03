import type { SupabaseClient } from "@supabase/supabase-js"

export type BroadcastToastKind = "score" | "manual"

export interface InsertBroadcastToastInput {
  kind: BroadcastToastKind
  title: string
  message: string
  matchId?: string | null
  prevHome?: number | null
  prevAway?: number | null
  newHome?: number | null
  newAway?: number | null
}

/** Inferido a partir de match_id (não exige coluna kind no banco). */
export function inferBroadcastKind(row: { match_id?: string | null }): BroadcastToastKind {
  return row.match_id ? "score" : "manual"
}

export async function insertBroadcastToast(
  supabase: SupabaseClient,
  input: InsertBroadcastToastInput,
): Promise<{ id: string | null; error: string | null }> {
  const row = {
    match_id: input.matchId ?? null,
    prev_home: input.prevHome ?? null,
    prev_away: input.prevAway ?? null,
    new_home: input.newHome ?? null,
    new_away: input.newAway ?? null,
    title: input.title.trim(),
    message: input.message.trim(),
  }

  const { data, error } = await supabase.from("match_score_banter").insert(row).select("id").single()

  if (error) {
    const needsMigration =
      input.kind === "manual" &&
      (error.message.includes("null value") ||
        error.message.includes("match_id") ||
        error.message.includes("violates not-null"))
    return {
      id: null,
      error: needsMigration
        ? `${error.message} — corre scripts/015_broadcast_toasts_manual.sql no Supabase (permite avisos sem partida).`
        : `${error.message} — confirma scripts/014 e Realtime na tabela match_score_banter.`,
    }
  }

  return { id: data?.id ?? null, error: null }
}
