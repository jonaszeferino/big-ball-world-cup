"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Toaster } from "sonner"

export function AppSonner() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const theme = mounted && resolvedTheme === "dark" ? "dark" : "light"

  return (
    <Toaster
      position="top-center"
      theme={theme}
      closeButton
      richColors
      style={{ zIndex: 9999 }}
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-background text-foreground border border-border shadow-lg",
          title: "text-foreground font-semibold",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
    />
  )
}
