"use client"

import { useAppContext } from "@/lib/data-context"
import { CreateProposalButton } from "@/components/create-proposal-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, calculateDynamicPrice } from "@/lib/pricing"
import { FileText, Briefcase, CheckCircle2, Clock, DollarSign } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { proposals, services } = useAppContext()

  const activeAgreements = proposals.filter((p) => p.status === "accepted").length
  const awaitingApproval = proposals.filter((p) => p.status === "sent").length
  const draftCount = proposals.filter((p) => p.status === "draft").length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hi Alla!{" "}
            <span className="text-muted-foreground font-normal text-base ml-2">
              Meet Anchor
            </span>
          </h1>
        </div>
        <CreateProposalButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--anchor-purple)]/10">
                <FileText className="h-5 w-5 text-[var(--anchor-purple)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Proposals</p>
                <p className="text-2xl font-bold text-foreground">{proposals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-anchor-green/10">
                <CheckCircle2 className="h-5 w-5 text-anchor-green" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Agreements</p>
                <p className="text-2xl font-bold text-foreground">{activeAgreements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-100">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Awaiting Approval</p>
                <p className="text-2xl font-bold text-foreground">{awaitingApproval}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-secondary">
                <Briefcase className="h-5 w-5 text-[var(--anchor-purple)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Services</p>
                <p className="text-2xl font-bold text-foreground">{services.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent proposals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Proposals</CardTitle>
          <Link
            href="/dashboard/proposals"
            className="text-sm font-medium text-[var(--anchor-purple)] hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {proposals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">No proposals yet. Create your first proposal to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proposals.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/proposals/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name || "Untitled agreement"}</p>
                      <p className="text-xs text-muted-foreground">{p.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {p.services.length} service{p.services.length !== 1 ? "s" : ""}
                    </span>
                    <Badge
                      variant={
                        p.status === "accepted"
                          ? "default"
                          : p.status === "sent"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        p.status === "accepted"
                          ? "bg-anchor-green text-white"
                          : p.status === "sent"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : ""
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
