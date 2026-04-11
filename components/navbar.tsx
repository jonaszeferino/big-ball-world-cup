"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Trophy, BarChart3, Gamepad2, Shield, LogOut, BookOpen } from "lucide-react"
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
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("id, display_name, is_admin")
          .eq("id", user.id)
          .single()
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
    { href: "/rules", label: "Regras", icon: BookOpen },
  ] as const

  const adminLinks = profile?.is_admin
    ? ([{ href: "/admin", label: "Admin", icon: Shield }] as const)
    : []

  const allLinks = [...navLinks, ...adminLinks]

  const linkActive = (href: string) => {
    if (href === "/matches") return pathname === "/matches" || pathname.startsWith("/matches/")
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/80 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-[52px] max-w-5xl items-center justify-between px-4 md:h-14 md:px-6">
          <Link
            href="/matches"
            className="flex items-center gap-2 text-foreground transition-opacity hover:opacity-70"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-[2px] shadow-sm">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-card">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
            </div>
            <span className="hidden font-semibold tracking-tight sm:inline">Copa 2026</span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {allLinks.map((link) => {
              const Icon = link.icon
              const active = linkActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-5 w-5", active && "scale-105")} />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {profile && (
              <span className="hidden max-w-[140px] truncate text-sm font-medium text-foreground md:inline">
                {profile.display_name}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Sair"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>
      </header>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex h-14 items-center justify-around border-t border-border bg-card/95 pb-safe backdrop-blur-md supports-[backdrop-filter]:bg-card/90 md:hidden"
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
                "flex min-w-[56px] flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className={cn("h-6 w-6", active && "scale-105")} />
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
