import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clients = await prisma.client.findMany({ orderBy: { createdAt: "asc" } })
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const client = await prisma.client.create({ data: body })
  return NextResponse.json(client, { status: 201 })
}
