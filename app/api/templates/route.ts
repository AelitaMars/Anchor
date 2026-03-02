import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const templates = await prisma.pricingTemplate.findMany({ orderBy: { createdAt: "asc" } })
  return NextResponse.json(
    templates.map((t) => ({ ...t, parameters: JSON.parse(t.parameters) }))
  )
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const template = await prisma.pricingTemplate.create({
    data: { ...body, parameters: JSON.stringify(body.parameters ?? []) },
  })
  return NextResponse.json({ ...template, parameters: JSON.parse(template.parameters) }, { status: 201 })
}
