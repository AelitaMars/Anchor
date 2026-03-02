import { AnchorSidebar } from "@/components/anchor-sidebar"
import { AnchorTopBar } from "@/components/anchor-topbar"
import { AppProvider } from "@/lib/data-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppProvider>
      <div className="flex min-h-screen bg-[var(--anchor-bg)]">
        <AnchorSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <AnchorTopBar />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </AppProvider>
  )
}
