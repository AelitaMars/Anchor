"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppContext } from "@/lib/data-context"
import type { Proposal, ProposalService, PricingParameter } from "@/lib/types"
import { generateId, calculateDynamicPrice, formatCurrency } from "@/lib/pricing"
import { PricingParameterBuilder } from "@/components/pricing-parameter-builder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  DialogDescription,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  X,
  Send,
  Eye,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Star,
  CreditCard,
  Calendar,
  UserPlus,
  User,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

/* ------------------------------------------------------------------ */
/* Collapsible Section                                                 */
/* ------------------------------------------------------------------ */
function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string
  icon: React.ElementType
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4.5 w-4.5 text-[var(--anchor-purple)]" />
          <span className="text-[15px] font-semibold text-foreground">{title}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <CardContent className="pt-0 pb-5 px-6 border-t border-border">
          {children}
        </CardContent>
      )}
    </Card>
  )
}

const DRAFT_KEY = "anchor_proposal_draft"

/* ------------------------------------------------------------------ */
/* Main Form                                                           */
/* ------------------------------------------------------------------ */
function ProposalCreationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { services, clients, addClient, addProposal, sendProposal, serviceToProposalService } =
    useAppContext()

  // Agreement details
  const [name, setName] = useState("Untitled agreement")
  const [clientId, setClientId] = useState("")
  const [showNewClient, setShowNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [newClientCompany, setNewClientCompany] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")
  const [effectiveDate, setEffectiveDate] = useState("on_acceptance")
  const [introMessage, setIntroMessage] = useState("none")
  const [setExpiration, setSetExpiration] = useState(false)

  // Payment settings
  const [paymentDueDays, setPaymentDueDays] = useState("upon_receipt")
  const [processingFeePayer, setProcessingFeePayer] = useState("provider")
  const [allowApproveWithoutPayment, setAllowApproveWithoutPayment] = useState(false)
  const [allowManualApproval, setAllowManualApproval] = useState(false)

  // Agreement term
  const [agreementTerm, setAgreementTerm] = useState("ongoing")
  const [termEndDate, setTermEndDate] = useState("")

  // Services
  const [proposalServices, setProposalServices] = useState<ProposalService[]>([])
  const [showAddService, setShowAddService] = useState(false)
  const [expandedService, setExpandedService] = useState<string | null>(null)

  // Restore draft from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        if (d.name !== undefined) setName(d.name)
        if (d.clientId !== undefined) setClientId(d.clientId)
        if (d.effectiveDate !== undefined) setEffectiveDate(d.effectiveDate)
        if (d.introMessage !== undefined) setIntroMessage(d.introMessage)
        if (d.setExpiration !== undefined) setSetExpiration(d.setExpiration)
        if (d.paymentDueDays !== undefined) setPaymentDueDays(d.paymentDueDays)
        if (d.processingFeePayer !== undefined) setProcessingFeePayer(d.processingFeePayer)
        if (d.allowApproveWithoutPayment !== undefined) setAllowApproveWithoutPayment(d.allowApproveWithoutPayment)
        if (d.allowManualApproval !== undefined) setAllowManualApproval(d.allowManualApproval)
        if (d.agreementTerm !== undefined) setAgreementTerm(d.agreementTerm)
        if (d.termEndDate !== undefined) setTermEndDate(d.termEndDate)
        if (d.proposalServices !== undefined) setProposalServices(d.proposalServices)
      }
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save draft to sessionStorage on every change
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        name, clientId, effectiveDate, introMessage, setExpiration,
        paymentDueDays, processingFeePayer, allowApproveWithoutPayment,
        allowManualApproval, agreementTerm, termEndDate, proposalServices,
      }))
    } catch {}
  }, [name, clientId, effectiveDate, introMessage, setExpiration, paymentDueDays,
      processingFeePayer, allowApproveWithoutPayment, allowManualApproval,
      agreementTerm, termEndDate, proposalServices])

  // Handle addService from URL after creating a new service
  useEffect(() => {
    const addServiceId = searchParams.get("addService")
    if (addServiceId) {
      const svc = services.find((s) => s.id === addServiceId)
      if (svc) {
        const ps = serviceToProposalService(svc)
        setProposalServices((prev) => {
          if (prev.some((p) => p.serviceId === svc.id)) return prev
          return [...prev, ps]
        })
      }
      const url = new URL(window.location.href)
      url.searchParams.delete("addService")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams, services, serviceToProposalService])

  const selectedClient = clients.find((c) => c.id === clientId)

  const handleAddNewClient = async () => {
    if (!newClientName.trim()) {
      toast.error("Please enter the client's name")
      return
    }
    if (!newClientEmail.trim()) {
      toast.error("Please enter the client's email")
      return
    }
    const id = generateId()
    const client = {
      id,
      name: newClientName.trim(),
      email: newClientEmail.trim(),
      company: newClientCompany.trim() || undefined,
      phone: newClientPhone.trim() || undefined,
    }
    await addClient(client)
    setClientId(id)
    setShowNewClient(false)
    setNewClientName("")
    setNewClientEmail("")
    setNewClientCompany("")
    setNewClientPhone("")
    toast.success("Client added")
  }

  const addExistingService = (serviceId: string) => {
    const svc = services.find((s) => s.id === serviceId)
    if (!svc) return
    if (proposalServices.some((ps) => ps.serviceId === serviceId)) {
      toast.error("Service already added to this proposal")
      return
    }
    setProposalServices((prev) => [...prev, serviceToProposalService(svc)])
    setShowAddService(false)
  }

  const removeProposalService = (serviceId: string) => {
    setProposalServices((prev) =>
      prev.filter((ps) => ps.serviceId !== serviceId)
    )
  }

  const updateProposalServiceParams = (
    serviceId: string,
    parameters: PricingParameter[]
  ) => {
    setProposalServices((prev) =>
      prev.map((ps) =>
        ps.serviceId === serviceId
          ? { ...ps, parameters, overridden: true }
          : ps
      )
    )
  }

  const [saving, setSaving] = useState(false)
  const [linkDialog, setLinkDialog] = useState<{ url: string; emailSent: boolean; emailError: string | null } | null>(null)

  const handleSave = async (status: "draft" | "sent") => {
    if (!name.trim()) {
      toast.error("Please enter an agreement name")
      return
    }
    if (!clientId) {
      toast.error("Please select a client")
      return
    }

    const dueDays =
      paymentDueDays === "upon_receipt"
        ? 0
        : parseInt(paymentDueDays, 10)

    const proposal: Proposal = {
      id: generateId(),
      name: name.trim(),
      clientName: selectedClient?.name || "",
      clientEmail: selectedClient?.email || "",
      effectiveDate,
      introductoryMessage:
        introMessage === "none" ? undefined : introMessage,
      paymentDueDays: dueDays,
      processingFeePayer: processingFeePayer as
        | "provider"
        | "client"
        | "split",
      allowApproveWithoutPayment,
      allowManualApproval,
      agreementTerm: agreementTerm as "ongoing" | "fixed",
      termEndDate: agreementTerm === "fixed" ? termEndDate : undefined,
      services: proposalServices,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setSaving(true)
    try {
      const created = await addProposal(proposal)
      sessionStorage.removeItem(DRAFT_KEY)
      if (status === "sent") {
        const { acceptanceUrl, emailSent, emailError } = await sendProposal(created.id)
        navigator.clipboard.writeText(acceptanceUrl).catch(() => {})
        setLinkDialog({ url: acceptanceUrl, emailSent, emailError })
        // don't navigate — let user see the link dialog first
      } else {
        toast.success("Proposal saved as draft")
        router.push("/dashboard/proposals")
      }
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save proposal")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--anchor-bg)]">
      {/* ---------- Top bar ---------- */}
      <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { sessionStorage.removeItem(DRAFT_KEY); router.push("/dashboard/proposals") }}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">
            Create proposal
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Star className="h-4 w-4" />
            Save as template
          </button>
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={saving}>
            <Eye className="h-4 w-4 mr-2" />
            Save draft
          </Button>
          <Button
            onClick={() => handleSave("sent")}
            disabled={saving}
            className="bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white gap-2"
          >
            <Send className="h-4 w-4" />
            {saving ? "Saving…" : "Send"}
          </Button>
        </div>
      </header>

      {/* ---------- Content ---------- */}
      <div className="max-w-3xl mx-auto p-6 space-y-5">
        {/* ====== Agreement details ====== */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agreement details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Agreement name */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Agreement name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Primary contact */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Primary contact
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Select value={clientId} onValueChange={(v) => {
                  if (v === "__new__") {
                    setShowNewClient(true)
                  } else {
                    setClientId(v)
                    setShowNewClient(false)
                  }
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.name}
                          <span className="text-muted-foreground">({c.email})</span>
                        </span>
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__">
                      <span className="flex items-center gap-2 text-[var(--anchor-purple)] font-medium">
                        <UserPlus className="h-3.5 w-3.5" />
                        Add new client
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!showNewClient && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    onClick={() => setShowNewClient(true)}
                    title="Add new client"
                  >
                    <UserPlus className="h-4 w-4 text-[var(--anchor-purple)]" />
                  </Button>
                )}
              </div>

              {/* Inline add-client form */}
              {showNewClient && (
                <div className="mt-3 p-4 rounded-lg border-2 border-dashed border-[var(--anchor-purple)]/30 bg-[var(--anchor-purple)]/[0.02] space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="h-4 w-4 text-[var(--anchor-purple)]" />
                    <span className="text-sm font-semibold text-foreground">New client</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Jane Doe"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="email"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Company
                      </Label>
                      <Input
                        value={newClientCompany}
                        onChange={(e) => setNewClientCompany(e.target.value)}
                        placeholder="Company name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Phone
                      </Label>
                      <Input
                        type="tel"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="(555) 123-4567"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white gap-1.5"
                      onClick={handleAddNewClient}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add client
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowNewClient(false)
                        setNewClientName("")
                        setNewClientEmail("")
                        setNewClientCompany("")
                        setNewClientPhone("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Show selected client details */}
              {selectedClient && !showNewClient && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/60 text-sm">
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-[var(--anchor-purple)]/10 text-[var(--anchor-purple)] text-xs font-semibold shrink-0">
                    {selectedClient.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selectedClient.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedClient.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Effective date */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Agreement effective date
              </Label>
              <Select
                value={effectiveDate}
                onValueChange={setEffectiveDate}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_acceptance">On acceptance</SelectItem>
                  <SelectItem value="custom">Custom date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Introductory message */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Introductory message
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Select
                  value={introMessage}
                  onValueChange={setIntroMessage}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="new_client_onboarding">
                      New client onboarding template
                    </SelectItem>
                    <SelectItem value="renewal">
                      Renewal template
                    </SelectItem>
                    <SelectItem value="custom">
                      Custom message
                    </SelectItem>
                  </SelectContent>
                </Select>
                {introMessage !== "none" && (
                  <button className="text-sm font-medium text-[var(--anchor-purple)] hover:underline whitespace-nowrap">
                    Edit message
                  </button>
                )}
              </div>
            </div>

            {/* Expiration checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="expiration"
                checked={setExpiration}
                onCheckedChange={(v) => setSetExpiration(v === true)}
              />
              <Label
                htmlFor="expiration"
                className="text-sm text-foreground cursor-pointer"
              >
                Set an expiration for this proposal
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* ====== Services provided ====== */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Services provided</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Added services */}
            {proposalServices.length > 0 && (
              <div className="space-y-3 mb-6">
                {proposalServices.map((ps) => {
                  const price =
                    ps.pricingType === "dynamic"
                      ? calculateDynamicPrice(ps.parameters)
                      : ps.fixedPrice ?? 0
                  const isExpanded = expandedService === ps.serviceId

                  return (
                    <div
                      key={ps.serviceId}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-4 bg-card">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              setExpandedService(
                                isExpanded ? null : ps.serviceId
                              )
                            }
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {ps.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground capitalize">
                                {ps.billingOccurrence}
                              </span>
                              {ps.overridden && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300"
                                >
                                  Overridden
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-foreground">
                            {formatCurrency(price)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              removeProposalService(ps.serviceId)
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Expanded pricing editor */}
                      {isExpanded && ps.pricingType === "dynamic" && (
                        <div className="border-t border-border p-4 bg-secondary/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">
                              Override pricing for this proposal
                            </span>
                          </div>
                          <PricingParameterBuilder
                            parameters={ps.parameters}
                            onChange={(params) =>
                              updateProposalServiceParams(
                                ps.serviceId,
                                params
                              )
                            }
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add service area */}
            <div className="text-center py-4 border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                {"Add the services you'd like to include in the proposal."}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {
                  "Services can be customized after they've been added."
                }
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setShowAddService(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Existing Service
                </Button>
                <Button
                  className="bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white gap-2"
                  onClick={() =>
                    router.push(
                      `/dashboard/services/new?returnTo=/dashboard/proposals/new`
                    )
                  }
                >
                  <Plus className="h-4 w-4" />
                  Create New Service
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ====== Payment settings (collapsible) ====== */}
        <CollapsibleSection
          title="Payment settings"
          icon={CreditCard}
          defaultOpen={false}
        >
          <div className="space-y-5 pt-4">
            {/* Due days */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Set the number of days until the payment is due
              </Label>
              <Select
                value={paymentDueDays}
                onValueChange={setPaymentDueDays}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upon_receipt">
                    Upon receipt
                  </SelectItem>
                  <SelectItem value="7">Net 7</SelectItem>
                  <SelectItem value="15">Net 15</SelectItem>
                  <SelectItem value="30">Net 30</SelectItem>
                  <SelectItem value="45">Net 45</SelectItem>
                  <SelectItem value="60">Net 60</SelectItem>
                  <SelectItem value="90">Net 90</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Processing fee payer */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Define who will pay the credit card processing fee
              </Label>
              <Select
                value={processingFeePayer}
                onValueChange={setProcessingFeePayer}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="provider">
                    I will absorb the fee
                  </SelectItem>
                  <SelectItem value="client">
                    My client will pay the fee
                  </SelectItem>
                  <SelectItem value="split">
                    Split the fee equally
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Approve without payment */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="approve-without-payment"
                checked={allowApproveWithoutPayment}
                onCheckedChange={(v) =>
                  setAllowApproveWithoutPayment(v === true)
                }
                className="mt-0.5"
              />
              <div>
                <Label
                  htmlFor="approve-without-payment"
                  className="text-sm text-foreground cursor-pointer leading-tight"
                >
                  Let my client approve the agreement without providing a
                  payment method
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  The client can accept the proposal and add payment details
                  later.
                </p>
              </div>
            </div>

            {/* Manual approval */}
            <div className="flex items-start gap-3">
              <Checkbox
                id="manual-approval"
                checked={allowManualApproval}
                onCheckedChange={(v) =>
                  setAllowManualApproval(v === true)
                }
                className="mt-0.5"
              />
              <div>
                <Label
                  htmlFor="manual-approval"
                  className="text-sm text-foreground cursor-pointer leading-tight"
                >
                  Let my client manually approve each payment
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Instead of auto-charging, each invoice will require client
                  approval before processing.
                </p>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* ====== Agreement term (collapsible) ====== */}
        <CollapsibleSection
          title="Agreement term"
          icon={Calendar}
          defaultOpen={false}
        >
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                Agreement duration
              </Label>
              <Select
                value={agreementTerm}
                onValueChange={setAgreementTerm}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ongoing">
                    Ongoing (no end date)
                  </SelectItem>
                  <SelectItem value="fixed">Fixed term</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {agreementTerm === "fixed" && (
              <div>
                <Label className="text-xs text-muted-foreground">
                  End date
                </Label>
                <Input
                  type="date"
                  value={termEndDate}
                  onChange={(e) => setTermEndDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {agreementTerm === "ongoing"
                ? "This agreement will remain active until manually cancelled by either party."
                : "The agreement will automatically expire on the selected end date."}
            </p>
          </div>
        </CollapsibleSection>
      </div>

      {/* ---------- Send result dialog ---------- */}
      <Dialog open={!!linkDialog} onOpenChange={(o) => { if (!o) { setLinkDialog(null); router.push("/dashboard/proposals") } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {linkDialog?.emailSent ? (
                <><CheckCircle2 className="h-5 w-5 text-green-500" /> Proposal sent</>
              ) : (
                <><AlertCircle className="h-5 w-5 text-amber-500" /> Share this link with your client</>
              )}
            </DialogTitle>
            <DialogDescription>
              {linkDialog?.emailSent
                ? "An email was sent to your client. You can also share the link below directly."
                : "Email delivery requires a verified domain on Resend. Copy and share this acceptance link manually."}
            </DialogDescription>
          </DialogHeader>
          {linkDialog?.emailError && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              {linkDialog.emailError}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <Input readOnly value={linkDialog?.url ?? ""} className="text-xs font-mono" />
            <Button
              size="sm"
              className="shrink-0 bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white"
              onClick={() => {
                navigator.clipboard.writeText(linkDialog?.url ?? "")
                toast.success("Link copied!")
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          {!linkDialog?.emailSent && (
            <p className="text-xs text-muted-foreground">
              To enable automatic emails, verify a domain at{" "}
              <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-[var(--anchor-purple)] underline">
                resend.com/domains
              </a>
              , then update the <code className="text-xs bg-secondary px-1 rounded">from</code> address in{" "}
              <code className="text-xs bg-secondary px-1 rounded">app/api/proposals/[id]/send/route.ts</code>.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Add existing service dialog ---------- */}
      <Dialog open={showAddService} onOpenChange={setShowAddService}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Existing Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No services created yet.
              </p>
            ) : (
              services.map((svc) => {
                const alreadyAdded = proposalServices.some(
                  (ps) => ps.serviceId === svc.id
                )
                const price =
                  svc.pricingType === "dynamic"
                    ? calculateDynamicPrice(svc.parameters)
                    : svc.fixedPrice ?? 0

                return (
                  <button
                    key={svc.id}
                    disabled={alreadyAdded}
                    onClick={() => addExistingService(svc.id)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-[var(--anchor-purple)]/30 hover:bg-[var(--anchor-purple)]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {svc.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                          {svc.billingOccurrence} &middot;{" "}
                          {svc.pricingType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {formatCurrency(price)}
                        </p>
                        {alreadyAdded && (
                          <span className="text-xs text-muted-foreground">
                            Already added
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function NewProposalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <ProposalCreationContent />
    </Suspense>
  )
}
