import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden" style={{ backgroundColor: 'var(--background)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 w-full">
        <Topbar />
        <main className="flex-1 p-3 sm:p-6 w-full max-w-full overflow-x-hidden" style={{ color: 'var(--text-primary)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
