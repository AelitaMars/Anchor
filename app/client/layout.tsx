export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--anchor-bg)]">
      {children}
    </div>
  )
}
