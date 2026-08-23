"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Search, Bell, FileText, BookMarked, AlertTriangle,
  Scale, FileBarChart, Loader2, ArrowRight, CheckCircle,
  Settings, LogOut, User as UserIcon
} from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem
} from "@/components/ui/command"
import { searchApi, GlobalSearchResults } from "@/lib/api/search"
import { authApi, User } from "@/lib/api/auth"
import { reportsApi, ReportItem } from "@/lib/api/reports"

const routeMap: Record<string, string> = {
  "dashboard": "Dashboard",
  "documents": "Document Library",
  "policies": "Policy Library",
  "upload": "Upload",
  "chat": "Juris AI Chat",
  "analysis": "Analysis Hub",
  "compliance": "Compliance Center",
  "risk": "Risk Center",
  "reports": "Report Center",
  "settings": "Settings",
}

export function Topbar() {
  const pathname = usePathname()
  const router = useRouter()
  const segments = pathname.split('/').filter(Boolean)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<GlobalSearchResults>({
    documents: [],
    policies: [],
    risks: [],
    clauses: [],
    reports: []
  })
  const [loading, setLoading] = useState(false)

  // Live User State
  const [user, setUser] = useState<User | null>(null)
  const [recentReports, setRecentReports] = useState<ReportItem[]>([])

  useEffect(() => {
    const u = authApi.getCurrentUser()
    if (u) {
      setUser(u)
    } else {
      authApi.getMe().then(setUser).catch(() => {})
    }

    // Load recent notifications
    reportsApi.getReports().then(r => setRecentReports(r.slice(0, 3))).catch(() => {})
  }, [])

  // Keyboard shortcut listener: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ documents: [], policies: [], risks: [], clauses: [], reports: [] })
      return
    }

    setLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const data = await searchApi.search(query)
        setResults(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timeout)
  }, [query])

  const handleSelect = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  const getUserInitials = () => {
    if (!user?.full_name) return "JD"
    const parts = user.full_name.trim().split(" ")
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const hasAnyResults = 
    results.documents.length > 0 ||
    results.policies.length > 0 ||
    results.risks.length > 0 ||
    results.clauses.length > 0 ||
    results.reports.length > 0

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-4 px-6 w-full lg:ml-0 ml-10"
      style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
    >
      <div className="flex-1 overflow-hidden">
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1
              const name = routeMap[segment] || segment
              return (
                <div key={segment} className="flex items-center gap-2">
                  <BreadcrumbItem>
                    {isLast ? (
                      <div className="flex flex-col">
                        <BreadcrumbPage className="capitalize font-bold text-[18px]" style={{ color: 'var(--text-primary)' }}>{name}</BreadcrumbPage>
                        {segment === "dashboard" && <span className="text-[12px] mt-0.5 font-medium" style={{ color: 'var(--text-secondary)' }}>Legal & Compliance Overview</span>}
                      </div>
                    ) : (
                      <BreadcrumbLink href={`/${segments.slice(0, index + 1).join('/')}`} className="capitalize text-[16px] font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
                        {name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </div>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3 ml-auto shrink-0">
        {/* Global Search Trigger */}
        <button
          onClick={() => setOpen(true)}
          className="relative flex items-center justify-between w-[240px] md:w-[280px] h-10 px-3 text-sm rounded-lg border bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text-secondary)] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Search contracts, risks...</span>
          </div>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        <ThemeToggle />

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)] cursor-pointer outline-none">
            <Bell className="h-[1.1rem] w-[1.1rem]" style={{ color: 'var(--text-secondary)' }} />
            {recentReports.length > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full p-0 text-[10px] text-white" style={{ backgroundColor: 'var(--brand-red)' }}>
                {recentReports.length}
              </Badge>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <DropdownMenuLabel className="flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
              <span>Recent Activity</span>
              <span className="text-xs font-normal text-muted-foreground">{recentReports.length} events</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recentReports.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No new notifications
              </div>
            ) : (
              recentReports.map(rep => (
                <DropdownMenuItem 
                  key={rep.id} 
                  onClick={() => router.push('/reports')}
                  className="cursor-pointer flex flex-col items-start gap-1 py-2"
                >
                  <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Report {rep.status === 'completed' ? 'Ready for Download' : 'Generating'}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate w-full">
                    {rep.document_name || 'Contract Audit'}
                  </p>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => router.push('/risk')}
              className="text-xs text-[var(--brand-red)] font-semibold cursor-pointer justify-center"
            >
              View All Risks & Gaps →
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full inline-flex items-center justify-center hover:ring-2 hover:ring-[var(--brand-red)] transition-all cursor-pointer outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold text-white" style={{ backgroundColor: 'var(--brand-red)' }}>
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.full_name || "Jane Doe"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "jane.doe@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer flex items-center gap-2"
              onClick={() => router.push('/settings')}
            >
              <UserIcon className="h-4 w-4" /> Profile Details
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer flex items-center gap-2"
              onClick={() => router.push('/settings')}
            >
              <Settings className="h-4 w-4" /> Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              style={{ color: 'var(--brand-red)' }}
              className="cursor-pointer font-medium flex items-center gap-2"
              onClick={() => authApi.logout()}
            >
              <LogOut className="h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Global Command Palette Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search contracts, clauses, policies, risks, reports..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-red)]" /> Searching...
            </div>
          )}

          {!loading && query && !hasAnyResults && (
            <CommandEmpty>No results found for &ldquo;{query}&rdquo;.</CommandEmpty>
          )}

          {!query && (
            <CommandGroup heading="Quick Navigation">
              <CommandItem onSelect={() => handleSelect("/dashboard")}>
                <ArrowRight className="h-4 w-4 mr-2" /> Go to Dashboard
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/documents")}>
                <FileText className="h-4 w-4 mr-2" /> Document Library
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/policies")}>
                <BookMarked className="h-4 w-4 mr-2" /> Policy Library
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/risk")}>
                <AlertTriangle className="h-4 w-4 mr-2" /> Risk Center
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/reports")}>
                <FileBarChart className="h-4 w-4 mr-2" /> Reports Center
              </CommandItem>
              <CommandItem onSelect={() => handleSelect("/settings")}>
                <Settings className="h-4 w-4 mr-2" /> Settings & Profile
              </CommandItem>
            </CommandGroup>
          )}

          {results.documents.length > 0 && (
            <CommandGroup heading="Documents">
              {results.documents.map((d) => (
                <CommandItem key={d.id} onSelect={() => handleSelect(d.url)} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-[var(--brand-red)] shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-sm truncate">{d.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{d.snippet}</p>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.policies.length > 0 && (
            <CommandGroup heading="Policies">
              {results.policies.map((p) => (
                <CommandItem key={p.id} onSelect={() => handleSelect(p.url)}>
                  <BookMarked className="h-4 w-4 text-blue-500 mr-2 shrink-0" />
                  <div className="truncate">
                    <p className="font-medium text-sm truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.snippet}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.risks.length > 0 && (
            <CommandGroup heading="Identified Risks">
              {results.risks.map((r) => (
                <CommandItem key={r.id} onSelect={() => handleSelect(r.url)}>
                  <AlertTriangle className="h-4 w-4 text-amber-500 mr-2 shrink-0" />
                  <div className="truncate">
                    <p className="font-medium text-sm truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.snippet}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.clauses.length > 0 && (
            <CommandGroup heading="Extracted Clauses">
              {results.clauses.map((c) => (
                <CommandItem key={c.id} onSelect={() => handleSelect(c.url)}>
                  <Scale className="h-4 w-4 text-indigo-500 mr-2 shrink-0" />
                  <div className="truncate">
                    <p className="font-medium text-sm truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.snippet}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results.reports.length > 0 && (
            <CommandGroup heading="Reports">
              {results.reports.map((rep) => (
                <CommandItem key={rep.id} onSelect={() => handleSelect(rep.url)}>
                  <FileBarChart className="h-4 w-4 text-emerald-500 mr-2 shrink-0" />
                  <div className="truncate">
                    <p className="font-medium text-sm truncate">{rep.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{rep.snippet}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </header>
  )
}
