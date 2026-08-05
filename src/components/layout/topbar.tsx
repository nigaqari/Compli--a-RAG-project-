"use client"

import { usePathname } from "next/navigation"
import { Search, Bell } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const routeMap: Record<string, string> = {
  "dashboard": "Dashboard",
  "documents": "Document Library",
  "policies": "Policy Library",
  "upload": "Upload",
  "chat": "AI Chat",
  "analysis": "Analysis",
  "compliance": "Compliance Center",
  "risk": "Risk Center",
  "reports": "Reports",
  "audit-logs": "Audit Logs",
  "settings": "Settings",
}

export function Topbar() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

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
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-3.5 h-[18px] w-[18px]" style={{ color: 'var(--text-secondary)' }} />
          <Input
            type="search"
            placeholder="Search documents..."
            className="w-[260px] h-11 pl-10 text-[16px] border rounded-lg focus-visible:ring-1 focus-visible:ring-[var(--brand-red)]"
            style={{ 
              backgroundColor: 'var(--surface)', 
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        <ThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--surface-hover)]">
            <Bell className="h-[1.1rem] w-[1.1rem]" style={{ color: 'var(--text-secondary)' }} />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full p-0 text-[10px] text-white" style={{ backgroundColor: 'var(--brand-red)' }}>
              3
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <DropdownMenuLabel style={{ color: 'var(--text-primary)' }}>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem style={{ color: 'var(--text-secondary)' }}>New risk detected in NDA</DropdownMenuItem>
            <DropdownMenuItem style={{ color: 'var(--text-secondary)' }}>Compliance report ready</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full inline-flex items-center justify-center hover:ring-2 hover:ring-[var(--brand-red)] transition-all">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold text-white" style={{ backgroundColor: 'var(--brand-red)' }}>JD</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Jane Doe</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>jane.doe@example.com</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem style={{ color: 'var(--text-secondary)' }}>Profile</DropdownMenuItem>
            <DropdownMenuItem style={{ color: 'var(--text-secondary)' }}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem style={{ color: 'var(--brand-red)' }}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
