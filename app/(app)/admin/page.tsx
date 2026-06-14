"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import { isAppAdminEmail } from "@/lib/app-admin"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { AdminTeams } from "@/components/admin/admin-teams"
import { AdminMatches } from "@/components/admin/admin-matches"
import { AdminOfficialResults } from "@/components/admin/admin-official-results"
import { AdminBetGroups } from "@/components/admin/admin-bet-groups"
import { AdminUpcomingBetsMatrix } from "@/components/admin/admin-upcoming-bets-matrix"
import { AdminBroadcastToasts } from "@/components/admin/admin-broadcast-toasts"
import { AdminOddsSync } from "@/components/admin/admin-odds-sync"
import { AdminTabsNav } from "@/components/admin/admin-tabs-nav"
import type { AdminTabValue } from "@/components/admin/admin-tab-items"
import { PlayoffBrackets } from "@/components/playoff-brackets"

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<AdminTabValue>("teams")
  const router = useRouter()

  useEffect(() => {
    async function checkAdmin() {
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
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Painel Admin</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seleções, partidas, grupos de apostas e resultados do bolão
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as AdminTabValue)} className="min-w-0">
        <AdminTabsNav value={tab} onValueChange={setTab} />

        <TabsContent value="teams" className="mt-4 min-w-0">
          <AdminTeams />
        </TabsContent>
        <TabsContent value="matches" className="mt-4 min-w-0">
          <AdminMatches />
        </TabsContent>
        <TabsContent value="bet-groups" className="mt-4 min-w-0">
          <AdminBetGroups />
        </TabsContent>
        <TabsContent value="playoffs" className="mt-4 min-w-0 overflow-x-auto">
          <PlayoffBrackets />
        </TabsContent>
        <TabsContent value="official-results" className="mt-4 min-w-0">
          <AdminOfficialResults />
        </TabsContent>
        <TabsContent value="broadcasts" className="mt-4 min-w-0">
          <AdminBroadcastToasts />
        </TabsContent>
        <TabsContent value="odds" className="mt-4 min-w-0">
          <AdminOddsSync />
        </TabsContent>
        <TabsContent value="upcoming-bets" className="mt-4 min-w-0">
          <AdminUpcomingBetsMatrix />
        </TabsContent>
      </Tabs>
    </div>
  )
}
