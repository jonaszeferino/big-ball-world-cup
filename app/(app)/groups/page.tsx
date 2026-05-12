"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Users, BarChart3, UserPlus, UserMinus } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { BetGroup } from "@/components/admin/admin-bet-groups"

export default function GroupsPage() {
  const [rows, setRows] = useState<BetGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [newName, setNewName] = useState("")
  const [newObs, setNewObs] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [myBetGroupId, setMyBetGroupId] = useState<string | null>(null)
  const [groupActionId, setGroupActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: authData }, { data }] = await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from("bet_groups")
        .select("id, created_at, name, observations, is_deleted")
        .eq("is_deleted", false)
        .order("name", { ascending: true }),
    ])
    setUserId(authData.user?.id ?? null)
    if (authData.user) {
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("bet_group_id")
        .eq("id", authData.user.id)
        .single()
      if (!profErr && prof?.bet_group_id != null && String(prof.bet_group_id) !== "") {
        setMyBetGroupId(String(prof.bet_group_id))
      } else {
        setMyBetGroupId(null)
      }
    } else {
      setMyBetGroupId(null)
    }
    setAuthChecked(true)
    setRows((data ?? []) as BetGroup[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name || !userId) return
    setIsSubmitting(true)
    setFormError(null)
    const supabase = createClient()
    const { error } = await supabase.from("bet_groups").insert({
      name,
      observations: newObs.trim() || null,
      is_deleted: false,
    })
    setIsSubmitting(false)
    if (error) {
      setFormError(error.message)
      return
    }
    setNewName("")
    setNewObs("")
    await load()
  }

  const joinGroup = async (groupId: string) => {
    if (!userId) return
    setFormError(null)
    setGroupActionId(groupId)
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({ bet_group_id: Number(groupId) })
      .eq("id", userId)
    setGroupActionId(null)
    if (error) {
      setFormError(error.message)
      return
    }
    setMyBetGroupId(groupId)
  }

  const leaveGroup = async (groupId: string) => {
    if (!userId) return
    setFormError(null)
    setGroupActionId(groupId)
    const supabase = createClient()
    const { error } = await supabase.from("profiles").update({ bet_group_id: null }).eq("id", userId)
    setGroupActionId(null)
    if (error) {
      setFormError(error.message)
      return
    }
    setMyBetGroupId(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Grupos de apostas</h1>
        <p className="mt-1 text-sm text-foreground/80">
          Cria um grupo para reunir amigos no bolão ou vê os grupos já registados com notas e contactos.
        </p>
      </div>

      <Card className="border-primary/25 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Cadastrar novo grupo</CardTitle>
          <CardDescription>
            {authChecked && !userId
              ? "Entra na tua conta para registar um grupo."
              : "Define o nome e, se quiseres, como o pessoal se junta ao grupo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!authChecked ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !userId ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/auth/login">Entrar</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/auth/sign-up">Criar conta</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => void handleCreateGroup(e)} className="flex max-w-xl flex-col gap-4">
              {formError && (
                <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              )}
              <div className="grid gap-2">
                <Label htmlFor="grp-name">Nome do grupo</Label>
                <Input
                  id="grp-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex.: Amigos da firma"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="grp-obs">Notas / como entrar (opcional)</Label>
                <Textarea
                  id="grp-obs"
                  value={newObs}
                  onChange={(e) => setNewObs(e.target.value)}
                  placeholder="WhatsApp, regras do grupo, etc."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
              <Button type="submit" disabled={isSubmitting || !newName.trim()}>
                {isSubmitting ? "A guardar…" : "Cadastrar grupo"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Grupos registados</h2>
        {formError ? (
          <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        ) : null}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <Card className="border-dashed border-border bg-muted/20">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Ainda não há grupos públicos. Sê o primeiro a cadastrar.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((g) => {
              const gid = String(g.id)
              const isMember = myBetGroupId === gid
              return (
                <Card key={gid} className="border-border/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
                      <Users className="h-5 w-5 shrink-0 text-primary" />
                      {g.name}
                      {userId && isMember ? (
                        <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                          Membro
                        </span>
                      ) : null}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Criado em {format(new Date(g.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </CardHeader>
                  {g.observations ? (
                    <CardContent className="pt-0">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{g.observations}</p>
                    </CardContent>
                  ) : null}
                  <CardFooter className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <Link href={`/ranking?grupo=${gid}`}>
                        <BarChart3 className="h-4 w-4" />
                        Ranking do grupo
                      </Link>
                    </Button>
                    {!userId ? (
                      <span className="text-xs text-muted-foreground">
                        <Link href="/auth/login" className="text-primary underline underline-offset-4">
                          Entra
                        </Link>{" "}
                        para te registares no grupo
                      </span>
                    ) : isMember ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground"
                        disabled={groupActionId === gid}
                        onClick={() => void leaveGroup(gid)}
                      >
                        <UserMinus className="h-4 w-4" />
                        Sair do grupo
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="gap-1.5"
                        disabled={groupActionId === gid}
                        onClick={() => void joinGroup(gid)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Entrar no grupo
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
