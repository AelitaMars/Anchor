import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const APP_URL = process.env.APP_URL ?? "http://localhost:3000"

// ---------------------------------------------------------------------------
// Inline price calculation (mirrors lib/pricing.ts, no import needed here)
// ---------------------------------------------------------------------------
interface PricingTier { id: string; label: string; value: number }
interface PricingParameter {
  id: string; name: string; kind: "base" | "additional"
  adjustmentType?: "multiplier" | "fixed_add" | "fixed_subtract"
  tiers: PricingTier[]; selectedTierId?: string
}
interface ProposalService {
  serviceId: string; name: string; description?: string
  billingOccurrence: string; pricingType: "set" | "dynamic"
  setPricingMode?: string; fixedPrice?: number
  priceRangeMin?: number; priceRangeMax?: number
  parameters: PricingParameter[]; discount?: number; discountType?: string
}

function calcPrice(ps: ProposalService): number {
  if (ps.pricingType !== "dynamic") return ps.fixedPrice ?? 0
  const base = ps.parameters.find((p) => p.kind === "base")
  if (!base) return 0
  const baseTier = base.tiers.find((t) => t.id === base.selectedTierId)
  let price = baseTier?.value ?? 0
  for (const param of ps.parameters) {
    if (param.kind === "base") continue
    const tier = param.tiers.find((t) => t.id === param.selectedTierId)
    if (!tier) continue
    if (param.adjustmentType === "multiplier") price *= tier.value
    else if (param.adjustmentType === "fixed_add") price += tier.value
    else if (param.adjustmentType === "fixed_subtract") price -= tier.value
  }
  return Math.max(0, Math.round(price * 100) / 100)
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

function buildServicesHtml(services: ProposalService[]): string {
  if (!services.length) return ""

  const rows = services.map((ps) => {
    const price = calcPrice(ps)
    const billing = ps.billingOccurrence ? `<span style="font-size:12px;color:#888;">${ps.billingOccurrence}</span>` : ""

    // Build breakdown rows for dynamic pricing
    let breakdown = ""
    if (ps.pricingType === "dynamic" && ps.parameters.length > 0) {
      const detailRows = ps.parameters.map((param) => {
        const tier = param.tiers.find((t) => t.id === param.selectedTierId)
        if (!tier) return ""
        let adj = ""
        if (param.kind === "base") adj = fmt(tier.value)
        else if (param.adjustmentType === "multiplier") adj = `${tier.value}×`
        else if (param.adjustmentType === "fixed_add") adj = `+${fmt(tier.value)}`
        else if (param.adjustmentType === "fixed_subtract") adj = `-${fmt(tier.value)}`
        return `<tr>
          <td style="padding:4px 8px;font-size:12px;color:#555;">${param.name}: ${tier.label}</td>
          <td style="padding:4px 8px;font-size:12px;color:#555;text-align:right;">${adj}</td>
        </tr>`
      }).join("")
      breakdown = `<table style="width:100%;margin-top:8px;border-top:1px solid #eee;">${detailRows}</table>`
    }

    return `<tr>
      <td style="padding:14px 16px;border-bottom:1px solid #f0f0f0;">
        <div style="font-weight:600;color:#1e1e2f;">${ps.name}</div>
        ${ps.description ? `<div style="font-size:13px;color:#666;margin-top:2px;">${ps.description}</div>` : ""}
        ${breakdown}
      </td>
      <td style="padding:14px 16px;border-bottom:1px solid #f0f0f0;text-align:right;vertical-align:top;white-space:nowrap;">
        <div style="font-size:18px;font-weight:700;color:#3d3b8e;">${fmt(price)}</div>
        ${billing}
      </td>
    </tr>`
  }).join("")

  const total = services.reduce((s, ps) => s + calcPrice(ps), 0)

  return `
    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;margin:16px 0;">
      <thead>
        <tr style="background:#f7f7fb;">
          <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Service</th>
          <th style="padding:10px 16px;text-align:right;font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#f7f7fb;">
          <td style="padding:12px 16px;font-weight:700;color:#1e1e2f;">Total</td>
          <td style="padding:12px 16px;text-align:right;font-size:20px;font-weight:700;color:#3d3b8e;">${fmt(total)}</td>
        </tr>
      </tfoot>
    </table>`
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const proposal = await prisma.proposal.findUnique({ where: { id } })
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (!proposal.acceptanceToken) {
    return NextResponse.json({ error: "Proposal has no acceptance token" }, { status: 400 })
  }

  const acceptanceUrl = `${APP_URL}/client/proposals/${proposal.acceptanceToken}`

  // Parse services JSON for the email
  let services: ProposalService[] = []
  try {
    services = JSON.parse(proposal.services as string)
  } catch { /* ignore parse errors */ }

  // Attempt to send email via Resend
  let emailSent = false
  let emailError: string | null = null

  try {
    const { error } = await resend.emails.send({
      from: "Proposals <onboarding@resend.dev>",
      to: [proposal.clientEmail],
      subject: `Proposal: ${proposal.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 620px; margin: 0 auto; padding: 32px; color: #1e1e2f;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
            <div style="width:40px;height:40px;border-radius:8px;background:#3d3b8e;display:flex;align-items:center;justify-content:center;">
              <span style="color:#fff;font-weight:700;font-size:18px;">A</span>
            </div>
            <span style="font-size:18px;font-weight:700;color:#3d3b8e;">Anchor</span>
          </div>

          <h2 style="color:#3d3b8e;margin:0 0 8px;">You have a new proposal</h2>
          <p style="color:#444;margin:0 0 4px;">Hi ${proposal.clientName},</p>
          <p style="color:#444;margin:0 0 20px;">A proposal has been prepared for you. Please review the services and pricing below, then click the button to accept.</p>

          <h3 style="margin:0 0 4px;font-size:16px;color:#1e1e2f;">${proposal.name}</h3>

          ${buildServicesHtml(services)}

          <div style="text-align:center;margin:28px 0;">
            <a href="${acceptanceUrl}" style="display:inline-block;padding:14px 32px;background:#3d3b8e;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
              Review &amp; Accept Proposal
            </a>
          </div>

          <p style="color:#888;font-size:13px;text-align:center;">Or copy this link: <a href="${acceptanceUrl}" style="color:#3d3b8e;">${acceptanceUrl}</a></p>

          <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
          <p style="color:#bbb;font-size:12px;text-align:center;">This proposal was sent via Anchor.</p>
        </div>
      `,
    })
    if (error) {
      console.error("Resend error:", error)
      emailError = (error as { message?: string }).message ?? "Email delivery failed"
    } else {
      emailSent = true
    }
  } catch (err) {
    console.error("Resend exception:", err)
    emailError = "Email delivery failed"
  }

  // Always mark as sent and return the acceptance URL
  await prisma.proposal.update({
    where: { id },
    data: { status: "sent" },
  })

  return NextResponse.json({
    success: true,
    emailSent,
    emailError,
    acceptanceUrl,
  })
}
