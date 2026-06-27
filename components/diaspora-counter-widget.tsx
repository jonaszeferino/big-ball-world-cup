"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Globe2, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  buildDiasporaCounterState,
  EMPTY_DIASPORA_STATE,
  formatDiasporaCooldown,
  stateFromRpcPayload,
  type DiasporaCounterState,
  type DiasporaCounterRow,
  type DiasporaRpcPayload,
} from "@/lib/diaspora-counter"

async function loadCounterRow(
  supabase: ReturnType<typeof createClient>,
): Promise<{ row: DiasporaCounterRow | null; error: string | null }> {
  const { data, error } = await supabase
    .from("diaspora_counter")
    .select("count, last_click_at, last_click_user_id")
    .eq("id", 1)
    .maybeSingle()

  if (error) {
    if (error.message.includes("diaspora_counter")) {
      return {
        row: null,
        error: "Contador ainda não configurado — corre scripts/023_diaspora_counter.sql no Supabase.",
      }
    }
    return { row: null, error: error.message }
  }

  if (!data) {
    return {
      row: {
        count: 0,
        last_click_at: null,
        last_click_user_id: null,
        last_click_display_name: null,
      },
      error: null,
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
    row: {
      count: Number(data.count ?? 0),
      last_click_at: (data.last_click_at as string | null) ?? null,
      last_click_user_id: (data.last_click_user_id as string | null) ?? null,
      last_click_display_name: lastClickDisplayName,
    },
    error: null,
  }
}

export function DiasporaCounterWidget() {
  const [userId, setUserId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [state, setState] = useState<DiasporaCounterState>(EMPTY_DIASPORA_STATE)
  const [loading, setLoading] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [bump, setBump] = useState(false)
  const setupErrorShown = useRef(false)

  const applyRow = useCallback((row: DiasporaCounterRow, uid: string | null, bumpCount = false) => {
    setState(buildDiasporaCounterState(row, uid))
    if (bumpCount) {
      setBump(true)
      window.setTimeout(() => setBump(false), 450)
    }
  }, [])

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { user } = await getUserSafe(supabase)
    if (!user) return

    const { row, error } = await loadCounterRow(supabase)
    if (error) {
      if (!setupErrorShown.current) {
        setupErrorShown.current = true
        toast.error(error)
      }
      return
    }
    if (row) applyRow(row, user.id)
  }, [applyRow])

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    async function init() {
      const { user } = await getUserSafe(supabase)
      if (cancelled) return
      setUserId(user?.id ?? null)
      setReady(true)
      if (!user) return

      const { row, error } = await loadCounterRow(supabase)
      if (cancelled) return
      if (error) {
        if (!setupErrorShown.current) {
          setupErrorShown.current = true
          toast.error(error)
        }
        return
      }
      if (row) applyRow(row, user.id)

      channel = supabase
        .channel("diaspora-counter-global")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "diaspora_counter" },
          () => {
            void refresh()
          },
        )
        .subscribe()
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
      if (session?.user) void refresh()
      else setState(EMPTY_DIASPORA_STATE)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
      if (channel) void supabase.removeChannel(channel)
    }
  }, [applyRow, refresh])

  useEffect(() => {
    const tick = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(tick)
  }, [])

  const liveState = buildDiasporaCounterState(
    {
      count: state.count,
      last_click_at: state.lastClickAt,
      last_click_user_id: state.lastClickUserId,
      last_click_display_name: state.lastClickDisplayName,
    },
    userId,
    nowMs,
  )

  const handleClick = async () => {
    if (loading || !userId) return

    if (!liveState.canClick) {
      const who = liveState.lastClickDisplayName ?? "Alguém"
      toast.info("Contador de Diáspora", {
        description: `Aguarde ${formatDiasporaCooldown(liveState.cooldownRemainingMs / 1000)} — ${who} gerou o último +1. Só quem clicou pode somar de novo nesse intervalo.`,
      })
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.rpc("increment_diaspora_counter")

      if (error) {
        const msg = error.message.includes("increment_diaspora_counter")
          ? "Contador ainda não configurado — corre scripts/023_diaspora_counter.sql no Supabase."
          : error.message
        toast.error(msg)
        return
      }

      const result = stateFromRpcPayload((data ?? {}) as DiasporaRpcPayload, userId)

      if (!result.ok) {
        setState(result)
        toast.info("Contador de Diáspora", {
          description:
            result.message ??
            `Aguarde ${formatDiasporaCooldown(result.cooldownRemainingMs / 1000)} para clicar de novo.`,
        })
        return
      }

      applyRow(
        {
          count: result.count,
          last_click_at: result.lastClickAt,
          last_click_user_id: result.lastClickUserId,
          last_click_display_name: result.lastClickDisplayName,
        },
        userId,
        true,
      )
    } catch {
      toast.error("Erro de rede ao atualizar o contador.")
    } finally {
      setLoading(false)
    }
  }

  if (!ready || !userId) return null

  return (
    <div className="group/diaspora flex justify-end outline-none" tabIndex={0}>
      <div
        className={cn(
          "flex h-11 items-center overflow-hidden rounded-full border border-border bg-card shadow-md transition-[width] duration-300 ease-out",
          "w-11 group-hover/diaspora:w-[13.5rem] group-focus-within/diaspora:w-[13.5rem]",
        )}
      >
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
          <Globe2 className="h-5 w-5 text-foreground" aria-hidden />
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 pr-2.5 opacity-0 transition-opacity duration-200",
            "group-hover/diaspora:opacity-100 group-focus-within/diaspora:opacity-100",
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
              Diáspora
            </p>
            <p
              className={cn(
                "text-sm font-bold tabular-nums leading-none text-primary transition-transform duration-300",
                bump && "scale-110",
              )}
              aria-live="polite"
              aria-atomic="true"
            >
              {liveState.count}
            </p>
            {!liveState.canClick ? (
              <p className="mt-0.5 text-[9px] text-muted-foreground">
                {formatDiasporaCooldown(liveState.cooldownRemainingMs / 1000)}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            className="h-8 shrink-0 rounded-full px-2.5 text-xs"
            onClick={(e) => {
              e.stopPropagation()
              void handleClick()
            }}
            disabled={loading}
            aria-label="Adicionar 1 ao Contador de Diáspora"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            +1
          </Button>
        </div>
      </div>
    </div>
  )
}
