"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import { formatMatchDateTimeBrazil } from "@/lib/match-datetime-brazil"
import { findMatchesInKickoffReminderWindow } from "@/lib/match-kickoff-reminder"
import {
  isKickoffReminderShown,
  markKickoffReminderShown,
} from "@/lib/match-kickoff-reminder-shown"
import type { NextMatchBetReminderMatch } from "@/lib/next-match-bet-reminder"

const POLL_MS = 30_000
const MATCH_SELECT =
  "id, match_date, status, stage, home_team:home_team_id(code, name), away_team:away_team_id(code, name)"

/** Toast para todos os utilizadores logados ~10 min antes de cada jogo. */
export function MatchKickoffReminderListener() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let cancelled = false
    let userId: string | null = null

    function showKickoffToast(uid: string, match: NextMatchBetReminderMatch) {
      if (isKickoffReminderShown(uid, match.id)) return
      markKickoffReminderShown(uid, match.id)

      const duel = `${match.home_team.code} x ${match.away_team.code}`
      const when = formatMatchDateTimeBrazil(match.match_date)

      toast.info("Jogo em 10 minutos", {
        id: `kickoff-reminder-${match.id}`,
        description: `${duel} começa às ${when} (horário de Brasília). Confirma o teu palpite!`,
        duration: 20_000,
        dismissible: true,
        closeButton: true,
        action: {
          label: "Ver jogo",
          onClick: () => router.push(`/matches?aposta=${match.id}`),
        },
      })
    }

    async function checkReminders() {
      if (cancelled || !userId) return

      const { user } = await getUserSafe(supabase)
      if (!user?.id || user.id !== userId) return

      const nowMs = Date.now()
      const horizon = new Date(nowMs + 11 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from("matches")
        .select(MATCH_SELECT)
        .eq("status", "scheduled")
        .gte("match_date", new Date(nowMs - 60_000).toISOString())
        .lte("match_date", horizon)
        .order("match_date", { ascending: true })

      if (error || cancelled || !userId) return

      const rows = (data ?? []) as unknown as NextMatchBetReminderMatch[]
      const due = findMatchesInKickoffReminderWindow(rows, nowMs)
      for (const match of due) {
        showKickoffToast(userId, match)
      }
    }

    async function start() {
      const { user } = await getUserSafe(supabase)
      if (!user?.id || cancelled) return
      userId = user.id
      await checkReminders()
      pollTimer = setInterval(() => void checkReminders(), POLL_MS)
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") void checkReminders()
    }
    document.addEventListener("visibilitychange", onVisible)

    void start()

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", onVisible)
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [router])

  return null
}
