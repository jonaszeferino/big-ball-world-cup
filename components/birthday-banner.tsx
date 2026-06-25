"use client"

import { useEffect, useState } from "react"
import { Cake, PartyPopper, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import { Button } from "@/components/ui/button"
import {
  birthdayBannerDismissKey,
  getBirthdayProfileForToday,
  type BirthdayProfile,
} from "@/lib/birthday-banner"

export function BirthdayBanner() {
  const [profile, setProfile] = useState<BirthdayProfile | null>(null)

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      const { user } = await getUserSafe(supabase)
      if (!user) return

      const { data } = await supabase.from("profiles").select("display_name").eq("id", user.id).single()
      if (!data?.display_name) return

      const birthday = getBirthdayProfileForToday(data.display_name)
      if (!birthday) return

      const dismissKey = birthdayBannerDismissKey(birthday)
      if (window.localStorage.getItem(dismissKey) === "1") return

      setProfile(birthday)
    })()
  }, [])

  if (!profile) return null

  const dismiss = () => {
    window.localStorage.setItem(birthdayBannerDismissKey(profile), "1")
    setProfile(null)
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
          <span className="font-semibold text-amber-700 dark:text-amber-300">
            Feliz aniversário, {profile.greetingName}!
          </span>
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
