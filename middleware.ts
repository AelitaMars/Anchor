import { NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"

const PUBLIC_PATHS = [
  "/login",
  "/client",
  "/api/auth/login",
  "/api/public",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get("auth_token")?.value
  const isApiRoute = pathname.startsWith("/api/")

  if (!token) {
    if (isApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const session = await verifyJWT(token)
  if (!session) {
    if (isApiRoute) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
