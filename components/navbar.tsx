"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import { Button } from "@/components/ui/button"
import { Trophy, BarChart3, Gamepad2, Shield, LogOut, BookOpen, Users, Target } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface Profile {
  id: string
  display_name: string
  is_admin: boolean
}

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const supabase = createClient()
    async function loadProfile() {
      const { user } = await getUserSafe(supabase)
      if (user) {
        const { data } = await supabase.from("profiles").select("id, display_name, is_admin").eq("id", user.id).single()
        if (data) setProfile(data)
      }
    }
    loadProfile()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const navLinks = [
    { href: "/matches", label: "Partidas", icon: Gamepad2 },
    { href: "/ranking", label: "Ranking", icon: BarChart3 },
    { href: "/scorers", label: "Artilheiros", icon: Target },
    { href: "/groups", label: "Grupos", icon: Users },
    { href: "/rules", label: "Regras", icon: BookOpen },
  ] as const

  const adminLinks = profile?.is_admin ? ([{ href: "/admin", label: "Admin", icon: Shield }] as const) : []

  const allLinks = [...navLinks, ...adminLinks]

  const linkActive = (href: string) => {
    if (href === "/matches") return pathname === "/matches" || pathname.startsWith("/matches/")
    return pathname.startsWith(href)
  }

  const userInitial = profile?.display_name?.trim().charAt(0).toUpperCase() ?? "?"

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 shadow-[0_1px_0_0_hsl(var(--border)/0.35),0_8px_40px_-12px_rgba(15,23,42,0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/55 dark:shadow-[0_8px_40px_-12px_rgba(0,0,0,0.45)]">
        <div className="mx-auto flex h-[3.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:h-14 sm:px-6">
          <Link
            href="/matches"
            className="group flex shrink-0 items-center gap-2.5 rounded-2xl py-1.5 pl-1 pr-2 transition-colors hover:bg-muted/60"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-px shadow-md shadow-primary/10 ring-1 ring-white/20">
              <div className="flex h-full w-full items-center justify-center rounded-[0.9rem] bg-card">
                <Trophy className="h-[1.15rem] w-[1.15rem] text-primary transition-transform group-hover:scale-105" />
              </div>
            </div>
            <div className="hidden flex-col leading-none sm:flex">
              <span className="text-sm font-semibold tracking-tight text-foreground">Copa 2026</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Bolão</span>
            </div>
          </Link>

          <nav
            className="hidden min-w-0 flex-1 justify-center md:flex"
            aria-label="Navegação principal"
          >
            <div className="inline-flex max-w-full items-center gap-0.5 rounded-full border border-border/50 bg-muted/35 p-1 shadow-inner backdrop-blur-sm">
              {allLinks.map((link) => {
                const Icon = link.icon
                const active = linkActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-background text-primary shadow-sm ring-1 ring-border/60"
                        : "text-muted-foreground hover:bg-background/55 hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("h-[1.125rem] w-[1.125rem] shrink-0", active && "text-primary")} />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {profile && (
              <div className="hidden items-center gap-2 rounded-full border border-border/50 bg-muted/30 py-1 pl-1 pr-1 shadow-sm backdrop-blur-sm md:flex">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/5 text-xs font-semibold tabular-nums text-primary ring-1 ring-primary/15"
                  title={profile.display_name}
                  aria-hidden
                >
                  {userInitial}
                </div>
                <span className="max-w-[7.5rem] truncate text-sm font-medium text-foreground">{profile.display_name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
                  aria-label="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className={cn(
                "h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                profile && "md:hidden",
              )}
              aria-label="Sair"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>
      </header>

      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden"
        aria-hidden={false}
      >
        <nav
          className="pointer-events-auto flex h-[3.25rem] w-full max-w-md items-stretch justify-between gap-0.5 rounded-2xl border border-border/45 bg-card/85 px-1.5 py-1 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl supports-[backdrop-filter]:bg-card/75"
          aria-label="Navegação principal"
        >
          {allLinks.map((link) => {
            const Icon = link.icon
            const active = linkActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[9px] font-semibold leading-tight tracking-tight transition-all duration-200",
                  active ? "text-primary" : "text-muted-foreground active:scale-95",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                    active ? "bg-primary/12 text-primary" : "text-current",
                  )}
                >
                  <Icon className={cn("h-[1.15rem] w-[1.15rem]", active && "scale-105")} />
                </span>
                <span className="line-clamp-1 w-full px-px text-center">{link.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </>
  )
}
//teste
