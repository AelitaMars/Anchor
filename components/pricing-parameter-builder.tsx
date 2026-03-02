"use client"

import { useState } from "react"
import type { PricingParameter, PricingTier, PricingAdjustmentType } from "@/lib/types"
import { generateId } from "@/lib/pricing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, GripVertical, X, Layers, Sliders } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingParameterBuilderProps {
  parameters: PricingParameter[]
  onChange: (parameters: PricingParameter[]) => void
  readOnly?: boolean
}

export function PricingParameterBuilder({
  parameters,
  onChange,
  readOnly = false,
}: PricingParameterBuilderProps) {
  const addParameter = (kind: "base" | "additional") => {
    const newParam: PricingParameter = {
      id: generateId(),
      name: "",
      kind,
      adjustmentType: kind === "additional" ? "multiplier" : undefined,
      tiers: [
        {
          id: generateId(),
          label: "",
          value: kind === "base" ? 0 : kind === "additional" ? 1 : 0,
        },
      ],
    }
    onChange([...parameters, newParam])
  }

  const updateParameter = (id: string, updates: Partial<PricingParameter>) => {
    onChange(
      parameters.map((p) => {
        if (p.id !== id) return p
        const updated = { ...p, ...updates }
        if (updates.adjustmentType && updates.adjustmentType !== p.adjustmentType) {
          updated.tiers = updated.tiers.map((t) => ({
            ...t,
            value: updates.adjustmentType === "multiplier" ? 1 : 0,
          }))
        }
        return updated
      })
    )
  }

  const removeParameter = (id: string) => {
    onChange(parameters.filter((p) => p.id !== id))
  }

  const addTier = (paramId: string) => {
    onChange(
      parameters.map((p) => {
        if (p.id !== paramId) return p
        return {
          ...p,
          tiers: [
            ...p.tiers,
            {
              id: generateId(),
              label: "",
              value: p.kind === "additional" && p.adjustmentType === "multiplier" ? 1 : 0,
            },
          ],
        }
      })
    )
  }

  const updateTier = (paramId: string, tierId: string, updates: Partial<PricingTier>) => {
    onChange(
      parameters.map((p) => {
        if (p.id !== paramId) return p
        return {
          ...p,
          tiers: p.tiers.map((t) => (t.id === tierId ? { ...t, ...updates } : t)),
        }
      })
    )
  }

  const removeTier = (paramId: string, tierId: string) => {
    onChange(
      parameters.map((p) => {
        if (p.id !== paramId) return p
        return { ...p, tiers: p.tiers.filter((t) => t.id !== tierId) }
      })
    )
  }

  const selectTier = (paramId: string, tierId: string) => {
    onChange(
      parameters.map((p) => (p.id === paramId ? { ...p, selectedTierId: tierId } : p))
    )
  }

  const hasBase = parameters.some((p) => p.kind === "base")
  const baseParams = parameters.filter((p) => p.kind === "base")
  const additionalParams = parameters.filter((p) => p.kind === "additional")

  const renderTier = (param: PricingParameter, tier: PricingTier) => (
    <div
      key={tier.id}
      className={cn(
        "flex items-center gap-2 p-2.5 rounded-lg border transition-colors cursor-pointer",
        param.selectedTierId === tier.id
          ? param.kind === "base"
            ? "border-[var(--anchor-purple)] bg-[var(--anchor-purple)]/5"
            : "border-[var(--anchor-purple-light)] bg-[var(--anchor-purple-light)]/5"
          : "border-border hover:border-muted-foreground/30"
      )}
      onClick={() => !readOnly && selectTier(param.id, tier.id)}
    >
      {/* Radio indicator */}
      <div
        className={cn(
          "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
          param.selectedTierId === tier.id
            ? param.kind === "base"
              ? "border-[var(--anchor-purple)]"
              : "border-[var(--anchor-purple-light)]"
            : "border-muted-foreground/30"
        )}
      >
        {param.selectedTierId === tier.id && (
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              param.kind === "base" ? "bg-[var(--anchor-purple)]" : "bg-[var(--anchor-purple-light)]"
            )}
          />
        )}
      </div>

      <Input
        placeholder={
          param.kind === "base"
            ? "e.g., Up to 10 transactions"
            : "e.g., 2 locations"
        }
        value={tier.label}
        onChange={(e) => {
          e.stopPropagation()
          updateTier(param.id, tier.id, { label: e.target.value })
        }}
        onClick={(e) => e.stopPropagation()}
        readOnly={readOnly}
        className="flex-1 h-8 text-sm"
      />

      <div className="flex items-center gap-1 shrink-0">
        {param.kind === "base" && (
          <span className="text-xs text-muted-foreground font-medium">$</span>
        )}
        {param.kind === "additional" && param.adjustmentType === "multiplier" && (
          <span className="text-xs text-muted-foreground font-medium">x</span>
        )}
        {param.kind === "additional" && param.adjustmentType === "fixed_add" && (
          <span className="text-xs text-muted-foreground font-medium">+$</span>
        )}
        {param.kind === "additional" && param.adjustmentType === "fixed_subtract" && (
          <span className="text-xs text-muted-foreground font-medium">-$</span>
        )}
        <Input
          type="number"
          step={param.adjustmentType === "multiplier" ? "0.01" : "1"}
          value={tier.value}
          onChange={(e) => {
            e.stopPropagation()
            updateTier(param.id, tier.id, {
              value: parseFloat(e.target.value) || 0,
            })
          }}
          onClick={(e) => e.stopPropagation()}
          readOnly={readOnly}
          className="w-24 h-8 text-sm"
        />
      </div>

      {!readOnly && param.tiers.length > 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            removeTier(param.id, tier.id)
          }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )

  const renderParameterCard = (param: PricingParameter) => {
    const isBase = param.kind === "base"

    return (
      <div
        key={param.id}
        className={cn(
          "rounded-xl border-2 overflow-hidden",
          isBase
            ? "border-[var(--anchor-purple)]/40 bg-card"
            : "border-border bg-card"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3",
            isBase
              ? "bg-[var(--anchor-purple)]/[0.06]"
              : "bg-muted/40"
          )}
        >
          <div className="flex items-center gap-2.5">
            {!readOnly && (
              <GripVertical className="h-4 w-4 text-muted-foreground/40" />
            )}
            <div
              className={cn(
                "flex items-center justify-center h-6 w-6 rounded-md",
                isBase
                  ? "bg-[var(--anchor-purple)] text-white"
                  : "bg-muted-foreground/10 text-muted-foreground"
              )}
            >
              {isBase ? (
                <Layers className="h-3.5 w-3.5" />
              ) : (
                <Sliders className="h-3.5 w-3.5" />
              )}
            </div>
            <div>
              <span
                className={cn(
                  "text-sm font-semibold",
                  isBase ? "text-[var(--anchor-purple)]" : "text-foreground"
                )}
              >
                {isBase ? "Base Parameter" : "Additional Parameter"}
              </span>
              {isBase && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--anchor-purple)] text-white font-medium uppercase tracking-wider">
                  Primary
                </span>
              )}
            </div>
          </div>
          {!readOnly && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => removeParameter(param.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-4 space-y-4">
          {/* Parameter name & type */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Parameter Name</Label>
              <Input
                placeholder={
                  isBase
                    ? "e.g., Transaction Volume"
                    : "e.g., Number of Locations"
                }
                value={param.name}
                onChange={(e) => updateParameter(param.id, { name: e.target.value })}
                readOnly={readOnly}
                className={cn(
                  "mt-1",
                  isBase && "border-[var(--anchor-purple)]/20 focus-visible:ring-[var(--anchor-purple)]"
                )}
              />
            </div>
            {!isBase && (
              <div className="w-48">
                <Label className="text-xs text-muted-foreground">Adjustment Type</Label>
                <Select
                  value={param.adjustmentType || "multiplier"}
                  onValueChange={(v) =>
                    updateParameter(param.id, {
                      adjustmentType: v as PricingAdjustmentType,
                    })
                  }
                  disabled={readOnly}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiplier">Multiplier (Nx)</SelectItem>
                    <SelectItem value="fixed_add">Add (+$)</SelectItem>
                    <SelectItem value="fixed_subtract">Subtract (-$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs text-muted-foreground">Description (optional)</Label>
            <Input
              placeholder="Describe this parameter..."
              value={param.description || ""}
              onChange={(e) => updateParameter(param.id, { description: e.target.value })}
              readOnly={readOnly}
              className="mt-1"
            />
          </div>

          {/* Tiers */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Pricing Tiers
            </Label>
            <div className="space-y-2">
              {param.tiers.map((tier) => renderTier(param, tier))}
            </div>

            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "mt-2",
                  isBase
                    ? "text-[var(--anchor-purple)] hover:text-[var(--anchor-purple-dark)] hover:bg-[var(--anchor-purple)]/5"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => addTier(param.id)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add tier
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Base parameters section */}
      {baseParams.length > 0 && (
        <div className="space-y-3">
          {baseParams.map(renderParameterCard)}
        </div>
      )}

      {/* Divider between base and additional */}
      {baseParams.length > 0 && additionalParams.length > 0 && (
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Modifiers
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}

      {/* Additional parameters section */}
      {additionalParams.length > 0 && (
        <div className="space-y-3">
          {additionalParams.map(renderParameterCard)}
        </div>
      )}

      {/* Add parameter buttons */}
      {!readOnly && (
        <div className="flex gap-3">
          {!hasBase && (
            <Button
              variant="outline"
              className="flex-1 border-dashed border-[var(--anchor-purple)]/40 text-[var(--anchor-purple)] hover:bg-[var(--anchor-purple)]/5 hover:text-[var(--anchor-purple-dark)]"
              onClick={() => addParameter("base")}
            >
              <Layers className="h-4 w-4 mr-2" />
              Add Base Parameter
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1 border-dashed text-muted-foreground hover:text-foreground"
            onClick={() => addParameter("additional")}
          >
            <Sliders className="h-4 w-4 mr-2" />
            Add Additional Parameter
          </Button>
        </div>
      )}
    </div>
  )
}
