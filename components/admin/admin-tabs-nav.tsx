"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ADMIN_TAB_ITEMS, type AdminTabValue } from "@/components/admin/admin-tab-items"

interface AdminTabsNavProps {
  value: AdminTabValue
  onValueChange: (value: AdminTabValue) => void
}

export function AdminTabsNav({ value, onValueChange }: AdminTabsNavProps) {
  return (
    <div className="space-y-3">
      <div className="sm:hidden">
        <Label htmlFor="admin-section" className="mb-1.5 block text-xs text-muted-foreground">
          Secção do painel
        </Label>
        <Select value={value} onValueChange={(v) => onValueChange(v as AdminTabValue)}>
          <SelectTrigger id="admin-section" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ADMIN_TAB_ITEMS.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TabsList className="hidden h-auto w-full grid-cols-2 gap-1 rounded-xl p-1 sm:grid sm:grid-cols-4 lg:grid-cols-4">
        {ADMIN_TAB_ITEMS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-lg px-2 py-2.5 text-[11px] leading-tight sm:text-xs md:text-sm"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  )
}
