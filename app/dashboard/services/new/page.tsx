"use client"

import { Suspense, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/lib/data-context"
import type { Service, PricingParameter } from "@/lib/types"
import { generateId } from "@/lib/pricing"
import { PricingParameterBuilder } from "@/components/pricing-parameter-builder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { X, Save, BookmarkPlus, FolderOpen, DollarSign, Sliders, Clock, Package, ArrowLeftRight } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type SetPricingMode = "fixed" | "hourly" | "per_unit" | "range"

function NewServicePageInner() {
  const router = useRouter()
  const { addService, pricingTemplates, addPricingTemplate } = useAppContext()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [billingOccurrence, setBillingOccurrence] = useState<Service["billingOccurrence"]>("monthly")
  const [pricingType, setPricingType] = useState<"set" | "dynamic" | null>(null)
  const [setPricingMode, setSetPricingMode] = useState<SetPricingMode>("fixed")
  const [fixedPrice, setFixedPrice] = useState(0)
  const [priceRangeMin, setPriceRangeMin] = useState(0)
  const [priceRangeMax, setPriceRangeMax] = useState(0)
  const [discount, setDiscount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent")
  const [billingTrigger, setBillingTrigger] = useState("Automatic, on proposal acceptance")
  const [parameters, setParameters] = useState<PricingParameter[]>([])

  // Template save dialog
  const [templateName, setTemplateName] = useState("")
  const [templateDesc, setTemplateDesc] = useState("")
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [showLoadTemplate, setShowLoadTemplate] = useState(false)

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a service name")
      return
    }
    if (!pricingType) {
      toast.error("Please select a pricing type")
      return
    }

    const service: Service = {
      id: generateId(),
      name: name.trim(),
      description: description.trim(),
      billingOccurrence,
      pricingType,
      setPricingMode: pricingType === "set" ? setPricingMode : undefined,
      fixedPrice: pricingType === "set" ? fixedPrice : undefined,
      priceRangeMin: pricingType === "set" && setPricingMode === "range" ? priceRangeMin : undefined,
      priceRangeMax: pricingType === "set" && setPricingMode === "range" ? priceRangeMax : undefined,
      parameters: pricingType === "dynamic" ? parameters : [],
      discount: discount || undefined,
      discountType,
      billingTrigger,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const returnTo =
      typeof window !== "undefined"
        ? new URL(window.location.href).searchParams.get("returnTo")
        : null

    setSaving(true)
    try {
      await addService(service)
      toast.success("Service created successfully")
      if (returnTo) {
        router.push(`${returnTo}?addService=${service.id}`)
      } else {
        router.push("/dashboard/services")
      }
    } catch {
      toast.error("Failed to save service")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name")
      return
    }
    try {
      await addPricingTemplate({
        id: generateId(),
        name: templateName.trim(),
        description: templateDesc.trim(),
        parameters: JSON.parse(JSON.stringify(parameters)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      toast.success("Pricing template saved")
    } catch {
      toast.error("Failed to save template")
    }
    setShowSaveTemplate(false)
    setTemplateName("")
    setTemplateDesc("")
  }

  const handleLoadTemplate = (templateId: string) => {
    const tmpl = pricingTemplates.find((t) => t.id === templateId)
    if (tmpl) {
      const cloned: PricingParameter[] = JSON.parse(JSON.stringify(tmpl.parameters))
      cloned.forEach((p) => {
        p.id = generateId()
        p.tiers.forEach((t) => {
          t.id = generateId()
        })
      })
      setParameters(cloned)
      setPricingType("dynamic")
      toast.success(`Loaded template: ${tmpl.name}`)
    }
    setShowLoadTemplate(false)
  }

  const setPricingModes: { value: SetPricingMode; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: "fixed",
      label: "Fixed price",
      description: "One set amount for the service",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      value: "hourly",
      label: "Price per hour",
      description: "Charge based on time spent",
      icon: <Clock className="h-4 w-4" />,
    },
    {
      value: "per_unit",
      label: "Price per unit",
      description: "Charge per deliverable or item",
      icon: <Package className="h-4 w-4" />,
    },
    {
      value: "range",
      label: "Price range",
      description: "Set a minimum and maximum price",
      icon: <ArrowLeftRight className="h-4 w-4" />,
    },
  ]

  const priceLabel =
    setPricingMode === "hourly" ? "Hourly rate" : setPricingMode === "per_unit" ? "Unit price" : "Price"

  return (
    <div className="min-h-screen bg-[var(--anchor-bg)]">
      {/* Top bar */}
      <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Create Service</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column - Service details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Service name */}
            <div>
              <Label className="text-xs text-[var(--anchor-purple)] font-medium">Service name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter service name"
                className="mt-1 border-[var(--anchor-purple)]/30 focus-visible:ring-[var(--anchor-purple)]"
              />
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Service description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe service (Optional)"
                className="mt-1 min-h-[120px]"
              />
            </div>

            {/* ===== Pricing Type Selector (own container) ===== */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Pricing</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Choose how you want to price this service
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPricingType("set")}
                    className={cn(
                      "flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all",
                      pricingType === "set"
                        ? "border-[var(--anchor-purple)] bg-[var(--anchor-purple)]/[0.04]"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-lg",
                        pricingType === "set"
                          ? "bg-[var(--anchor-purple)] text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        pricingType === "set" ? "text-[var(--anchor-purple)]" : "text-foreground"
                      )}
                    >
                      Set Pricing
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      Define a specific price point for this service
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPricingType("dynamic")}
                    className={cn(
                      "flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all",
                      pricingType === "dynamic"
                        ? "border-[var(--anchor-purple)] bg-[var(--anchor-purple)]/[0.04]"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-lg",
                        pricingType === "dynamic"
                          ? "bg-[var(--anchor-purple)] text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Sliders className="h-4 w-4" />
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        pricingType === "dynamic" ? "text-[var(--anchor-purple)]" : "text-foreground"
                      )}
                    >
                      Dynamic Pricing
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      Build flexible pricing based on parameters and tiers
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* ===== Set Pricing sub-options (shown only when "set" selected) ===== */}
            {pricingType === "set" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Set Pricing Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {setPricingModes.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setSetPricingMode(mode.value)}
                        className={cn(
                          "flex items-center gap-2.5 p-3 rounded-lg border text-left transition-all",
                          setPricingMode === mode.value
                            ? "border-[var(--anchor-purple)]/60 bg-[var(--anchor-purple)]/[0.04]"
                            : "border-border hover:border-muted-foreground/20"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center h-8 w-8 rounded-md shrink-0",
                            setPricingMode === mode.value
                              ? "bg-[var(--anchor-purple)]/10 text-[var(--anchor-purple)]"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {mode.icon}
                        </div>
                        <div>
                          <span
                            className={cn(
                              "text-sm font-medium block",
                              setPricingMode === mode.value
                                ? "text-[var(--anchor-purple)]"
                                : "text-foreground"
                            )}
                          >
                            {mode.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {mode.description}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Price inputs */}
                  {setPricingMode === "range" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Minimum</Label>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-muted-foreground mr-1.5 font-medium">$</span>
                          <Input
                            type="number"
                            value={priceRangeMin || ""}
                            onChange={(e) => setPriceRangeMin(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Maximum</Label>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-muted-foreground mr-1.5 font-medium">$</span>
                          <Input
                            type="number"
                            value={priceRangeMax || ""}
                            onChange={(e) => setPriceRangeMax(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">{priceLabel}</Label>
                        <div className="flex items-center mt-1">
                          <span className="text-sm text-muted-foreground mr-1.5 font-medium">$</span>
                          <Input
                            type="number"
                            value={fixedPrice || ""}
                            onChange={(e) => setFixedPrice(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Discount</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Input
                            type="number"
                            value={discount || ""}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                          <Select
                            value={discountType}
                            onValueChange={(v) => setDiscountType(v as "percent" | "amount")}
                          >
                            <SelectTrigger className="w-16">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">%</SelectItem>
                              <SelectItem value="amount">$</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Dynamic pricing builder section */}
            {pricingType === "dynamic" && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Pricing Parameters</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Add a base parameter and optional modifiers to build your pricing structure
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {/* Load template */}
                      <Dialog open={showLoadTemplate} onOpenChange={setShowLoadTemplate}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            disabled={pricingTemplates.length === 0}
                          >
                            <FolderOpen className="h-3.5 w-3.5" />
                            Load Template
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Load Pricing Template</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2 max-h-[400px] overflow-auto">
                            {pricingTemplates.map((tmpl) => (
                              <button
                                key={tmpl.id}
                                onClick={() => handleLoadTemplate(tmpl.id)}
                                className="w-full text-left p-3 rounded-lg border border-border hover:border-[var(--anchor-purple)]/30 hover:bg-[var(--anchor-purple)]/5 transition-colors"
                              >
                                <p className="text-sm font-medium text-foreground">{tmpl.name}</p>
                                {tmpl.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {tmpl.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {tmpl.parameters.length} parameter
                                  {tmpl.parameters.length !== 1 ? "s" : ""}
                                </p>
                              </button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Save as template */}
                      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs"
                            disabled={parameters.length === 0}
                          >
                            <BookmarkPlus className="h-3.5 w-3.5" />
                            Save as Template
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Save Pricing Template</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Template Name</Label>
                              <Input
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="e.g., Standard Bookkeeping"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label>Description (optional)</Label>
                              <Input
                                value={templateDesc}
                                onChange={(e) => setTemplateDesc(e.target.value)}
                                placeholder="Brief description"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                              onClick={handleSaveTemplate}
                              className="bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white"
                            >
                              Save Template
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <PricingParameterBuilder
                    parameters={parameters}
                    onChange={setParameters}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right column - Billing settings */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Billing occurrence */}
                <div>
                  <Label className="text-xs text-muted-foreground">Billing occurrence</Label>
                  <Select
                    value={billingOccurrence}
                    onValueChange={(v) => setBillingOccurrence(v as Service["billingOccurrence"])}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Billing trigger */}
                <div>
                  <Label className="text-xs text-muted-foreground">Billing trigger</Label>
                  <Select value={billingTrigger} onValueChange={setBillingTrigger}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Automatic, on proposal acceptance">
                        Automatic, on proposal acceptance
                      </SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom save bar */}
      <div className="sticky bottom-0 border-t border-border bg-card px-6 py-3 flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          className="bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  )
}
export default function NewServicePage() {
  return (
    <Suspense fallback={null}>
      <NewServicePageInner />
    </Suspense>
  )
}
