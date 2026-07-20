"use client"

import { Crown, Lock, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CountryFlag } from "@/components/country-flag"
import { ProfileNameWithStatus } from "@/components/profile-name-with-status"
import { cn } from "@/lib/utils"
import {
  POINTS_CHAMPION,
  POINTS_FINALIST,
  POINTS_RUNNER_UP,
} from "@/lib/champion-bet-scoring"
import { areChampionBetsPublic, type ChampionBetPublicRow } from "@/lib/champion-bet-display"
import { formatChampionBetDeadlineLabel } from "@/lib/champion-bet-deadline"

function TeamPick({
  team,
  role,
}: {
  team: ChampionBetPublicRow["championTeam"]
  role: "campeão" | "vice"
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      {role === "campeão" ? (
        <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
      ) : null}
      <CountryFlag countryName={team.name} size="sm" />
      <span className="truncate font-medium text-foreground">{team.code}</span>
      <span className="hidden text-muted-foreground sm:inline">· {team.name}</span>
    </span>
  )
}

export function ChampionBetsRankingSection({
  rows,
  playerIdsInScope,
  currentUserId,
}: {
  rows: ChampionBetPublicRow[]
  playerIdsInScope: Set<string>
  currentUserId: string | null
}) {
  const isPublic = areChampionBetsPublic()
  const scopedRows = rows
    .filter((r) => playerIdsInScope.has(r.userId))
    .sort((a, b) => {
      if (b.pointsEarned !== a.pointsEarned) return b.pointsEarned - a.pointsEarned
      return a.displayName.localeCompare(b.displayName, "pt")
    })

  const withBet = scopedRows.length
  const withoutBet = [...playerIdsInScope].filter((id) => !scopedRows.some((r) => r.userId === id)).length

  return (
    <Card className="border-amber-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg text-foreground">
          <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          Palpite campeão e vice
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Campeão +{POINTS_CHAMPION} · Vice +{POINTS_RUNNER_UP} · Finalista +{POINTS_FINALIST} (cada seleção).
          {!isPublic ? (
            <>
              {" "}
              Palpites de todos ficam visíveis após{" "}
              <strong className="font-medium text-foreground">{formatChampionBetDeadlineLabel()}</strong>.
            </>
          ) : null}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {!isPublic ? (
          <div className="flex items-start gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              O prazo ainda está aberto — os palpites dos outros participantes só aparecem aqui depois do
              encerramento, para não influenciar quem ainda não apostou.
            </p>
          </div>
        ) : scopedRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Ninguém neste âmbito registrou palpite de campeão ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left font-medium text-muted-foreground">Jogador</th>
                  <th className="pb-3 text-left font-medium text-muted-foreground">Campeão</th>
                  <th className="pb-3 text-left font-medium text-muted-foreground">Vice</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Pts palpite</th>
                </tr>
              </thead>
              <tbody>
                {scopedRows.map((row) => {
                  const isMe = row.userId === currentUserId
                  return (
                    <tr
                      key={row.userId}
                      className={cn(
                        "border-b border-border last:border-0",
                        isMe && "bg-primary/5",
                        row.pointsEarned > 0 && "bg-emerald-500/5",
                      )}
                    >
                      <td className="py-3 pr-3">
                        <ProfileNameWithStatus
                          name={row.displayName}
                          status={row.statusMessage}
                          nameClassName={isMe ? "text-primary font-medium" : undefined}
                          suffix={
                            isMe ? (
                              <span className="text-xs font-normal text-muted-foreground">(você)</span>
                            ) : undefined
                          }
                        />
                      </td>
                      <td className="py-3 pr-3">
                        <TeamPick team={row.championTeam} role="campeão" />
                      </td>
                      <td className="py-3 pr-3">
                        <TeamPick team={row.runnerUpTeam} role="vice" />
                      </td>
                      <td className="py-3 text-right">
                        {row.pointsEarned > 0 ? (
                          <Badge className="bg-emerald-600/90 font-bold tabular-nums hover:bg-emerald-600/90">
                            +{row.pointsEarned}
                          </Badge>
                        ) : (
                          <span className="tabular-nums text-muted-foreground">0</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-muted-foreground">
              {withBet} palpite{withBet === 1 ? "" : "s"} neste âmbito
              {withoutBet > 0 ? ` · ${withoutBet} participante${withoutBet === 1 ? "" : "s"} sem palpite` : ""}.
              Pontos do palpite entram no total após o encerramento da final no bolão.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
