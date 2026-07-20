"use client"

import { Award, Crown, Flag, Medal, Swords, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileNameWithStatus } from "@/components/profile-name-with-status"
import { cn } from "@/lib/utils"
import {
  buildTotalRankings,
  entriesAtRank,
  findPlayerRank,
  sortByGroupPoints,
  sortByKnockoutPoints,
  type RankedPlayerBase,
} from "@/lib/ranking-display"

type Player = RankedPlayerBase & {
  advance_hits: number
  settled_bets: number
}

const PODIUM_SLOTS = [
  {
    rank: 2,
    label: "2º",
    icon: Medal,
    pedestalHeight: "h-14 sm:h-16",
    card: "border-slate-300/50 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/40",
    pedestal: "border-slate-300/50 bg-slate-200/80 dark:bg-slate-800/90",
    iconClass: "text-slate-500",
  },
  {
    rank: 1,
    label: "1º",
    icon: Trophy,
    pedestalHeight: "h-20 sm:h-24",
    card: "border-amber-400/50 bg-gradient-to-b from-amber-100 to-amber-50 dark:from-amber-950/50 dark:to-amber-900/20",
    pedestal: "border-amber-400/50 bg-amber-200/70 dark:bg-amber-900/50",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  {
    rank: 3,
    label: "3º",
    icon: Award,
    pedestalHeight: "h-10 sm:h-12",
    card: "border-orange-300/40 bg-gradient-to-b from-orange-100/90 to-orange-50/80 dark:from-orange-950/40 dark:to-orange-900/15",
    pedestal: "border-orange-300/40 bg-orange-200/60 dark:bg-orange-900/40",
    iconClass: "text-orange-700 dark:text-orange-400",
  },
] as const

function PodiumSlot({
  rank,
  entries,
  currentUserId,
}: {
  rank: number
  entries: { player: Player; rank: number }[]
  currentUserId: string | null
}) {
  const slot = PODIUM_SLOTS.find((s) => s.rank === rank)!
  const Icon = slot.icon
  const tied = entries.length > 1

  if (entries.length === 0) {
    return (
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <div
          className={cn(
            "flex w-full max-w-[11rem] flex-col items-center rounded-t-2xl border border-dashed border-border/80 px-3 py-6 text-center",
            slot.card,
          )}
        >
          <span className="text-sm font-medium text-muted-foreground">{slot.label}</span>
          <p className="mt-2 text-xs text-muted-foreground">—</p>
        </div>
        <div
          className={cn("w-full max-w-[11rem] rounded-b-lg border-x border-b", slot.pedestalHeight, slot.pedestal)}
          aria-hidden
        />
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <div
        className={cn(
          "flex w-full max-w-[11rem] flex-col items-center rounded-t-2xl border border-b-0 px-3 py-4 text-center shadow-sm",
          slot.card,
        )}
      >
        <div
          className={cn(
            "mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 shadow-inner",
            rank === 1 && "h-12 w-12",
          )}
        >
          <Icon className={cn("h-5 w-5", rank === 1 && "h-6 w-6", slot.iconClass)} aria-hidden />
        </div>
        <Badge variant="secondary" className="mb-2 text-[10px] font-bold uppercase tracking-wide">
          {slot.label}
          {tied ? " · empatado" : ""}
        </Badge>
        <ul className="flex w-full flex-col gap-2">
          {entries.map(({ player }) => {
            const isMe = player.id === currentUserId
            return (
              <li
                key={player.id}
                className={cn(
                  "rounded-lg px-1 py-0.5",
                  isMe && "bg-primary/10 ring-1 ring-primary/25",
                )}
              >
                <p className="truncate text-sm font-bold text-foreground">{player.display_name}</p>
                {player.status_message?.trim() ? (
                  <p className="truncate text-[10px] text-muted-foreground">{player.status_message.trim()}</p>
                ) : null}
                <p className="mt-1 text-xl font-bold tabular-nums text-primary sm:text-2xl">
                  {player.total_points}
                </p>
              </li>
            )
          })}
        </ul>
        <p className="mt-2 text-[10px] text-muted-foreground">pts totais</p>
      </div>
      <div
        className={cn("w-full max-w-[11rem] rounded-b-lg border-x border-b", slot.pedestalHeight, slot.pedestal)}
        aria-hidden
      />
    </div>
  )
}

function PhaseLeaderCard({
  title,
  icon: Icon,
  leader,
  pointsLabel,
  accent,
}: {
  title: string
  icon: typeof Flag
  leader: Player | undefined
  pointsLabel: string
  accent: "primary" | "secondary"
}) {
  if (!leader) return null
  const pts = accent === "primary" ? leader.group_points : leader.knockout_points
  if (pts <= 0) return null

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col gap-2 rounded-xl border p-4",
        accent === "primary"
          ? "border-primary/25 bg-primary/5"
          : "border-secondary/30 bg-secondary/10",
      )}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className={cn("h-4 w-4 shrink-0", accent === "primary" ? "text-primary" : "text-secondary-foreground")} />
        {title}
      </div>
      <ProfileNameWithStatus
        name={leader.display_name}
        status={leader.status_message}
        nameClassName="font-bold text-foreground"
      />
      <p className="text-2xl font-bold tabular-nums text-primary">{pts}</p>
      <p className="text-xs text-muted-foreground">{pointsLabel}</p>
    </div>
  )
}

export function RankingWinnersSection({
  players,
  scopeLabel,
  currentUserId,
}: {
  players: Player[]
  scopeLabel: string
  currentUserId: string | null
}) {
  if (players.length === 0) return null

  const rankings = buildTotalRankings(players)
  const myEntry = currentUserId ? findPlayerRank(rankings, currentUserId) : null
  const leaderGroup = [...players].sort(sortByGroupPoints)[0]
  const leaderKo = [...players].sort(sortByKnockoutPoints)[0]
  const hasPhaseLeaders =
    (leaderGroup?.group_points ?? 0) > 0 || (leaderKo?.knockout_points ?? 0) > 0

  const topPoints = rankings[0]?.player.total_points ?? 0
  const showPodium = topPoints > 0

  return (
    <Card className="overflow-hidden border-border/80 bg-gradient-to-b from-muted/30 to-background shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg text-foreground">
          <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          Ganhadores do bolão
          <Badge variant="outline" className="font-normal text-muted-foreground">
            {scopeLabel}
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pódio geral por pontos totais. Desempate: exatos, depois acertos +7.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 pt-0">
        {myEntry ? (
          <div
            className={cn(
              "flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
              myEntry.rank <= 3 ? "border-primary/30 bg-primary/5" : "border-border/80 bg-muted/20",
            )}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sua posição</p>
              <p className="text-base font-bold text-foreground">
                {myEntry.rank}º lugar
                {entriesAtRank(rankings, myEntry.rank).length > 1 ? " (empatado)" : ""}
                {" · "}
                {myEntry.player.total_points} pts
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Grupos {myEntry.player.group_points}</span>
              <span>·</span>
              <span>Mata-mata {myEntry.player.knockout_points}</span>
              <span>·</span>
              <span>{myEntry.player.exact_hits} exatos</span>
            </div>
          </div>
        ) : null}

        {showPodium ? (
          <div className="flex items-end justify-center gap-2 pt-2 sm:gap-4">
            {PODIUM_SLOTS.map((slot) => (
              <PodiumSlot
                key={slot.rank}
                rank={slot.rank}
                entries={entriesAtRank(rankings, slot.rank)}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Ainda não há pontos — o pódio aparece quando começarem a sair resultados.
          </p>
        )}

        {hasPhaseLeaders ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <PhaseLeaderCard
              title="Líder na fase de grupos"
              icon={Flag}
              leader={leaderGroup}
              pointsLabel="pontos só em jogos de grupos"
              accent="primary"
            />
            <PhaseLeaderCard
              title="Líder no mata-mata"
              icon={Swords}
              leader={leaderKo}
              pointsLabel="pontos em eliminatórias (+ palpite campeão, se já pontuou)"
              accent="secondary"
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
