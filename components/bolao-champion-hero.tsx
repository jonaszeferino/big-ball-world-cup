"use client"

import { Crown, Sparkles, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ProfileNameWithStatus } from "@/components/profile-name-with-status"
import { BOLAO_CHAMPION_HERO_IMAGE_URL } from "@/lib/champion-bet-display"
import type { RankedPlayerBase } from "@/lib/ranking-display"

export function BolaoChampionHero({
  winner,
  scopeLabel,
}: {
  winner: RankedPlayerBase
  scopeLabel: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-400/45 bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-emerald-600/10 shadow-lg shadow-amber-500/10">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden />

      <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_min(18rem,42%)] lg:items-center lg:gap-6">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="gap-1 bg-amber-500/90 text-amber-950 hover:bg-amber-500/90">
              <Crown className="h-3.5 w-3.5" />
              Campeão do bolão
            </Badge>
            <Badge variant="outline" className="font-normal text-muted-foreground">
              {scopeLabel}
            </Badge>
          </div>

          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-800/90 dark:text-amber-200/90">
              <Sparkles className="h-3.5 w-3.5" />
              Entende muito de futebol
            </p>
            <ProfileNameWithStatus
              name={winner.display_name}
              status={winner.status_message}
              nameClassName="text-2xl font-bold text-foreground sm:text-3xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1 font-bold tabular-nums text-primary shadow-sm">
              <Trophy className="h-4 w-4 text-amber-600" />
              {winner.total_points} pts totais
            </span>
            <span className="text-muted-foreground">
              {winner.exact_hits} exatos · {winner.group_points} pts grupos · {winner.knockout_points} pts mata-mata
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-amber-400/30 bg-black/20 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={BOLAO_CHAMPION_HERO_IMAGE_URL}
            alt={`${winner.display_name} — campeão do bolão`}
            className="aspect-[4/5] w-full object-cover object-top sm:aspect-[5/4] lg:aspect-auto lg:max-h-72"
            loading="eager"
          />
        </div>
      </div>
    </div>
  )
}
