"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import { AppSonner } from "@/components/app-sonner"
import { LiveScoreBanterListener } from "@/components/live-score-banter-listener"
import { MatchKickoffReminderListener } from "@/components/match-kickoff-reminder-listener"

/** Só monta avisos (Sonner + listeners) dentro do app e com sessão validada. */
export function BroadcastToastGate() {
  const [userId, setUserId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function syncUser() {
      const { user } = await getUserSafe(supabase)
      if (cancelled) return
      setUserId(user?.id ?? null)
      setReady(true)
    }

    async function applySession() {
      const { user } = await getUserSafe(supabase)
      if (cancelled) return
      if (user?.id) {
        setUserId(user.id)
      } else {
        setUserId(null)
        toast.dismiss()
      }
    }

    void syncUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return
      if (!session?.user?.id) {
        setUserId(null)
        toast.dismiss()
        return
      }
      void applySession()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  if (!ready || !userId) return null

  return (
    <>
      <AppSonner />
      <LiveScoreBanterListener />
      <MatchKickoffReminderListener />
    </>
  )
}
