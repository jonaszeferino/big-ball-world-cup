"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Megaphone, RotateCcw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClient } from "@/lib/supabase/client"
import { getUserSafe } from "@/lib/supabase/auth-session"
import { markBroadcastShown } from "@/lib/broadcast-toast-shown"
import { toast } from "sonner"

interface BroadcastRow {
  id: string
  match_id: string | null
  title: string
  message: string
  created_at: string
}

export function AdminBroadcastToasts() {
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rows, setRows] = useState<BroadcastRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/broadcast-toast")
      const data = (await res.json()) as { rows?: BroadcastRow[]; error?: string }
      if (!res.ok) {
        setError(data.error ?? "Falha ao carregar avisos")
        setRows([])
      } else {
        setRows(data.rows ?? [])
      }
    } catch {
      setError("Erro de rede ao carregar avisos")
      setRows([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    const sentTitle = title.trim()
    const sentMessage = message.trim()

    try {
      const res = await fetch("/api/broadcast-toast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: sentTitle, message: sentMessage }),
      })
      const data = (await res.json()) as { error?: string; ok?: boolean; id?: string }
      if (!res.ok) {
        setError(data.error ?? "Falha ao enviar")
        return
      }
      setTitle("")
      setMessage("")
      setSuccess("Aviso enviado — todos os utilizadores logados recebem o toast (fecham ao clicar no X).")
      if (data.id) {
        const supabase = createClient()
        const { user } = await getUserSafe(supabase)
        if (user) markBroadcastShown(user.id, data.id)
        toast.success(sentTitle, {
          id: `broadcast-${data.id}`,
          description: sentMessage,
          duration: Infinity,
          dismissible: true,
          closeButton: true,
        })
      }
      await load()
    } catch {
      setError("Erro de rede ao enviar o aviso")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-primary/25 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="h-5 w-5 text-primary" />
            Aviso para todos
          </CardTitle>
          <CardDescription>
            Envia um toast para <strong className="font-medium text-foreground">todos os utilizadores com sessão aberta</strong>.
            O aviso só desaparece quando cada pessoa fechar (X).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSend(e)} className="flex max-w-xl flex-col gap-4">
            {error && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {success && (
              <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
                {success}
              </p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="bc-title">Título</Label>
              <Input
                id="bc-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Intervalo — voltamos já!"
                maxLength={120}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bc-message">Mensagem</Label>
              <Textarea
                id="bc-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Texto que aparece no toast para todos..."
                rows={4}
                maxLength={800}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSubmitting || !title.trim() || !message.trim()} className="gap-2">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                Enviar para todos
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={isSubmitting}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Atualizar histórico
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Últimos avisos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aviso enviado ainda.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {rows.map((row) => (
                <li key={row.id} className="rounded-lg border border-border/80 bg-muted/20 px-3 py-2.5 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">{row.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.match_id ? "Placar" : "Manual"} ·{" "}
                      {format(new Date(row.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{row.message}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
