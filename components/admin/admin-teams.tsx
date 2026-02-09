"use client"

import React from "react"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"

interface Team {
  id: string
  name: string
  code: string
  group_name: string | null
}

interface TeamDraft {
  name: string
  code: string
}

const GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"]

export function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([])
  const [batchGroup, setBatchGroup] = useState("")
  const [batchTeams, setBatchTeams] = useState<TeamDraft[]>([
    { name: "", code: "" },
    { name: "", code: "" },
    { name: "", code: "" },
    { name: "", code: "" },
  ])
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [groupName, setGroupName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadTeams = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("teams")
      .select("id, name, code, group_name")
      .order("group_name", { ascending: true })
      .order("name", { ascending: true })
    if (data) setTeams(data)
  }, [])

  useEffect(() => { loadTeams() }, [loadTeams])

  const updateBatchTeam = (index: number, field: keyof TeamDraft, value: string) => {
    setBatchTeams((prev) =>
      prev.map((team, i) => (i === index ? { ...team, [field]: value } : team))
    )
  }

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!batchGroup) {
      setError("Selecione o grupo")
      setIsSubmitting(false)
      return
    }

    const cleanTeams = batchTeams
      .map((t) => ({ name: t.name.trim(), code: t.code.trim().toUpperCase() }))
      .filter((t) => t.name && t.code)

    if (cleanTeams.length !== 4) {
      setError("Informe 4 selecoes com nome e codigo")
      setIsSubmitting(false)
      return
    }

    const codeSet = new Set(cleanTeams.map((t) => t.code))
    if (codeSet.size !== cleanTeams.length) {
      setError("Codigos repetidos no grupo")
      setIsSubmitting(false)
      return
    }

    const supabase = createClient()
    const { error: insertErr } = await supabase.from("teams").insert(
      cleanTeams.map((t) => ({
        name: t.name,
        code: t.code,
        group_name: batchGroup,
      }))
    )

    if (insertErr) {
      setError(insertErr.message)
    } else {
      setBatchGroup("")
      setBatchTeams([
        { name: "", code: "" },
        { name: "", code: "" },
        { name: "", code: "" },
        { name: "", code: "" },
      ])
      loadTeams()
    }
    setIsSubmitting(false)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    const supabase = createClient()

    const { error: insertErr } = await supabase.from("teams").insert({
      name,
      code: code.toUpperCase(),
      group_name: groupName || null,
    })

    if (insertErr) {
      setError(insertErr.message)
    } else {
      setName("")
      setCode("")
      setGroupName("")
      loadTeams()
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from("teams").delete().eq("id", id)
    loadTeams()
  }

  const groupedTeams = teams.reduce<Record<string, Team[]>>((acc, team) => {
    const key = team.group_name || "Sem Grupo"
    if (!acc[key]) acc[key] = []
    acc[key].push(team)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">Adicionar Grupo (4 selecoes)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddGroup} className="flex flex-col gap-4">
            <div className="grid gap-2 sm:w-60">
              <Label>Grupo</Label>
              <Select value={batchGroup} onValueChange={setBatchGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  {GROUPS.map((g) => (
                    <SelectItem key={g} value={g}>Grupo {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              {batchTeams.map((team, index) => (
                <div key={index} className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Selecao {index + 1}</Label>
                    <Input
                      placeholder="Brasil"
                      value={team.name}
                      onChange={(e) => updateBatchTeam(index, "name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Codigo (3 letras)</Label>
                    <Input
                      placeholder="BRA"
                      maxLength={3}
                      value={team.code}
                      onChange={(e) => updateBatchTeam(index, "code", e.target.value)}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-fit">
              <Plus className="mr-1 h-4 w-4" />
              {isSubmitting ? "Adicionando..." : "Adicionar Grupo"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">Adicionar Selecao</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="team-name">Nome</Label>
                <Input
                  id="team-name"
                  placeholder="Brasil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="team-code">Codigo (3 letras)</Label>
                <Input
                  id="team-code"
                  placeholder="BRA"
                  maxLength={3}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Grupo</Label>
                <Select value={groupName} onValueChange={setGroupName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {GROUPS.map((g) => (
                      <SelectItem key={g} value={g}>Grupo {g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isSubmitting} className="w-fit">
              <Plus className="mr-1 h-4 w-4" />
              {isSubmitting ? "Adicionando..." : "Adicionar Selecao"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {Object.entries(groupedTeams)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([group, groupTeams]) => (
            <Card key={group}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium text-card-foreground">
                  {group === "Sem Grupo" ? group : `Grupo ${group}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {groupTeams.map((team) => (
                    <Badge
                      key={team.id}
                      variant="secondary"
                      className="flex items-center gap-2 px-3 py-1.5 text-sm"
                    >
                      <span className="font-bold text-secondary-foreground">{team.code}</span>
                      <span className="text-secondary-foreground">{team.name}</span>
                      <button
                        onClick={() => handleDelete(team.id)}
                        className="ml-1 rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remover ${team.name}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
