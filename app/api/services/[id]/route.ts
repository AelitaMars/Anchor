import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const service = await prisma.service.findUnique({ where: { id } })
  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ...service, parameters: JSON.parse(service.parameters) })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const service = await prisma.service.update({
    where: { id },
    data: { ...body, parameters: JSON.stringify(body.parameters ?? []) },
  })
  return NextResponse.json({ ...service, parameters: JSON.parse(service.parameters) })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.service.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
