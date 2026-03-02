import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const proposal = await prisma.proposal.findUnique({
    where: { acceptanceToken: token },
  })
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    ...proposal,
    services: JSON.parse(proposal.services),
    signedAt: proposal.signedAt?.toISOString(),
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
  })
}
