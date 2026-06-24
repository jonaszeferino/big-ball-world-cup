"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  /** Ícone compacto para navbar. */
  compact?: boolean
  className?: string
}

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && resolvedTheme === "dark"

  const toggle = () => setTheme(isDark ? "light" : "dark")

  if (!mounted) {
    return compact ? (
      <div className={cn("h-9 w-9 shrink-0", className)} aria-hidden />
    ) : (
      <div className={cn("h-9 w-[7.5rem]", className)} aria-hidden />
    )
  }

  if (compact) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground", className)}
        onClick={toggle}
        aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
        title={isDark ? "Modo claro" : "Modo escuro"}
      >
        {isDark ? <Sun className="h-[1.125rem] w-[1.125rem]" /> : <Moon className="h-[1.125rem] w-[1.125rem]" />}
      </Button>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Sun className="h-4 w-4 text-muted-foreground" aria-hidden />
      <Switch
        id="theme-toggle"
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Modo escuro"
      />
      <Moon className="h-4 w-4 text-muted-foreground" aria-hidden />
      <Label htmlFor="theme-toggle" className="sr-only">
        Modo escuro
      </Label>
    </div>
  )
}
