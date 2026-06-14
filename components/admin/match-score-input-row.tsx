"use client"

import { Input } from "@/components/ui/input"
import { formatPalpiteScoreDisplay, parsePalpiteScoreInput } from "@/lib/score-input"
import { cn } from "@/lib/utils"

type MatchScoreInputRowProps = {
  homeCode: string
  awayCode: string
  homeScore: number
  awayScore: number
  onHomeChange: (value: number) => void
  onAwayChange: (value: number) => void
  size?: "default" | "compact"
  className?: string
}

export function MatchScoreInputRow({
  homeCode,
  awayCode,
  homeScore,
  awayScore,
  onHomeChange,
  onAwayChange,
  size = "default",
  className,
}: MatchScoreInputRowProps) {
  const inputClass =
    size === "compact"
      ? "h-10 w-full min-w-0 text-center text-base font-bold tabular-nums"
      : "h-12 w-full min-w-0 text-center text-xl font-bold tabular-nums"

  return (
    <div
      className={cn(
        "grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-x-3 gap-y-1",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col items-center gap-1">
        <span className="max-w-full truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {homeCode}
        </span>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={2}
          value={formatPalpiteScoreDisplay(homeScore)}
          onChange={(e) => onHomeChange(parsePalpiteScoreInput(e.target.value))}
          className={inputClass}
          aria-label={`Gols ${homeCode}`}
        />
      </div>
      <span className="pb-3 text-base font-medium text-muted-foreground" aria-hidden>
        ×
      </span>
      <div className="flex min-w-0 flex-col items-center gap-1">
        <span className="max-w-full truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {awayCode}
        </span>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={2}
          value={formatPalpiteScoreDisplay(awayScore)}
          onChange={(e) => onAwayChange(parsePalpiteScoreInput(e.target.value))}
          className={inputClass}
          aria-label={`Gols ${awayCode}`}
        />
      </div>
    </div>
  )
}
