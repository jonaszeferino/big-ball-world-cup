import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ProfileNameWithStatusProps {
  name: string
  status?: string | null
  nameClassName?: string
  statusClassName?: string
  suffix?: ReactNode
}

/** Nome + frase de status (navbar, ranking, palpites). */
export function ProfileNameWithStatus({
  name,
  status,
  nameClassName,
  statusClassName,
  suffix,
}: ProfileNameWithStatusProps) {
  const statusLine = status?.trim()

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-x-1">
        <span className={cn("font-medium text-foreground", nameClassName)}>{name}</span>
        {suffix}
      </div>
      {statusLine ? (
        <p className={cn("truncate text-xs text-muted-foreground", statusClassName)} title={statusLine}>
          {statusLine}
        </p>
      ) : null}
    </div>
  )
}
