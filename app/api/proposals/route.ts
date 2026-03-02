import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { randomUUID } from "crypto"

function serializeProposal(p: {
  services: string
  signedAt: Date | null
  createdAt: Date
  updatedAt: Date
  [key: string]: unknown
}) {
  return {
    ...p,
    services: JSON.parse(p.services as string),
    signedAt: p.signedAt ? (p.signedAt as Date).toISOString() : undefined,
    createdAt: (p.createdAt as Date).toISOString(),
    updatedAt: (p.updatedAt as Date).toISOString(),
  }
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const proposals = await prisma.proposal.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(proposals.map(serializeProposal))
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const proposal = await prisma.proposal.create({
    data: {
      ...body,
      services: JSON.stringify(body.services ?? []),
      acceptanceToken: randomUUID(),
    },
  })
  return NextResponse.json(serializeProposal(proposal), { status: 201 })
}
