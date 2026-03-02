"use client"

import { Bell, HelpCircle, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AnchorTopBar() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    toast.success("Signed out")
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-sm font-medium text-foreground">
          <span className="text-base">{"📒"}</span>
          <span>Book Solid</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Help">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
        </button>
        <button className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Notifications">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--anchor-purple)] text-white text-xs font-semibold">
              AA
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-destructive">
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
