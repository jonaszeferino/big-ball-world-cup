"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import {
  isBroadcastShown,
  markBroadcastShown,
  markBroadcastsShown,
} from "@/lib/broadcast-toast-shown"

interface BroadcastRow {
  id: string
  title: string
  message: string
  created_at?: string
}

const POLL_MS = 5_000
const MAX_PENDING_TOASTS = 3

function showBroadcastToast(userId: string, row: BroadcastRow) {
  if (!row?.id || !row.title || isBroadcastShown(userId, row.id)) return
  markBroadcastShown(userId, row.id)
  toast(row.title, {
    id: `broadcast-${row.id}`,
    description: row.message,
    duration: Infinity,
    dismissible: true,
    closeButton: true,
  })
}

function showPendingBootstrap(userId: string, rows: BroadcastRow[]) {
  const unseen = rows
    .filter((row) => row?.id && row.title && !isBroadcastShown(userId, row.id))
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())

  if (unseen.length === 0) return

  if (unseen.length > MAX_PENDING_TOASTS) {
    markBroadcastsShown(
      userId,
      unseen.slice(MAX_PENDING_TOASTS).map((row) => row.id),
    )
  }

  const toShow = unseen.slice(0, MAX_PENDING_TOASTS).reverse()
  for (const row of toShow) {
    showBroadcastToast(userId, row)
  }
}

/** Realtime + polling: avisos para utilizadores logados (até 3 pendentes ao entrar). */
export function LiveScoreBanterListener() {
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let cancelled = false
    let listening = false
    let userId: string | null = null

    let lastPollAt = Date.now() - 2 * 60 * 1000

    async function bootstrapInbox(uid: string) {
      if (cancelled) return
      const { user } = await getUserSafe(supabase)
      if (!user?.id || user.id !== uid) return
      try {
        const res = await fetch("/api/broadcast-toast/inbox?bootstrap=1", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as { rows?: BroadcastRow[] }
        showPendingBootstrap(uid, data.rows ?? [])
      } catch {
        /* rede */
      }
    }

    async function pollInbox(uid: string) {
      if (cancelled) return
      const { user } = await getUserSafe(supabase)
      if (!user?.id || user.id !== uid) return
      try {
        const since = new Date(lastPollAt).toISOString()
        lastPollAt = Date.now()
        const res = await fetch(`/api/broadcast-toast/inbox?since=${encodeURIComponent(since)}`, {
          cache: "no-store",
        })
        if (!res.ok) return
        const data = (await res.json()) as { rows?: BroadcastRow[] }
        for (const row of data.rows ?? []) {
          showBroadcastToast(uid, row)
        }
      } catch {
        /* rede */
      }
    }

    async function waitForUser(maxAttempts = 12): Promise<string | null> {
      for (let i = 0; i < maxAttempts; i++) {
        if (cancelled) return null
        const { user } = await getUserSafe(supabase)
        if (user?.id) return user.id
        await new Promise((r) => setTimeout(r, 400))
      }
      return null
    }

    async function startListening() {
      if (cancelled || listening) return
      const uid = await waitForUser()
      if (!uid || cancelled) return

      listening = true
      userId = uid

      await bootstrapInbox(uid)
      lastPollAt = Date.now()
      await pollInbox(uid)
      pollTimer = setInterval(() => {
        if (userId) void pollInbox(userId)
      }, POLL_MS)

      channel = supabase
        .channel(`app-broadcast-toasts-${uid}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "match_score_banter" },
          (payload) => {
            if (!userId) return
            void getUserSafe(supabase).then(({ user }) => {
              if (user?.id !== userId) return
              showBroadcastToast(userId, payload.new as BroadcastRow)
            })
          },
        )
        .subscribe()
    }

    const onVisible = () => {
      if (document.visibilityState === "visible" && userId) void pollInbox(userId)
    }
    const onFocus = () => {
      if (userId) void pollInbox(userId)
    }

    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", onFocus)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void startListening()
    })

    void startListening()

    return () => {
      cancelled = true
      subscription.unsubscribe()
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", onFocus)
      if (pollTimer) clearInterval(pollTimer)
      if (channel) void supabase.removeChannel(channel)
    }
  }, [])

  return null
}
