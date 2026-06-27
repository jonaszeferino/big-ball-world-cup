"use client"

import { usePathname } from "next/navigation"
import { ArrowUp, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export const MATCHES_REFRESH_EVENT = "bbwc-matches-refresh"

export function MatchesFloatingActions() {
  const pathname = usePathname()
  if (!pathname.startsWith("/matches")) return null

  return (
    <>
      <Button
        id="backToTheTop"
        type="button"
        variant="secondary"
        size="icon"
        className="h-11 w-11 rounded-full border border-border bg-card shadow-md"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Voltar ao topo"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="h-11 w-11 rounded-full border border-border bg-card shadow-md"
        onClick={() => window.dispatchEvent(new CustomEvent(MATCHES_REFRESH_EVENT))}
        aria-label="Atualizar partidas e apostas"
        title="Atualizar"
      >
        <RefreshCw className="h-5 w-5" />
      </Button>
    </>
  )
}
