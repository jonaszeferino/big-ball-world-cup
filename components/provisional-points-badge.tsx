import { cn } from "@/lib/utils"
import { provisionalPointsHint } from "@/lib/provisional-bet-points"

type ProvisionalPointsBadgeProps = {
  points: number
  stage: string
  className?: string
}

export function ProvisionalPointsBadge({ points, stage, className }: ProvisionalPointsBadgeProps) {
  const hint = provisionalPointsHint(stage, points)

  return (
    <span
      className={cn(
        "text-xs font-semibold tabular-nums",
        points > 0 ? "text-amber-800 dark:text-amber-200" : "text-muted-foreground",
        className,
      )}
      title="Pontuação provisória com base no placar parcial — pode mudar até o fim do jogo"
    >
      {points > 0 ? `+${points}` : "0"} prov.
      {hint ? ` · ${hint}` : null}
    </span>
  )
}
