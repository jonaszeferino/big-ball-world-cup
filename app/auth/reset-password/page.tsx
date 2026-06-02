"use client"

import React from "react"
import { createClient } from "@/lib/supabase/client"
import { getSessionSafe } from "@/lib/supabase/auth-session"
import { formatAuthError } from "@/lib/supabase/format-auth-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2, Trophy } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient()
        const { session } = await getSessionSafe(supabase)
        setHasSession(!!session)
      } catch {
        setHasSession(false)
      } finally {
        setCheckingSession(false)
      }
    }
    void checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }
    if (password !== repeatPassword) {
      setError("As senhas nao coincidem")
      return
    }

    setIsLoading(true)

    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Configuracao Supabase invalida")
      setIsLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      router.push("/matches")
    } catch (err: unknown) {
      setError(formatAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="h-8 w-8" />
            <span className="font-sans text-2xl font-bold">Copa 2026</span>
          </div>

          <Card className="w-full rounded-2xl border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-card-foreground">Nova senha</CardTitle>
              <CardDescription>Escolha uma nova senha para sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              {checkingSession ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Validando link...
                </div>
              ) : !hasSession ? (
                <div className="flex flex-col gap-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Link invalido ou expirado. Solicite um novo email de recuperacao.
                  </p>
                  <Link href="/auth/forgot-password" className="text-sm text-primary underline underline-offset-4">
                    Esqueci minha senha
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="password">Nova senha</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="repeat-password">Repetir nova senha</Label>
                      <Input
                        id="repeat-password"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Salvando..." : "Salvar nova senha"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
