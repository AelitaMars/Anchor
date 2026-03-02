"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/lib/data-context"
import type { Service, PricingParameter } from "@/lib/types"
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
import { X, Save, DollarSign, Sliders, Clock, Package, ArrowLeftRight } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type SetPricingMode = "fixed" | "hourly" | "per_unit" | "range"

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { services, updateService } = useAppContext()
  const service = services.find((s) => s.id === id)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [billingOccurrence, setBillingOccurrence] = useState<Service["billingOccurrence"]>("monthly")
  const [pricingType, setPricingType] = useState<"set" | "dynamic">("set")
  const [setPricingMode, setSetPricingMode] = useState<SetPricingMode>("fixed")
  const [fixedPrice, setFixedPrice] = useState(0)
  const [priceRangeMin, setPriceRangeMin] = useState(0)
  const [priceRangeMax, setPriceRangeMax] = useState(0)
  const [discount, setDiscount] = useState<number>(0)
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent")
  const [billingTrigger, setBillingTrigger] = useState("Automatic, on proposal acceptance")
  const [parameters, setParameters] = useState<PricingParameter[]>([])

  useEffect(() => {
    if (service) {
      setName(service.name)
      setDescription(service.description || "")
      setBillingOccurrence(service.billingOccurrence)
      setPricingType(service.pricingType)
      setSetPricingMode(service.setPricingMode || "fixed")
      setFixedPrice(service.fixedPrice || 0)
      setPriceRangeMin(service.priceRangeMin || 0)
      setPriceRangeMax(service.priceRangeMax || 0)
      setDiscount(service.discount || 0)
      setDiscountType(service.discountType || "percent")
      setBillingTrigger(service.billingTrigger)
      setParameters(JSON.parse(JSON.stringify(service.parameters)))
    }
  }, [service])

  if (!service) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Service not found.</p>
      </div>
    )
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a service name")
      return
    }

    updateService({
      ...service,
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
      updatedAt: new Date().toISOString(),
    })

    toast.success("Service updated successfully")
    router.push("/dashboard/services")
  }

  const setPricingModes: { value: SetPricingMode; label: string; description: string; icon: React.ReactNode }[] = [
    { value: "fixed", label: "Fixed price", description: "One set amount", icon: <DollarSign className="h-4 w-4" /> },
    { value: "hourly", label: "Price per hour", description: "Time-based charge", icon: <Clock className="h-4 w-4" /> },
    { value: "per_unit", label: "Price per unit", description: "Per deliverable", icon: <Package className="h-4 w-4" /> },
    { value: "range", label: "Price range", description: "Min and max price", icon: <ArrowLeftRight className="h-4 w-4" /> },
  ]

  const priceLabel = setPricingMode === "hourly" ? "Hourly rate" : setPricingMode === "per_unit" ? "Unit price" : "Price"

  return (
    <div className="min-h-screen bg-[var(--anchor-bg)]">
      <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Edit Service</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSave} className="bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white">
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div>
              <Label className="text-xs text-[var(--anchor-purple)] font-medium">Service name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 border-[var(--anchor-purple)]/30 focus-visible:ring-[var(--anchor-purple)]" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground font-medium">Service description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 min-h-[120px]" />
            </div>

            {/* Pricing type selector */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Pricing</CardTitle>
                <p className="text-xs text-muted-foreground">Choose how you want to price this service</p>
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
                    <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg", pricingType === "set" ? "bg-[var(--anchor-purple)] text-white" : "bg-muted text-muted-foreground")}>
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <span className={cn("text-sm font-semibold", pricingType === "set" ? "text-[var(--anchor-purple)]" : "text-foreground")}>Set Pricing</span>
                    <span className="text-xs text-muted-foreground leading-relaxed">Define a specific price point for this service</span>
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
                    <div className={cn("flex items-center justify-center h-8 w-8 rounded-lg", pricingType === "dynamic" ? "bg-[var(--anchor-purple)] text-white" : "bg-muted text-muted-foreground")}>
                      <Sliders className="h-4 w-4" />
                    </div>
                    <span className={cn("text-sm font-semibold", pricingType === "dynamic" ? "text-[var(--anchor-purple)]" : "text-foreground")}>Dynamic Pricing</span>
                    <span className="text-xs text-muted-foreground leading-relaxed">Build flexible pricing based on parameters and tiers</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Set pricing sub-options (separate card) */}
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
                        <div className={cn("flex items-center justify-center h-8 w-8 rounded-md shrink-0", setPricingMode === mode.value ? "bg-[var(--anchor-purple)]/10 text-[var(--anchor-purple)]" : "bg-muted text-muted-foreground")}>
                          {mode.icon}
                        </div>
                        <div>
                          <span className={cn("text-sm font-medium block", setPricingMode === mode.value ? "text-[var(--anchor-purple)]" : "text-foreground")}>{mode.label}</span>
                          <span className="text-xs text-muted-foreground">{mode.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {setPricingMode === "range" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Minimum</Label>
                        <div className="flex items-center mt-1"><span className="text-sm text-muted-foreground mr-1.5 font-medium">$</span><Input type="number" value={priceRangeMin || ""} onChange={(e) => setPriceRangeMin(parseFloat(e.target.value) || 0)} placeholder="0" /></div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Maximum</Label>
                        <div className="flex items-center mt-1"><span className="text-sm text-muted-foreground mr-1.5 font-medium">$</span><Input type="number" value={priceRangeMax || ""} onChange={(e) => setPriceRangeMax(parseFloat(e.target.value) || 0)} placeholder="0" /></div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">{priceLabel}</Label>
                        <div className="flex items-center mt-1"><span className="text-sm text-muted-foreground mr-1.5 font-medium">$</span><Input type="number" value={fixedPrice || ""} onChange={(e) => setFixedPrice(parseFloat(e.target.value) || 0)} placeholder="0" /></div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Discount</Label>
                        <div className="flex items-center gap-1 mt-1">
                          <Input type="number" value={discount || ""} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} placeholder="0" />
                          <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percent" | "amount")}><SelectTrigger className="w-16"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percent">%</SelectItem><SelectItem value="amount">$</SelectItem></SelectContent></Select>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {pricingType === "dynamic" && (
              <Card>
                <CardHeader className="pb-3">
                  <div>
                    <CardTitle className="text-base">Pricing Parameters</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Add a base parameter and optional modifiers</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <PricingParameterBuilder parameters={parameters} onChange={setParameters} />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Billing occurrence</Label>
                  <Select value={billingOccurrence} onValueChange={(v) => setBillingOccurrence(v as Service["billingOccurrence"])}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Billing trigger</Label>
                  <Select value={billingTrigger} onValueChange={setBillingTrigger}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Automatic, on proposal acceptance">Automatic, on proposal acceptance</SelectItem>
                      <SelectItem value="Manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
