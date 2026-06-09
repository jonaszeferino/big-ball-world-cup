import { cn } from "@/lib/utils"
import { getOddHighlight, oddHighlightClass } from "@/lib/odds-display"

interface Odds1x2LineProps {
  home: string | null
  draw: string | null
  away: string | null
  className?: string
  separatorClassName?: string
}

function OddValue({
  value,
  home,
  draw,
  away,
}: {
  value: string | null
  home: string | null
  draw: string | null
  away: string | null
}) {
  const display = value ?? "—"
  const highlight = getOddHighlight(value, home, draw, away)

  return <span className={oddHighlightClass(highlight)}>{display}</span>
}

export function Odds1x2Line({
  home,
  draw,
  away,
  className,
  separatorClassName = "text-muted-foreground",
}: Odds1x2LineProps) {
  return (
    <span className={cn("tabular-nums", className)}>
      <OddValue value={home} home={home} draw={draw} away={away} />
      <span className={separatorClassName}> · </span>
      <OddValue value={draw} home={home} draw={draw} away={away} />
      <span className={separatorClassName}> · </span>
      <OddValue value={away} home={home} draw={draw} away={away} />
    </span>
  )
}
