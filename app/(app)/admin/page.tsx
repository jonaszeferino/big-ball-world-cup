"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { AdminTeams } from "@/components/admin/admin-teams"
import { AdminMatches } from "@/components/admin/admin-matches"
import { AdminResults } from "@/components/admin/admin-results"
import { AdminOfficialResults } from "@/components/admin/admin-official-results"
import { PlayoffBrackets } from "@/components/playoff-brackets"

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/auth/login"); return }

      if (user.email !== "jonaszeferino@gmail.com") {
        router.push("/matches")
        return
      }
      setIsAdmin(true)
      setLoading(false)
    }
    checkAdmin()
  }, [router])

  if (loading || !isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie selecoes, partidas e resultados do bolao
        </p>
      </div>

      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">Selecoes</TabsTrigger>
          <TabsTrigger value="matches">Partidas</TabsTrigger>
          <TabsTrigger value="playoffs">Chaves Playoffs</TabsTrigger>
          <TabsTrigger value="official-results">Resultados Oficiais</TabsTrigger>
          <TabsTrigger value="results">Pontuacao</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="mt-4">
          <AdminTeams />
        </TabsContent>
        <TabsContent value="matches" className="mt-4">
          <AdminMatches />
        </TabsContent>
        <TabsContent value="playoffs" className="mt-4">
          <PlayoffBrackets />
        </TabsContent>
        <TabsContent value="official-results" className="mt-4">
          <AdminOfficialResults />
        </TabsContent>
        <TabsContent value="results" className="mt-4">
          <AdminResults />
        </TabsContent>
      </Tabs>
    </div>
  )
}
