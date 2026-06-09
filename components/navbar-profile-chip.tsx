"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Loader2, LogOut, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NavbarProfile {
  id: string
  display_name: string
  status_message: string | null
  is_admin: boolean
}

interface NavbarProfileChipProps {
  profile: NavbarProfile
  onProfileUpdated: (profile: NavbarProfile) => void
  onLogout: () => void
  className?: string
}

const MAX_NAME = 40
const MAX_STATUS = 80

export function NavbarProfileChip({ profile, onProfileUpdated, onLogout, className }: NavbarProfileChipProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(profile.display_name)
  const [status, setStatus] = useState(profile.status_message ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(profile.display_name)
    setStatus(profile.status_message ?? "")
  }, [profile.display_name, profile.status_message])

  const userInitial = profile.display_name.trim().charAt(0).toUpperCase() || "?"
  const statusLine = profile.status_message?.trim()

  const handleSave = async () => {
    const trimmedName = name.trim()
    const trimmedStatus = status.trim()

    if (!trimmedName) {
      setError("O nome não pode ficar vazio.")
      return
    }
    if (trimmedName.length > MAX_NAME) {
      setError(`Nome demasiado longo (máx. ${MAX_NAME} caracteres).`)
      return
    }
    if (trimmedStatus.length > MAX_STATUS) {
      setError(`Status demasiado longo (máx. ${MAX_STATUS} caracteres).`)
      return
    }

    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data, error: updateErr } = await supabase
      .from("profiles")
      .update({
        display_name: trimmedName,
        status_message: trimmedStatus || null,
      })
      .eq("id", profile.id)
      .select("id, display_name, status_message, is_admin")
      .single()

    setSaving(false)
    if (updateErr) {
      setError(
        updateErr.message.includes("status_message")
          ? `${updateErr.message} — corre scripts/019_profiles_status_message.sql no Supabase.`
          : updateErr.message,
      )
      return
    }

    if (data) {
      onProfileUpdated(data as NavbarProfile)
    }
    setOpen(false)
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-2xl border border-border/50 bg-muted/30 py-1 pl-1 pr-1 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 max-w-[7.5rem] items-center gap-2 rounded-xl px-1 py-0.5 text-left transition-colors hover:bg-background/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[11rem]"
            aria-label="Editar nome e status"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/5 text-xs font-semibold text-primary ring-1 ring-primary/15"
              aria-hidden
            >
              {userInitial}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-medium text-foreground">{profile.display_name}</span>
              {statusLine ? (
                <span className="block truncate text-[11px] text-muted-foreground">{statusLine}</span>
              ) : (
                <span className="block truncate text-[11px] italic text-muted-foreground/70">Adicionar status…</span>
              )}
            </div>
            <Pencil className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/80 sm:block" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-4">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">O teu perfil</p>
              <p className="text-xs text-muted-foreground">Nome no bolão e frase de status na navbar.</p>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nav-profile-name">Nome</Label>
              <Input
                id="nav-profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={MAX_NAME}
                disabled={saving}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nav-profile-status">Status</Label>
              <Input
                id="nav-profile-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Ex.: Vai Brasil! 🇧🇷"
                maxLength={MAX_STATUS}
                disabled={saving}
              />
            </div>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        size="icon"
        onClick={onLogout}
        className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
        aria-label="Sair"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
