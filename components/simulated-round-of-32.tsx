"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getCountryFlag } from "@/lib/country-flags"
import type { ResolvedSlot, SimulatedRoundOf32Bracket } from "@/lib/simulated-round-of-32"
import { cn } from "@/lib/utils"

function SlotLine({ slot }: { slot: ResolvedSlot }) {
  if (slot.team) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
        <div className="flex min-w-0 items-center gap-2 font-medium text-foreground">
          <span className="text-lg leading-none sm:text-xl" title={slot.team.name}>
            {getCountryFlag(slot.team.name)}
          </span>
          <span className="truncate">{slot.team.code}</span>
        </div>
        <span
          className="max-w-[11rem] shrink-0 text-right text-[10px] leading-tight text-muted-foreground sm:max-w-none sm:text-xs"
          title={slot.positionLabel}
        >
          {slot.positionLabel}
        </span>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
      <span
        className="font-medium text-muted-foreground"
        title="Complete os palpites da fase de grupos ou aguarde dados"
      >
        {slot.fallbackLabel || "—"}
      </span>
      <span className="max-w-[11rem] shrink-0 text-right text-[10px] text-muted-foreground sm:text-xs">
        {slot.positionLabel}
      </span>
    </div>
  )
}

function MatchBox({
  team1,
  team2,
  fifaMatchNum,
}: {
  team1: ResolvedSlot
  team2: ResolvedSlot
  fifaMatchNum: number
}) {
  return (
    <div className="rounded-md border border-border/80 bg-muted/40 p-2.5">
      <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Jogo FIFA {fifaMatchNum}
        </span>
        <span className="text-[10px] text-muted-foreground">Copa 2026</span>
      </div>
      <SlotLine slot={team1} />
      <div className="py-0.5 text-center text-[10px] text-muted-foreground">vs</div>
      <SlotLine slot={team2} />
    </div>
  )
}

export function SimulatedRoundOf32({ brackets }: { brackets: SimulatedRoundOf32Bracket[] }) {
  const sideA = brackets.filter((b) => b.side === "A")
  const sideB = brackets.filter((b) => b.side === "B")

  return (
    <Card className="rounded-2xl border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-foreground">16-avos (simulado com os seus palpites)</CardTitle>
        <p className="text-sm text-muted-foreground">
          O regulamento da Copa 2026 prevê misturar tipos de jogo nos 16-avos: há{" "}
          <span className="font-medium text-foreground">2º contra 2º</span>,{" "}
          <span className="font-medium text-foreground">1º contra 2º</span> e{" "}
          <span className="font-medium text-foreground">1º contra um dos melhores 3º</span> — não é só 1º vs 2º. Os
          números &quot;Jogo FIFA&quot; (73–88) seguem o calendário oficial. Os oito vagos de 3º são preenchidos de forma
          global entre os teus palpites.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge className="text-xs">Lado A</Badge>
              <span className="text-xs text-muted-foreground">4 chaves</span>
            </div>
            <div className="flex flex-col gap-3">
              {sideA.map((bracket) => (
                <div
                  key={bracket.key}
                  className={cn(
                    "rounded-xl border border-border p-3",
                    "border-l-4 border-l-primary",
                  )}
                >
                  <p className="mb-2 text-xs font-semibold text-foreground">Chave {bracket.key}</p>
                  <div className="flex flex-col gap-2">
                    <MatchBox
                      fifaMatchNum={bracket.fifaMatch1}
                      team1={bracket.match1.team1}
                      team2={bracket.match1.team2}
                    />
                    {bracket.match2 && (
                      <MatchBox
                        fifaMatchNum={bracket.fifaMatch2}
                        team1={bracket.match2.team1}
                        team2={bracket.match2.team2}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Lado B
              </Badge>
              <span className="text-xs text-muted-foreground">4 chaves</span>
            </div>
            <div className="flex flex-col gap-3">
              {sideB.map((bracket) => (
                <div
                  key={bracket.key}
                  className={cn(
                    "rounded-xl border border-border p-3",
                    "border-l-4 border-l-secondary",
                  )}
                >
                  <p className="mb-2 text-xs font-semibold text-foreground">Chave {bracket.key}</p>
                  <div className="flex flex-col gap-2">
                    <MatchBox
                      fifaMatchNum={bracket.fifaMatch1}
                      team1={bracket.match1.team1}
                      team2={bracket.match1.team2}
                    />
                    {bracket.match2 && (
                      <MatchBox
                        fifaMatchNum={bracket.fifaMatch2}
                        team1={bracket.match2.team1}
                        team2={bracket.match2.team2}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
