"use client"

import { useAppContext } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LayoutTemplate, MoreHorizontal, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PricingParameterBuilder } from "@/components/pricing-parameter-builder"
import { useState } from "react"
import type { PricingTemplate } from "@/lib/types"

export default function TemplatesPage() {
  const { pricingTemplates, deletePricingTemplate } = useAppContext()
  const [previewTemplate, setPreviewTemplate] = useState<PricingTemplate | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pricing Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reusable pricing structures for your services
          </p>
        </div>
      </div>

      {pricingTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutTemplate className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm mb-2">No pricing templates yet.</p>
            <p className="text-xs text-muted-foreground">
              Create a template by saving a pricing structure from a service.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pricingTemplates.map((tmpl) => (
            <Card key={tmpl.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between py-5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--anchor-purple)]/10">
                    <LayoutTemplate className="h-5 w-5 text-[var(--anchor-purple)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{tmpl.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tmpl.description || "No description"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {tmpl.parameters.length} parameter{tmpl.parameters.length !== 1 ? "s" : ""}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setPreviewTemplate(tmpl)}
                        className="gap-2 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deletePricingTemplate(tmpl.id).catch(() => toast.error("Failed to delete"))}
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

      {/* Preview dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <PricingParameterBuilder
              parameters={previewTemplate.parameters}
              onChange={() => {}}
              readOnly
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
