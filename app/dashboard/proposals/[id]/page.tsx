"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/lib/data-context"
import { calculateDynamicPrice, formatCurrency } from "@/lib/pricing"
import { PricingParameterBuilder } from "@/components/pricing-parameter-builder"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Eye, CheckCircle2, Clock, FileText } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import type { PricingParameter } from "@/lib/types"

const STATUS_CONFIG: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  draft: { icon: FileText, color: "text-muted-foreground", label: "Draft" },
  sent: { icon: Clock, color: "text-amber-600", label: "Sent - Awaiting Response" },
  viewed: { icon: Eye, color: "text-blue-600", label: "Viewed by Client" },
  accepted: { icon: CheckCircle2, color: "text-anchor-green", label: "Agreement" },
  declined: { icon: FileText, color: "text-destructive", label: "Declined" },
}

export default function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { proposals, updateProposal, services } = useAppContext()
  const proposal = proposals.find((p) => p.id === id)

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Proposal not found.</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/proposals")}>
          Back to Proposals
        </Button>
      </div>
    )
  }

  const statusConfig = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft
  const StatusIcon = statusConfig.icon

  const handleSend = () => {
    // Require at least one parameter option to be selected for dynamic-pricing services
    const unselectedService = proposal.services.find(
      (ps) =>
        ps.pricingType === "dynamic" &&
        ps.parameters.length > 0 &&
        !ps.parameters.some((p) => !!p.selectedTierId)
    )
    if (unselectedService) {
      toast.error(`Select at least one option for "${unselectedService.name}"`)
      return
    }
    updateProposal({
      ...proposal,
      status: "sent",
      updatedAt: new Date().toISOString(),
    })
    toast.success("Proposal sent to client")
  }

  const handleUpdateServiceParams = (serviceId: string, parameters: PricingParameter[]) => {
    const originalService = services.find((s) => s.id === serviceId)
    // Mark overridden when tier VALUES change OR when parameters are removed
    const overridden = originalService
      ? parameters.length !== originalService.parameters.length ||
        parameters.some((param) => {
          const originalParam = originalService.parameters.find((p) => p.id === param.id)
          if (!originalParam) return true
          return param.tiers.some((tier) => {
            const originalTier = originalParam.tiers.find((t) => t.id === tier.id)
            if (!originalTier) return true
            return tier.value !== originalTier.value
          })
        })
      : false
    const updatedServices = proposal.services.map((ps) =>
      ps.serviceId === serviceId ? { ...ps, parameters, overridden } : ps
    )
    updateProposal({
      ...proposal,
      services: updatedServices,
      updatedAt: new Date().toISOString(),
    })
  }

  const totalPrice = proposal.services.reduce((sum, ps) => {
    const price =
      ps.pricingType === "dynamic"
        ? calculateDynamicPrice(ps.parameters)
        : ps.fixedPrice ?? 0
    return sum + price
  }, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/proposals")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {proposal.name || "Untitled agreement"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {proposal.clientName} &middot; {proposal.clientEmail}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(proposal.status === "sent" || proposal.status === "accepted") && proposal.acceptanceToken && (
            <Link href={`/client/proposals/${proposal.acceptanceToken}`}>
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                Client View
              </Button>
            </Link>
          )}
          {proposal.status === "draft" && (
            <Button
              onClick={handleSend}
              className="bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white gap-2"
            >
              <Send className="h-4 w-4" />
              Send Proposal
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
            <span className={`text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            {proposal.signedAt && (
              <span className="text-xs text-muted-foreground ml-auto">
                Signed on {new Date(proposal.signedAt).toLocaleDateString()} by{" "}
                {proposal.signedBy}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proposal details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {proposal.services.map((ps) => {
            const price =
              ps.pricingType === "dynamic"
                ? calculateDynamicPrice(ps.parameters)
                : ps.fixedPrice ?? 0

            return (
              <Card key={ps.serviceId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{ps.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {ps.billingOccurrence} &middot;{" "}
                        {ps.pricingType === "dynamic" ? "Dynamic pricing" : "Set pricing"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[var(--anchor-purple)]">
                        {formatCurrency(price)}
                      </p>
                      {ps.overridden && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-amber-600 border-amber-300"
                        >
                          Overridden
                        </Badge>
                      )}
                      {proposal.status === "draft" &&
                        ps.pricingType === "dynamic" &&
                        ps.parameters.length > 0 &&
                        !ps.parameters.some((p) => !!p.selectedTierId) && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-600 border-amber-300"
                          >
                            Select options
                          </Badge>
                        )}
                    </div>
                  </div>
                </CardHeader>
                {ps.pricingType === "dynamic" && ps.parameters.length > 0 && (
                  <CardContent>
                    <PricingParameterBuilder
                      parameters={ps.parameters}
                      onChange={(params) =>
                        proposal.status === "draft"
                          ? handleUpdateServiceParams(ps.serviceId, params)
                          : undefined
                      }
                      readOnly={proposal.status !== "draft"}
                    />
                  </CardContent>
                )}
              </Card>
            )
          })}

          {proposal.services.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No services in this proposal.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary sidebar */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Proposal Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {proposal.services.map((ps) => {
                  const price =
                    ps.pricingType === "dynamic"
                      ? calculateDynamicPrice(ps.parameters)
                      : ps.fixedPrice ?? 0
                  return (
                    <div key={ps.serviceId} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">{ps.name}</span>
                      <span className="font-medium text-foreground shrink-0">
                        {formatCurrency(price)}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Total</span>
                  <span className="text-lg font-bold text-[var(--anchor-purple)]">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {proposal.services.length > 0
                    ? `${proposal.services[0].billingOccurrence} billing`
                    : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
