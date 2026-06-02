"use client"

import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Shield, UserMinus, UserPlus } from "lucide-react"

export interface ProfileOption {
  id: string
  display_name: string
  email: string
  bet_group_id: number | string | null
}

interface GroupMembersAdminProps {
  groupId: string
  groupName: string
  profiles: ProfileOption[]
  groupNamesById: Record<string, string>
  disabled?: boolean
  onChanged: () => void | Promise<void>
}

export function GroupMembersAdmin({
  groupId,
  groupName,
  profiles,
  groupNamesById,
  disabled = false,
  onChanged,
}: GroupMembersAdminProps) {
  const [selectedUserId, setSelectedUserId] = useState("")
  const [actionUserId, setActionUserId] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const members = useMemo(
    () =>
      profiles
        .filter((p) => p.bet_group_id != null && String(p.bet_group_id) === groupId)
        .sort((a, b) => a.display_name.localeCompare(b.display_name)),
    [profiles, groupId],
  )

  const addCandidates = useMemo(
    () =>
      profiles
        .filter((p) => p.bet_group_id == null || String(p.bet_group_id) !== groupId)
        .sort((a, b) => a.display_name.localeCompare(b.display_name)),
    [profiles, groupId],
  )

  const addToGroup = async (userId: string) => {
    if (!userId) return
    setLocalError(null)
    setActionUserId(userId)
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({ bet_group_id: Number(groupId) })
      .eq("id", userId)
    setActionUserId(null)
    if (error) {
      setLocalError(error.message)
      return
    }
    setSelectedUserId("")
    await onChanged()
  }

  const removeFromGroup = async (userId: string) => {
    setLocalError(null)
    setActionUserId(userId)
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({ bet_group_id: null }).eq("id", userId)
    setActionUserId(null)
    if (error) {
      setLocalError(error.message)
      return
    }
    await onChanged()
  }

  return (
    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        Gerir membros (admin)
      </div>

      {localError ? (
        <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {localError}
        </p>
      ) : null}

      <div className="mb-4 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Membros ({members.length})
        </p>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguém neste grupo ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{member.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1.5 text-muted-foreground hover:text-destructive"
                  disabled={disabled || actionUserId === member.id}
                  onClick={() => void removeFromGroup(member.id)}
                >
                  {actionUserId === member.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4" />
                  )}
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 border-t border-border/50 pt-4">
        <Label htmlFor={`add-member-${groupId}`} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Adicionar pessoa a {groupName}
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            disabled={disabled || addCandidates.length === 0}
          >
            <SelectTrigger id={`add-member-${groupId}`} className="sm:flex-1">
              <SelectValue placeholder={addCandidates.length === 0 ? "Todos já estão no grupo" : "Escolher pessoa"} />
            </SelectTrigger>
            <SelectContent>
              {addCandidates.map((p) => {
                const otherGroup =
                  p.bet_group_id != null ? groupNamesById[String(p.bet_group_id)] : null
                return (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name}
                    {otherGroup ? ` (em ${otherGroup})` : p.bet_group_id == null ? " (sem grupo)" : ""}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            className="gap-1.5 sm:shrink-0"
            disabled={disabled || !selectedUserId || actionUserId === selectedUserId}
            onClick={() => void addToGroup(selectedUserId)}
          >
            {actionUserId === selectedUserId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Adicionar
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Ao adicionar alguém de outro grupo, a pessoa passa a contar só no ranking deste grupo.
        </p>
      </div>
    </div>
  )
}
