import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const proposal = await prisma.proposal.findUnique({ where: { id } })
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(serializeProposal(proposal))
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Strip read-only / relational fields before update
  const { id: _id, createdAt: _ca, updatedAt: _ua, acceptanceToken: _at, client: _cl, ...data } = body

  const proposal = await prisma.proposal.update({
    where: { id },
    data: {
      ...data,
      services: data.services !== undefined ? JSON.stringify(data.services) : undefined,
      signedAt: data.signedAt ? new Date(data.signedAt) : undefined,
    },
  })
  return NextResponse.json(serializeProposal(proposal))
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.proposal.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
