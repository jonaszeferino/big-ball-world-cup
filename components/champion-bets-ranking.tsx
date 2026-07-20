"use client"

import { Crown, Lock, Medal, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CountryFlag } from "@/components/country-flag"
import { ProfileNameWithStatus } from "@/components/profile-name-with-status"
import { cn } from "@/lib/utils"
import {
  areChampionBetsPublic,
  formatCopaFinalScore,
  POINTS_CHAMPION,
  POINTS_FINALIST,
  POINTS_RUNNER_UP,
  type ChampionBetPublicRow,
  type CopaFinalResult,
} from "@/lib/champion-bet-display"
import { formatChampionBetDeadlineLabel } from "@/lib/champion-bet-deadline"

function OfficialCopaResultBanner({ result }: { result: CopaFinalResult }) {
  return (
    <div className="mb-6 rounded-xl border border-amber-400/35 bg-gradient-to-br from-amber-500/15 via-background to-emerald-500/10 p-4 sm:p-5">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">
        <Trophy className="h-4 w-4" />
        Resultado oficial da Copa — palpite campeão
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-amber-400/30 bg-background/60 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Campeão</p>
          <div className="flex min-w-0 items-center gap-2">
            <CountryFlag countryName={result.championTeam.name} size="md" />
            <div className="min-w-0">
              <p className="truncate font-bold text-foreground">{result.championTeam.name}</p>
              <p className="text-sm text-muted-foreground">{result.championTeam.code}</p>
            </div>
          </div>
          <Badge className="w-fit bg-amber-500/90 font-bold tabular-nums text-amber-950 hover:bg-amber-500/90">
            +{POINTS_CHAMPION} pts quem acertou
          </Badge>
        </div>

        <div className="flex min-w-0 flex-col gap-2 rounded-lg border border-slate-400/25 bg-background/60 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Vice-campeão</p>
          <div className="flex min-w-0 items-center gap-2">
            <CountryFlag countryName={result.runnerUpTeam.name} size="md" />
            <div className="min-w-0">
              <p className="truncate font-bold text-foreground">{result.runnerUpTeam.name}</p>
              <p className="text-sm text-muted-foreground">{result.runnerUpTeam.code}</p>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit font-bold tabular-nums">
            +{POINTS_RUNNER_UP} pts quem acertou
          </Badge>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        Placar da final: <strong className="font-medium text-foreground">{formatCopaFinalScore(result)}</strong>
        {" · "}
        Time na final, posição errada: <strong className="font-medium text-foreground">+{POINTS_FINALIST} pts</strong>{" "}
        (por seleção).
      </p>
    </div>
  )
}

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
  officialResult,
}: {
  rows: ChampionBetPublicRow[]
  playerIdsInScope: Set<string>
  currentUserId: string | null
  officialResult: CopaFinalResult | null
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
        {officialResult ? (
          <OfficialCopaResultBanner result={officialResult} />
        ) : (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-4 text-sm text-muted-foreground">
            <Medal className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Campeão e vice oficiais da Copa (e a pontuação do palpite) aparecem aqui quando a{" "}
              <strong className="font-medium text-foreground">final</strong> for encerrada no bolão.
            </p>
          </div>
        )}

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
              {officialResult
                ? " Pontos já contabilizados conforme o resultado oficial acima."
                : " Pontos do palpite entram no total após o encerramento da final no bolão."}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
