"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  ChevronDown,
  ChevronRight,
  LayoutTemplate,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Proposals",
    href: "/dashboard/proposals",
    icon: FileText,
  },
  {
    label: "Services",
    href: "/dashboard/services",
    icon: Briefcase,
    children: [
      { label: "All Services", href: "/dashboard/services" },
      { label: "Templates", href: "/dashboard/services/templates" },
    ],
  },
]

function AnchorLogo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-6">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2L4 8V24L16 30L28 24V8L16 2Z" fill="#6366f1" />
        <path d="M16 6L8 10V22L16 26L24 22V10L16 6Z" fill="#ffffff" opacity="0.3" />
        <path d="M16 10L12 12V20L16 22L20 20V12L16 10Z" fill="#ffffff" />
      </svg>
      <span className="text-lg font-semibold text-white tracking-tight">anchor</span>
    </Link>
  )
}

export function AnchorSidebar() {
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Services: true,
  })

  const toggleSection = (label: string) => {
    setOpenSections((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <aside className="flex flex-col w-[220px] min-h-screen bg-[var(--anchor-purple-dark)] text-white shrink-0">
      <AnchorLogo />

      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.children && item.children.some((c) => pathname === c.href))
          const isOpen = openSections[item.label]

          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleSection(item.label)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--anchor-purple)] text-white"
                      : "text-white/80 hover:bg-[var(--anchor-purple)] hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="ml-7 flex flex-col gap-0.5 mt-0.5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                          pathname === child.href
                            ? "bg-[var(--anchor-purple)] text-white font-medium"
                            : "text-white/70 hover:bg-[var(--anchor-purple)] hover:text-white"
                        )}
                      >
                        <LayoutTemplate className="h-3.5 w-3.5 shrink-0" />
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--anchor-purple)] text-white"
                  : "text-white/80 hover:bg-[var(--anchor-purple)] hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
