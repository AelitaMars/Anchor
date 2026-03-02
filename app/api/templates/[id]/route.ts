import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const template = await prisma.pricingTemplate.update({
    where: { id },
    data: { ...body, parameters: JSON.stringify(body.parameters ?? []) },
  })
  return NextResponse.json({ ...template, parameters: JSON.parse(template.parameters) })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.pricingTemplate.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
