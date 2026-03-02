"use client"

import { useState } from "react"
import { useAppContext } from "@/lib/data-context"
import { CreateProposalButton } from "@/components/create-proposal-button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, MoreHorizontal, Trash2, Eye, Send, Copy, Link as LinkIcon, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const STATUS_STYLES: Record<string, string> = {
  draft: "",
  sent: "bg-amber-100 text-amber-700 border-amber-200",
  viewed: "bg-blue-100 text-blue-700 border-blue-200",
  accepted: "bg-anchor-green/10 text-anchor-green border-anchor-green/20",
  declined: "bg-red-100 text-red-700 border-red-200",
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted agreement",
  declined: "Declined",
}

export default function ProposalsPage() {
  const { proposals, deleteProposal, sendProposal } = useAppContext()
  const router = useRouter()
  const [sending, setSending] = useState<string | null>(null)
  const [linkDialog, setLinkDialog] = useState<{ url: string; emailSent: boolean; emailError: string | null } | null>(null)

  const handleSend = async (id: string) => {
    setSending(id)
    try {
      const { acceptanceUrl, emailSent, emailError } = await sendProposal(id)
      navigator.clipboard.writeText(acceptanceUrl).catch(() => {})
      setLinkDialog({ url: acceptanceUrl, emailSent, emailError })
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to send proposal")
    } finally {
      setSending(null)
    }
  }

  const handleCopyLink = (acceptanceToken: string | undefined) => {
    if (!acceptanceToken) return
    const url = `${window.location.origin}/client/proposals/${acceptanceToken}`
    navigator.clipboard.writeText(url)
    toast.success("Acceptance link copied to clipboard")
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proposals</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your proposals and agreements
          </p>
        </div>
        <CreateProposalButton />
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm mb-4">No proposals yet.</p>
            <CreateProposalButton />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {proposals.map((p) => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between py-4">
                <Link
                  href={`/dashboard/proposals/${p.id}`}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--anchor-purple)]/10 shrink-0">
                    <FileText className="h-5 w-5 text-[var(--anchor-purple)]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {p.name || "Untitled agreement"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.clientName} &middot; {p.services.length} service
                      {p.services.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </span>
                  <Badge variant="outline" className={STATUS_STYLES[p.status] || ""}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/proposals/${p.id}`)}
                        className="gap-2 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View / Edit
                      </DropdownMenuItem>
                      {p.status === "draft" && (
                        <DropdownMenuItem
                          onClick={() => handleSend(p.id)}
                          disabled={sending === p.id}
                          className="gap-2 cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5" />
                          {sending === p.id ? "Sending…" : "Send to client"}
                        </DropdownMenuItem>
                      )}
                      {(p.status === "sent" || p.status === "viewed") && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handleCopyLink((p as unknown as { acceptanceToken?: string }).acceptanceToken)}
                            className="gap-2 cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy acceptance link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const token = (p as unknown as { acceptanceToken?: string }).acceptanceToken
                              if (token) router.push(`/client/proposals/${token}`)
                            }}
                            className="gap-2 cursor-pointer"
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                            Preview client view
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteProposal(p.id).catch(() => toast.error("Failed to delete"))}
                        className="gap-2 cursor-pointer text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Send result dialog */}
      <Dialog open={!!linkDialog} onOpenChange={(o) => !o && setLinkDialog(null)}>
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
    </div>
  )
}
