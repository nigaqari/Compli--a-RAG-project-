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
  Settings,
  Menu,
  X
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
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col bg-[var(--sidebar-bg)] text-[var(--text-secondary)]">
      <div className="flex h-16 items-center border-b border-[var(--border)] px-4 shrink-0 justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo_compli.jpg" alt="Compli Logo" width={32} height={32} className="rounded-md shrink-0" />
          {(!collapsed || mobileOpen) && <span className="font-bold text-lg tracking-tight text-[var(--sidebar-text-active)]">Compli</span>}
        </div>
        <button
          className="hidden lg:flex items-center justify-center rounded-md p-1.5 hover:bg-[var(--sidebar-item-hover)] text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-active)] transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navGroups.map((group, i) => (
          <div key={i} className="px-1">
            {(!collapsed || mobileOpen) && (
              <h4 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--sidebar-text)]/70">
                {group.label}
              </h4>
            )}
            <nav className="space-y-1">
              {group.links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + "/")
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                      active
                        ? "bg-[var(--sidebar-item-active)] text-[var(--brand-red)] border-l-[3px] border-[var(--brand-red)]"
                        : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--sidebar-text-active)] border-l-[3px] border-transparent",
                      collapsed && !mobileOpen ? "justify-center px-0" : ""
                    )}
                    title={collapsed && !mobileOpen ? link.label : undefined}
                  >
                    <link.icon className={cn("h-5 w-5 shrink-0", (!collapsed || mobileOpen) && "mr-3")} />
                    {(!collapsed || mobileOpen) && <span>{link.label}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>
      <div className="mt-auto border-t border-[var(--border)] p-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-150",
            pathname === "/settings"
              ? "bg-[var(--sidebar-item-active)] text-[var(--brand-red)] border-l-[3px] border-[var(--brand-red)]"
              : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--sidebar-text-active)] border-l-[3px] border-transparent",
            collapsed && !mobileOpen ? "justify-center px-0" : ""
          )}
          title={collapsed && !mobileOpen ? "Settings" : undefined}
        >
          <Settings className={cn("h-5 w-5 shrink-0", (!collapsed || mobileOpen) && "mr-3")} />
          {(!collapsed || mobileOpen) && <span>Settings</span>}
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
        className={cn("hidden lg:flex lg:flex-col shrink-0 transition-all duration-300 h-screen sticky top-0 border-r border-[var(--border)]", collapsed ? "w-[64px]" : "w-[240px]", className)}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
