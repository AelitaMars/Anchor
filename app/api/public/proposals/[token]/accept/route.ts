import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { signedBy } = await req.json()

  if (!signedBy?.trim()) {
    return NextResponse.json({ error: "Signer name is required" }, { status: 400 })
  }

  const proposal = await prisma.proposal.findUnique({ where: { acceptanceToken: token } })
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (proposal.status === "accepted") {
    return NextResponse.json({ error: "Already accepted" }, { status: 409 })
  }

  const updated = await prisma.proposal.update({
    where: { acceptanceToken: token },
    data: {
      status: "accepted",
      signedAt: new Date(),
      signedBy: signedBy.trim(),
    },
  })

  return NextResponse.json({
    success: true,
    status: updated.status,
    signedAt: updated.signedAt?.toISOString(),
    signedBy: updated.signedBy,
  })
}
