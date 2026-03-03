"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Copy, Check } from "lucide-react"

function CopyableCredential({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[13px] bg-white/10 text-white px-2 py-0.5 rounded">
      {value}
      <button onClick={copy} className="opacity-60 hover:opacity-100 transition-opacity ml-0.5">
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
    </span>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? "Login failed")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--anchor-bg)] p-4">
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-center lg:items-stretch">

        {/* ── Left panel: reviewer instructions ── */}
        <div className="w-full lg:flex-1 rounded-2xl bg-[var(--anchor-purple-dark)] text-white p-8 flex flex-col justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-white/10 shrink-0">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2L4 8V24L16 30L28 24V8L16 2Z" fill="#ffffff" opacity="0.3" />
                <path d="M16 10L12 12V20L16 22L20 20V12L16 10Z" fill="#ffffff" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">Anchor</span>
          </div>

          {/* Intro */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-2">
              Take-home assignment
            </p>
            <h2 className="text-2xl font-bold leading-snug mb-3">
              Welcome, Anchor team!
            </h2>
            <p className="text-white/70 text-sm leading-relaxed">
              This is a lean prototype built around the core flow you asked me to explore:{" "}
              <span className="text-white font-semibold">Dynamic Pricing</span>. A few things to
              know before you dive in:
            </p>
          </div>

          {/* Steps */}
          <ol className="space-y-5 text-sm">
            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-white/15 text-xs font-bold shrink-0 mt-0.5">1</span>
              <div>
                <p className="font-semibold text-white mb-1.5">Login credentials</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="w-16 shrink-0">Email</span>
                    <CopyableCredential value="split.artichoke@gmail.com" />
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="w-16 shrink-0">Password</span>
                    <CopyableCredential value="NUli@@2312" />
                  </div>
                </div>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-white/15 text-xs font-bold shrink-0 mt-0.5">2</span>
              <div className="text-white/70 leading-relaxed">
                <span className="text-white font-semibold">Sending a proposal — </span>
                when creating one, address it to{" "}
                <span className="font-mono text-white/90">split.artichoke@gmail.com</span>.
                The client is already in the system; feel free to delete and recreate it if you
                want to test the full flow from scratch.
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-white/15 text-xs font-bold shrink-0 mt-0.5">3</span>
              <div className="text-white/70 leading-relaxed">
                <span className="text-white font-semibold">Reviewing the proposal — </span>
                open the Gmail inbox for{" "}
                <span className="font-mono text-white/90">split.artichoke@gmail.com</span> and
                sign the proposal from there. The Gmail password is the same as the one above.
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex items-center justify-center h-6 w-6 rounded-full bg-white/15 text-xs font-bold shrink-0 mt-0.5">4</span>
              <div className="text-white/70 leading-relaxed">
                <span className="text-white font-semibold">No need to memorise any of this — </span>
                these instructions are also available inside the app at the bottom of the
                left-hand navigation panel, in the collapsible{" "}
                <span className="text-white font-semibold">Reviewer&apos;s Guide</span>.
              </div>
            </li>
          </ol>

          <p className="text-xs text-white/30">Anchor · Dynamic Pricing prototype</p>
        </div>

        {/* ── Right panel: login form ── */}
        <div className="w-full lg:w-[340px] shrink-0 flex flex-col justify-center">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Sign in</CardTitle>
              <CardDescription>Enter your credentials to access the prototype</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[var(--anchor-purple)] hover:bg-[var(--anchor-purple-dark)] text-white"
                  disabled={loading}
                >
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
