"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import { isAppAdminEmail } from "@/lib/app-admin"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Users, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { BetGroup } from "@/components/admin/admin-bet-groups"
import { GroupMembersAdmin, type ProfileOption } from "@/components/group-members-admin"

export default function GroupsPage() {
  const router = useRouter()
  const [accessOk, setAccessOk] = useState(false)
  const [rows, setRows] = useState<BetGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [allProfiles, setAllProfiles] = useState<ProfileOption[]>([])
  const [newName, setNewName] = useState("")
  const [newObs, setNewObs] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ user }, { data }] = await Promise.all([
      getUserSafe(supabase),
      supabase
        .from("bet_groups")
        .select("id, created_at, name, observations, is_deleted")
        .eq("is_deleted", false)
        .order("name", { ascending: true }),
    ])
    setUserId(user?.id ?? null)

    if (user && isAppAdminEmail(user.email)) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, display_name, email, bet_group_id")
        .order("display_name", { ascending: true })
      setAllProfiles((profileRows ?? []) as ProfileOption[])
    } else {
      setAllProfiles([])
    }

    setRows((data ?? []) as BetGroup[])
    setLoading(false)
  }, [])

  useEffect(() => {
    async function checkAccess() {
      const supabase = createClient()
      const { user } = await getUserSafe(supabase)
      if (!user) {
        router.push("/auth/login")
        return
      }
      if (!isAppAdminEmail(user.email)) {
        router.push("/matches")
        return
      }
      setAccessOk(true)
    }
    void checkAccess()
  }, [router])

  useEffect(() => {
    if (!accessOk) return
    void load()
  }, [accessOk, load])

  const groupNamesById = Object.fromEntries(rows.map((g) => [String(g.id), g.name]))

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

  if (!accessOk) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Grupos de apostas</h1>
        <p className="mt-1 text-sm text-foreground/80">
          Área reservada ao organizador: cria grupos, gere membros e consulta notas de cada bolão interno.
        </p>
      </div>

      <Card className="border-primary/25 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Cadastrar novo grupo</CardTitle>
          <CardDescription>Define o nome e, se quiseres, notas ou contacto para o grupo.</CardDescription>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="grp-obs">Notas (opcional)</Label>
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
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Grupos registados</h2>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <Card className="border-dashed border-border bg-muted/20">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Ainda não há grupos. Cria o primeiro acima.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((g) => {
              const gid = String(g.id)
              return (
                <Card key={gid} className="border-border/80 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
                      <Users className="h-5 w-5 shrink-0 text-primary" />
                      {g.name}
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
                  <CardContent className={g.observations ? "pt-0" : ""}>
                    <GroupMembersAdmin
                      groupId={gid}
                      groupName={g.name}
                      profiles={allProfiles}
                      groupNamesById={groupNamesById}
                      disabled={isSubmitting}
                      onChanged={load}
                    />
                  </CardContent>
                  <CardFooter className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <Link href={`/ranking?grupo=${gid}`}>
                        <BarChart3 className="h-4 w-4" />
                        Ranking do grupo
                      </Link>
                    </Button>
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
