"use client"

import React from "react"
import { createClient } from "@/lib/supabase/client"
import { formatAuthError } from "@/lib/supabase/format-auth-error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Mail, Trophy } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    let supabase: ReturnType<typeof createClient>
    try {
      supabase = createClient()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Configuracao Supabase invalida")
      setIsLoading(false)
      return
    }

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      if (resetError) throw resetError
      setSent(true)
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

          {sent ? (
            <Card className="w-full rounded-2xl border-border/80 text-center shadow-sm">
              <CardHeader>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl text-card-foreground">Verifique seu email</CardTitle>
                <CardDescription>
                  Se existir uma conta com <strong className="font-medium text-foreground">{email}</strong>, enviamos um
                  link para redefinir sua senha.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/auth/login" className="text-sm text-primary underline underline-offset-4">
                  Voltar para o login
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full rounded-2xl border-border/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-card-foreground">Esqueci minha senha</CardTitle>
                <CardDescription>Digite seu email e enviaremos um link para criar uma nova senha</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Enviando..." : "Enviar link de recuperacao"}
                    </Button>
                  </div>
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <Link href="/auth/login" className="text-primary underline underline-offset-4">
                      Voltar para o login
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
