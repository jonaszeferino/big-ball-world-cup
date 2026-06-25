"use client"

import { useEffect, useState } from "react"
import { Cake, PartyPopper, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import { Button } from "@/components/ui/button"
import {
  birthdayBannerDismissKey,
  isBirthdayProfile,
  isBirthdayToday,
} from "@/lib/birthday-banner"

export function BirthdayBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isBirthdayToday()) return

    const dismissKey = birthdayBannerDismissKey()
    if (typeof window !== "undefined" && window.localStorage.getItem(dismissKey) === "1") {
      return
    }

    const supabase = createClient()
    void (async () => {
      const { user } = await getUserSafe(supabase)
      if (!user) return

      const { data } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()
      if (!data?.display_name || !isBirthdayProfile(data.display_name)) return

      setVisible(true)
    })()
  }, [])

  if (!visible) return null

  const dismiss = () => {
    window.localStorage.setItem(birthdayBannerDismissKey(), "1")
    setVisible(false)
  }

  return (
    <div
      className="relative border-b border-amber-400/40 bg-gradient-to-r from-amber-100 via-orange-50 to-pink-100 dark:from-amber-950/50 dark:via-orange-950/30 dark:to-pink-950/40"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 md:px-6">
        <div className="flex shrink-0 items-center gap-2 text-amber-600 dark:text-amber-400">
          <PartyPopper className="h-5 w-5" aria-hidden />
          <Cake className="h-5 w-5" aria-hidden />
        </div>
        <p className="min-w-0 flex-1 text-center text-sm text-foreground sm:text-base">
          <span className="font-semibold text-amber-700 dark:text-amber-300">Feliz aniversário, Jaime!</span>
          {" "}
          Parabéns — que seja um dia especial e cheio de boas energias no bolão.
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={dismiss}
          aria-label="Fechar aviso de aniversário"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
