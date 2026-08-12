"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  FolderOpen, 
  ShieldCheck, 
  AlertTriangle, 
  MessageSquare, 
  FileText, 
  ClipboardList, 
  Settings,
  Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import Image from "next/image"

const navGroups = [
  {
    label: "Overview",
    links: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Documents",
    links: [
      { href: "/documents", label: "Document Library", icon: FolderOpen },
      { href: "/policies", label: "Policy Library", icon: FileText },
      { href: "/upload", label: "Upload", icon: FolderOpen },
    ],
  },
  {
    label: "Intelligence",
    links: [
      { href: "/chat", label: "AI Chat", icon: MessageSquare },
      { href: "/analysis", label: "Document Analysis", icon: FileText },
    ],
  },
  {
    label: "Governance",
    links: [
      { href: "/compliance", label: "Compliance Center", icon: ShieldCheck },
      { href: "/risk", label: "Risk Center", icon: AlertTriangle },
      { href: "/audit-logs", label: "Audit Logs", icon: ClipboardList },
    ],
  },
  {
    label: "Output",
    links: [{ href: "/reports", label: "Reports", icon: FileText }],
  },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-[var(--sidebar-bg)] text-[var(--text-secondary)]">
      <div className="flex h-16 items-center border-b border-[var(--border)] px-4 shrink-0">
        <Image src="/logo_compli.jpg" alt="Compli Logo" width={36} height={36} className="rounded-md" />
        {!collapsed && <span className="ml-2 font-bold text-xl tracking-tight text-[var(--sidebar-text-active)]">Compli</span>}
        <button
          className="ml-auto hidden lg:flex items-center justify-center rounded-md p-1.5 hover:bg-[var(--sidebar-item-hover)] text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)] transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto py-4">
        {navGroups.map((group, i) => (
          <div key={i} className="mb-8 px-3">
            {!collapsed && (
              <h4 className="mb-3 px-4 text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--sidebar-text)]/70">
                {group.label}
              </h4>
            )}
            <nav className="space-y-0.5">
              {group.links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + "/")
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center rounded-md px-3 py-3 text-[16px] font-semibold transition-all duration-150",
                      active
                        ? "bg-[var(--sidebar-item-active)] text-[var(--brand-red)] border-l-[3px] border-[var(--brand-red)]"
                        : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--sidebar-text-active)] border-l-[3px] border-transparent",
                      collapsed ? "justify-center px-0" : ""
                    )}
                    title={collapsed ? link.label : undefined}
                  >
                    <link.icon className={cn("h-[22px] w-[22px] shrink-0", !collapsed && "mr-3")} />
                    {!collapsed && <span>{link.label}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>
      <div className="mt-auto border-t border-[var(--border)] p-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center rounded-md px-3 py-3 text-[16px] font-semibold transition-all duration-150",
            pathname === "/settings"
              ? "bg-[var(--sidebar-item-active)] text-[var(--brand-red)] border-l-[3px] border-[var(--brand-red)]"
              : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--sidebar-text-active)] border-l-[3px] border-transparent",
            collapsed ? "justify-center px-0" : ""
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className={cn("h-[22px] w-[22px] shrink-0", !collapsed && "mr-3")} />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </div>
  )

  return (
    <>
      <aside
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
        className={cn("hidden lg:flex lg:flex-col shrink-0 transition-all duration-300 h-screen sticky top-0", collapsed ? "w-[64px]" : "w-[240px]", className)}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <Sheet>
        <SheetTrigger className="lg:hidden fixed top-3 left-4 z-40 inline-flex shrink-0 items-center justify-center rounded-lg h-9 w-9 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]">
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[240px] border-r-0" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
