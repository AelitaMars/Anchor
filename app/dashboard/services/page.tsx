"use client"

import { useAppContext } from "@/lib/data-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Briefcase, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatCurrency, calculateDynamicPrice } from "@/lib/pricing"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function ServicesPage() {
  const { services, deleteService } = useAppContext()
  const router = useRouter()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your service offerings and pricing
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/services/new")}
          className="bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Service
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm mb-4">No services created yet.</p>
            <Button
              onClick={() => router.push("/dashboard/services/new")}
              className="bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Create your first service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((svc) => {
            const price =
              svc.pricingType === "dynamic"
                ? calculateDynamicPrice(svc.parameters)
                : svc.setPricingMode === "range"
                  ? svc.priceRangeMin ?? 0
                  : svc.fixedPrice ?? 0

            const setPricingLabel =
              svc.setPricingMode === "hourly"
                ? "Per hour"
                : svc.setPricingMode === "per_unit"
                  ? "Per unit"
                  : svc.setPricingMode === "range"
                    ? "Price range"
                    : "Fixed price"

            return (
              <Card key={svc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-[var(--anchor-purple)]/10">
                      <Briefcase className="h-5 w-5 text-[var(--anchor-purple)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{svc.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {svc.description
                          ? svc.description.slice(0, 80) + (svc.description.length > 80 ? "..." : "")
                          : "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {svc.pricingType === "dynamic"
                          ? `From ${formatCurrency(price)}`
                          : svc.setPricingMode === "range"
                            ? `${formatCurrency(svc.priceRangeMin ?? 0)} – ${formatCurrency(svc.priceRangeMax ?? 0)}`
                            : formatCurrency(price)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs capitalize">
                          {svc.billingOccurrence}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={
                            svc.pricingType === "dynamic"
                              ? "text-xs bg-[var(--anchor-purple)]/10 text-[var(--anchor-purple)]"
                              : "text-xs"
                          }
                        >
                          {svc.pricingType === "dynamic" ? "Dynamic pricing" : setPricingLabel}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/services/${svc.id}/edit`)}
                          className="gap-2 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteService(svc.id).catch(() => toast.error("Failed to delete"))}
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
            )
          })}
        </div>
      )}
    </div>
  )
}
