"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FifaKnockoutSchedulePanel } from "@/components/fifa-knockout-schedule-panel"
import { PlayoffBrackets } from "@/components/playoff-brackets"
import { FIFA_KNOCKOUT_STAGE_LABELS, getFifaKnockoutScheduleForMatchesTab } from "@/lib/fifa-knockout-schedule"

type MatchesKnockoutAccordionsProps = {
  stageTab: string
}

function fifaAccordionTitle(stageTab: string): string {
  if (stageTab === "final") return "Calendário FIFA — 3º lugar e final"
  const label = FIFA_KNOCKOUT_STAGE_LABELS[stageTab as keyof typeof FIFA_KNOCKOUT_STAGE_LABELS]
  return label ? `Calendário FIFA — ${label}` : "Calendário FIFA — mata-mata"
}

export function MatchesKnockoutAccordions({ stageTab }: MatchesKnockoutAccordionsProps) {
  const hasFifaSchedule = getFifaKnockoutScheduleForMatchesTab(stageTab).length > 0
  const showBrackets = stageTab === "round_of_32"

  if (!hasFifaSchedule && !showBrackets) return null

  return (
    <Accordion
      type="multiple"
      className="rounded-2xl border border-border bg-card px-3 shadow-sm sm:px-4"
    >
      {hasFifaSchedule ? (
        <AccordionItem value="fifa-schedule">
          <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
            {fifaAccordionTitle(stageTab)}
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <FifaKnockoutSchedulePanel matchesTab={stageTab} embedded />
          </AccordionContent>
        </AccordionItem>
      ) : null}

      {showBrackets ? (
        <AccordionItem value="brackets">
          <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
            Estrutura dos 16-avos de Final (Rodada de 32)
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <PlayoffBrackets embedded />
          </AccordionContent>
        </AccordionItem>
      ) : null}
    </Accordion>
  )
}
