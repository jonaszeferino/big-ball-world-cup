"use client"

import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type MatchesNextStageCtaProps = {
  currentLabel: string
  nextLabel: string
  onGoNext: () => void
}

export function MatchesNextStageCta({ currentLabel, nextLabel, onGoNext }: MatchesNextStageCtaProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-foreground">
        <span className="font-semibold">{currentLabel}</span> encerrada — não há mais jogos abertos nesta fase.
        Continue a apostar em <span className="font-semibold">{nextLabel}</span>.
      </p>
      <Button type="button" className="shrink-0 gap-1.5 rounded-xl" onClick={onGoNext}>
        Ir para {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
