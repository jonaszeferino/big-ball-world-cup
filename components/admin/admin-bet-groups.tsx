"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export interface BetGroup {
  id: number | string
  created_at: string
  name: string
  observations: string | null
  is_deleted: boolean
}

export function AdminBetGroups() {
  const [rows, setRows] = useState<BetGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newName, setNewName] = useState("")
  const [newObs, setNewObs] = useState("")

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from("bet_groups")
      .select("id, created_at, name, observations, is_deleted")
      .order("created_at", { ascending: false })
    if (err) {
      setError(err.message)
      setRows([])
    } else {
      setError(null)
      setRows((data ?? []) as BetGroup[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) return
    setIsSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from("bet_groups").insert({
      name,
      observations: newObs.trim() || null,
      is_deleted: false,
    })
    setIsSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    setNewName("")
    setNewObs("")
    await load()
  }

  const handleSaveRow = async (g: BetGroup, name: string, observations: string) => {
    setIsSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from("bet_groups")
      .update({
        name: name.trim(),
        observations: observations.trim() || null,
      })
      .eq("id", g.id)
    setIsSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    await load()
  }

  const setSoftDeleted = async (g: BetGroup, isDeleted: boolean) => {
    setIsSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from("bet_groups").update({ is_deleted: isDeleted }).eq("id", g.id)
    setIsSubmitting(false)
    if (err) {
      setError(err.message)
      return
    }
    await load()
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">A carregar grupos…</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Novo grupo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:max-w-xl">
          <div className="grid gap-2">
            <Label htmlFor="bg-name">Nome do grupo</Label>
            <Input
              id="bg-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex.: Amigos do escritório"
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bg-obs">Notas / como entrar (opcional)</Label>
            <Textarea
              id="bg-obs"
              value={newObs}
              onChange={(e) => setNewObs(e.target.value)}
              placeholder="Texto livre para o site (ex.: contactar X no WhatsApp)"
              rows={3}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleCreate()} disabled={isSubmitting || !newName.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Criar grupo
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={isSubmitting}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Atualizar lista
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Todos os grupos (inclui inativos)</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum grupo criado ainda.</p>
        ) : (
          rows.map((g) => (
            <BetGroupAdminRow
              key={String(g.id)}
              group={g}
              disabled={isSubmitting}
              onSave={(name, obs) => void handleSaveRow(g, name, obs)}
              onArchive={() => void setSoftDeleted(g, true)}
              onRestore={() => void setSoftDeleted(g, false)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function BetGroupAdminRow({
  group,
  disabled,
  onSave,
  onArchive,
  onRestore,
}: {
  group: BetGroup
  disabled: boolean
  onSave: (name: string, obs: string) => void
  onArchive: () => void
  onRestore: () => void
}) {
  const [name, setName] = useState(group.name)
  const [obs, setObs] = useState(group.observations ?? "")

  useEffect(() => {
    setName(group.name)
    setObs(group.observations ?? "")
  }, [group.id, group.name, group.observations])

  const created = format(new Date(group.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })

  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 shadow-sm ${group.is_deleted ? "opacity-70" : ""}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">#{String(group.id)} · criado em {created}</span>
        {group.is_deleted ? (
          <Badge variant="secondary">Inativo</Badge>
        ) : (
          <Badge variant="outline" className="border-primary/40 text-primary">
            Ativo
          </Badge>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label className="text-xs">Nome</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label className="text-xs">Observações</Label>
          <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} disabled={disabled} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={() => onSave(name, obs)}>
          Guardar alterações
        </Button>
        {!group.is_deleted ? (
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onArchive}>
            Marcar como inativo
          </Button>
        ) : (
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={onRestore}>
            Reativar
          </Button>
        )}
      </div>
    </div>
  )
}
