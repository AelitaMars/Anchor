"use client"

import { use, useState, useRef, useEffect } from "react"
import { calculateDynamicPrice, formatCurrency } from "@/lib/pricing"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  CheckCircle2,
  FileText,
  DollarSign,
  Calendar,
  User,
  Pen,
  Download,
} from "lucide-react"
import { toast } from "sonner"
import type { Proposal } from "@/lib/types"

export default function ClientProposalPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const [proposal, setProposal] = useState<Proposal & { acceptanceToken?: string } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loadingProposal, setLoadingProposal] = useState(true)

  const [signatureName, setSignatureName] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [signed, setSigned] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/public/proposals/${token}`)
      .then((res) => {
        if (res.status === 404) { setNotFound(true); return null }
        return res.json()
      })
      .then((data) => {
        if (data) setProposal(data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingProposal(false))
  }, [token])

  // Signature canvas handlers
  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const { x, y } = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y)
    ctx.strokeStyle = "#1e1e2f"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.stroke()
    setHasDrawn(true)
  }

  const stopDrawing = () => setIsDrawing(false)

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleSign = async () => {
    if (!signatureName.trim()) {
      toast.error("Please enter your full name")
      return
    }
    if (!agreed) {
      toast.error("Please agree to the terms")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/public/proposals/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedBy: signatureName.trim() }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error((err as { error?: string }).error ?? "Failed to accept proposal")
        return
      }

      setSigned(true)
      toast.success("Proposal accepted and signed!")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  if (loadingProposal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground text-sm">Loading proposal…</div>
      </div>
    )
  }

  if (notFound || !proposal) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Proposal Not Found</h2>
            <p className="text-sm text-muted-foreground">
              This proposal may have been removed or the link is incorrect.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (proposal.status === "accepted" || signed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-anchor-green/10 mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-anchor-green" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Proposal Accepted
            </h2>
            <p className="text-sm text-muted-foreground">
              Thank you for accepting this proposal. The service provider has been notified.
            </p>
            {proposal.signedAt && (
              <p className="text-xs text-muted-foreground mt-4">
                Signed on {new Date(proposal.signedAt).toLocaleDateString()} by{" "}
                {proposal.signedBy}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalPrice = proposal.services.reduce((sum, ps) => {
    const price =
      ps.pricingType === "dynamic"
        ? calculateDynamicPrice(ps.parameters)
        : ps.fixedPrice ?? 0
    return sum + price
  }, 0)

  return (
    <>
      {/* Print styles — hidden from screen, used when window.print() is called */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #proposal-printable, #proposal-printable * { visibility: visible; }
          #proposal-printable { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-signature-box {
            border: 1px solid #ccc;
            height: 80px;
            margin-top: 8px;
            border-radius: 4px;
          }
        }
      `}</style>

      <div id="proposal-printable" className="max-w-3xl mx-auto p-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--anchor-purple)]">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2L4 8V24L16 30L28 24V8L16 2Z" fill="#ffffff" opacity="0.3" />
                <path d="M16 10L12 12V20L16 22L20 20V12L16 10Z" fill="#ffffff" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Proposal from Book Solid</h1>
              <p className="text-sm text-muted-foreground">
                Sent to {proposal.clientName}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPDF}
            className="no-print gap-2"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>

        {/* Agreement details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{proposal.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Client:</span>
                <span className="font-medium text-foreground">{proposal.clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Effective:</span>
                <span className="font-medium text-foreground">On acceptance</span>
              </div>
            </div>
            {proposal.introductoryMessage && (
              <p className="text-sm text-muted-foreground mt-4 border-t border-border pt-4">
                {proposal.introductoryMessage}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Services */}
        <h2 className="text-lg font-semibold text-foreground mb-4">Services Included</h2>
        <div className="space-y-4 mb-6">
          {proposal.services.map((ps) => {
            const price =
              ps.pricingType === "dynamic"
                ? calculateDynamicPrice(ps.parameters)
                : ps.fixedPrice ?? 0

            return (
              <Card key={ps.serviceId}>
                <CardContent className="py-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{ps.name}</h3>
                      {ps.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ps.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[var(--anchor-purple)]">
                        {formatCurrency(price)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {ps.billingOccurrence}
                      </p>
                    </div>
                  </div>

                  {ps.pricingType === "dynamic" && ps.parameters.length > 0 && (
                    <div className="border-t border-border pt-4 space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Pricing Breakdown
                      </p>
                      {ps.parameters.map((param) => {
                        const selectedTier = param.tiers.find(
                          (t) => t.id === param.selectedTierId
                        )
                        return (
                          <div
                            key={param.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div>
                              <span className="text-foreground">{param.name}</span>
                              {selectedTier && (
                                <span className="text-muted-foreground ml-2">
                                  - {selectedTier.label}
                                </span>
                              )}
                            </div>
                            <div className="font-medium text-foreground">
                              {param.kind === "base" && selectedTier
                                ? formatCurrency(selectedTier.value)
                                : selectedTier
                                ? param.adjustmentType === "multiplier"
                                  ? `${selectedTier.value}x`
                                  : param.adjustmentType === "fixed_add"
                                  ? `+${formatCurrency(selectedTier.value)}`
                                  : `-${formatCurrency(selectedTier.value)}`
                                : "-"}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Total */}
        <Card className="mb-8 border-[var(--anchor-purple)]/20 bg-[var(--anchor-purple)]/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[var(--anchor-purple)]" />
                <span className="text-sm font-semibold text-foreground">
                  Total{" "}
                  {proposal.services.length > 0 &&
                    `(${proposal.services[0].billingOccurrence})`}
                </span>
              </div>
              <span className="text-2xl font-bold text-[var(--anchor-purple)]">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Signature section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Pen className="h-4 w-4" />
              Accept &amp; Sign
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Full Name</Label>
              <Input
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Enter your full name"
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm">Signature</Label>
                {hasDrawn && (
                  <button
                    onClick={clearSignature}
                    className="text-xs text-[var(--anchor-purple)] hover:underline no-print"
                  >
                    Clear
                  </button>
                )}
              </div>
              {/* Screen: interactive canvas */}
              <canvas
                ref={canvasRef}
                width={500}
                height={120}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-[120px] border border-border rounded-md bg-white cursor-crosshair no-print"
              />
              {/* Print: static signature box */}
              <div className="print-signature-box hidden" aria-hidden />
              <p className="text-xs text-muted-foreground mt-1 no-print">
                Draw your signature above
              </p>
            </div>

            <div className="flex items-start gap-2 no-print">
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(v === true)}
              />
              <Label
                htmlFor="agree"
                className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
              >
                I agree to the terms of this proposal and authorize Book Solid to
                proceed with the services described above.
              </Label>
            </div>

            <Button
              onClick={handleSign}
              disabled={!signatureName.trim() || !agreed || submitting}
              className="w-full bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white no-print"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {submitting ? "Submitting…" : "Accept & Sign Proposal"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
