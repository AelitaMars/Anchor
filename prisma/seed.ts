import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env")
  }

  // Remove any stale admin accounts, then upsert current one
  await prisma.user.deleteMany({ where: { NOT: { email } } })
  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.upsert({
    where: { email },
    update: { password: hashed },
    create: { email, password: hashed, name: "Admin" },
  })
  console.log(`✓ Admin user: ${email}`)

  // Seed clients
  const clients = [
    { id: "c1", name: "Acme Corp", email: "billing@acmecorp.com" },
    { id: "c2", name: "Globex Inc", email: "finance@globex.com" },
    { id: "c3", name: "Initech LLC", email: "accounting@initech.com" },
  ]
  for (const c of clients) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    })
  }
  console.log(`✓ Seeded ${clients.length} clients`)

  // Seed a sample service
  const parameters = JSON.stringify([
    {
      id: "p1",
      name: "Transaction Volume",
      description: "Number of monthly transactions",
      kind: "base",
      tiers: [
        { id: "t1", label: "Up to 10 transactions", value: 100 },
        { id: "t2", label: "11-50 transactions", value: 200 },
        { id: "t3", label: "50+ transactions", value: 300 },
      ],
      selectedTierId: "t1",
    },
    {
      id: "p2",
      name: "Business Locations",
      description: "Number of business locations to manage",
      kind: "additional",
      adjustmentType: "multiplier",
      tiers: [
        { id: "t4", label: "1 location", value: 1.0 },
        { id: "t5", label: "2 locations", value: 1.05 },
        { id: "t6", label: "3-5 locations", value: 1.2 },
        { id: "t7", label: "5+ locations", value: 1.5 },
      ],
      selectedTierId: "t4",
    },
    {
      id: "p3",
      name: "Reporting Frequency",
      description: "How often financial reports are delivered",
      kind: "additional",
      adjustmentType: "fixed_add",
      tiers: [
        { id: "t8", label: "Monthly", value: 0 },
        { id: "t9", label: "Weekly", value: 150 },
      ],
      selectedTierId: "t8",
    },
  ])

  await prisma.service.upsert({
    where: { id: "svc-1" },
    update: {},
    create: {
      id: "svc-1",
      name: "Monthly Bookkeeping",
      description:
        "Full-service bookkeeping including reconciliation, categorization, and financial statements.",
      billingOccurrence: "monthly",
      pricingType: "dynamic",
      parameters,
      billingTrigger: "Automatic, on proposal acceptance",
    },
  })
  console.log("✓ Seeded sample service")

  // Seed pricing template
  await prisma.pricingTemplate.upsert({
    where: { id: "tmpl-1" },
    update: {},
    create: {
      id: "tmpl-1",
      name: "Bookkeeping Standard",
      description:
        "Standard bookkeeping pricing with volume, locations, and reporting frequency",
      parameters,
    },
  })
  console.log("✓ Seeded pricing template")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
