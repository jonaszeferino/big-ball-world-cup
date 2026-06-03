"use client"

import { Toaster } from "sonner"

/** Toaster global (tema claro, alinhado ao app — sem ThemeProvider). */
export function AppSonner() {
  return (
    <Toaster
      position="top-center"
      theme="light"
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
