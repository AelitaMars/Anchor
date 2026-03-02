import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const services = await prisma.service.findMany({ orderBy: { createdAt: "asc" } })
  return NextResponse.json(
    services.map((s) => ({ ...s, parameters: JSON.parse(s.parameters) }))
  )
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const service = await prisma.service.create({
    data: {
      ...body,
      parameters: JSON.stringify(body.parameters ?? []),
    },
  })
  return NextResponse.json({ ...service, parameters: JSON.parse(service.parameters) }, { status: 201 })
}
