"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import {
  findNextUpcomingMatchWithoutBet,
  type NextMatchBetReminderMatch,
} from "@/lib/next-match-bet-reminder"
import { formatMatchDateTimeBrazil } from "@/lib/match-datetime-brazil"

const SESSION_KEY = "bbwc-bet-reminder-toast"

function sessionAlreadyShownForMatch(matchId: string): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as { matchId?: string }
    return parsed.matchId === matchId
  } catch {
    return false
  }
}

function markSessionShown(matchId: string) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ matchId }))
  } catch {
    /* ignore */
  }
}

export function NextMatchBetReminder() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function run() {
      const supabase = createClient()
      const { user } = await getUserSafe(supabase)
      if (!user || cancelled) return

      const matchSelect =
        "id, match_date, status, stage, home_team:home_team_id(code, name), away_team:away_team_id(code, name)"

      const [matchesRes, betsRes] = await Promise.all([
        supabase.from("matches").select(matchSelect).order("match_date", { ascending: true }),
        supabase.from("bets").select("match_id").eq("user_id", user.id),
      ])

      if (cancelled) return
      if (matchesRes.error || betsRes.error) return

      const rows = (matchesRes.data ?? []) as unknown as NextMatchBetReminderMatch[]
      if (!rows.length) return

      const betIds = new Set((betsRes.data ?? []).map((b) => b.match_id as string))
      const next = findNextUpcomingMatchWithoutBet(rows, betIds, Date.now())
      if (!next || sessionAlreadyShownForMatch(next.id)) return

      markSessionShown(next.id)

      const when = formatMatchDateTimeBrazil(next.match_date)
      const duel = `${next.home_team.code} x ${next.away_team.code}`

      toast.warning("Atenção: falta a tua aposta", {
        id: `bet-reminder-${next.id}`,
        description: `A próxima partida (${duel}, ${when}) ainda não tem palpite teu.`,
        duration: 14_000,
        action: {
          label: "Apostar agora",
          onClick: () => router.push(`/matches?aposta=${next.id}`),
        },
      })
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [router])

  return null
}
