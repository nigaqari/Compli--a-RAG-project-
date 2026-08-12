"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  FileText, ShieldAlert, CheckCircle, Activity,
  Loader2, Upload, MessageSquare, ShieldCheck, FileBarChart,
  ArrowRight, Sparkles
} from "lucide-react"
import { dashboardApi, DashboardStats, RecentAnalysis } from "@/lib/api/dashboard"
import { RiskBadge } from "@/components/shared/risk-badge"
import Link from "next/link"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<RecentAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadData() {
      try {
        const [s, r] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentAnalyses(6)
        ])
        setStats(s)
        setRecent(r)
      } catch (e) {
        console.error("Failed to load dashboard data", e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
        <h2 className="text-xl font-semibold">Loading dashboard metrics...</h2>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Governance & Intelligence Overview" 
        description="Real-time contract analytics, risk exposure, and policy compliance monitoring."
        action={
          <Link href="/upload" className={buttonVariants({ variant: "default" })}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Contract
          </Link>
        }
      />

      {/* Quick Actions Cockpit */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link 
          href="/upload"
          className="flex items-center gap-3 p-3.5 rounded-xl border bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] transition-all group shadow-xs"
        >
          <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Upload className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground">Upload Document</div>
            <div className="text-[11px] text-muted-foreground truncate">PDF parsing & OCR</div>
          </div>
        </Link>

        <Link 
          href="/chat"
          className="flex items-center gap-3 p-3.5 rounded-xl border bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] transition-all group shadow-xs"
        >
          <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-[var(--brand-red)] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground">Juris AI Chat</div>
            <div className="text-[11px] text-muted-foreground truncate">Ask questions & RAG</div>
          </div>
        </Link>

        <Link 
          href="/compliance"
          className="flex items-center gap-3 p-3.5 rounded-xl border bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] transition-all group shadow-xs"
        >
          <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground">Compliance Check</div>
            <div className="text-[11px] text-muted-foreground truncate">Policy gap analysis</div>
          </div>
        </Link>

        <Link 
          href="/reports"
          className="flex items-center gap-3 p-3.5 rounded-xl border bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] transition-all group shadow-xs"
        >
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileBarChart className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-foreground">Report Center</div>
            <div className="text-[11px] text-muted-foreground truncate">Generate audit PDFs</div>
          </div>
        </Link>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/documents" className="block group">
          <Card className="hover:border-blue-500/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-[48px] font-bold leading-none text-blue-600 dark:text-blue-500 tracking-tight">{stats.total_documents}</div>
                <FileText className="h-8 w-8 text-blue-600/80 dark:text-blue-500/80" />
              </div>
              <div className="text-[16px] font-semibold text-foreground mb-1 flex items-center justify-between">
                <span>Total Documents</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground">In organization library</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/analysis" className="block group">
          <Card className="hover:border-amber-500/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-[48px] font-bold leading-none text-amber-600 dark:text-amber-500 tracking-tight">{stats.pending_reviews}</div>
                <Activity className="h-8 w-8 text-amber-600/80 dark:text-amber-500/80" />
              </div>
              <div className="text-[16px] font-semibold text-foreground mb-1 flex items-center justify-between">
                <span>Pending Reviews</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
              </div>
              <p className="text-xs text-muted-foreground">Awaiting full AI analysis</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/risk" className="block group">
          <Card className="border-[var(--risk-high)]/20 bg-[var(--risk-high)]/5 hover:border-[var(--risk-high)]/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-[48px] font-bold leading-none text-[var(--risk-high)] tracking-tight">{stats.open_risks}</div>
                <ShieldAlert className="h-8 w-8 text-[var(--risk-high)]/80" />
              </div>
              <div className="text-[16px] font-semibold text-foreground mb-1 flex items-center justify-between">
                <span>Open Contract Risks</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--risk-high)]" />
              </div>
              <p className="text-xs text-[var(--risk-high)] font-semibold">
                {stats.high_risks} Critical / High Severity
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/compliance" className="block group">
          <Card className="hover:border-emerald-500/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-[48px] font-bold leading-none text-emerald-600 dark:text-emerald-500 tracking-tight">
                  {stats.avg_compliance_score ?? 100}%
                </div>
                <CheckCircle className="h-8 w-8 text-emerald-600/80 dark:text-emerald-500/80" />
              </div>
              <div className="text-[16px] font-semibold text-foreground mb-1 flex items-center justify-between">
                <span>Avg Compliance Score</span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Across policy evaluated agreements
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Secondary Data Grids */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Recent Document Analyses</CardTitle>
              <CardDescription>Latest contracts reviewed and scored by Juris AI.</CardDescription>
            </div>
            <Link href="/documents" className="text-xs text-[var(--brand-red)] font-semibold hover:underline">
              View All →
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {recent.length === 0 ? (
               <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-sm">
                 No completed analyses yet. Upload a document to start.
               </div>
            ) : (
              <div className="space-y-4">
                {recent.map((a) => (
                  <div key={a.analysis_id} className="flex items-center justify-between border-b pb-3.5 last:border-0 last:pb-0">
                    <div className="min-w-0 pr-4">
                      <div className="font-semibold text-sm truncate">{a.document_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {new Date(a.completed_at || "").toLocaleDateString()} · {a.risk_count} risks identified
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {a.top_risk_severity && (
                        <RiskBadge level={a.top_risk_severity.charAt(0).toUpperCase() + a.top_risk_severity.slice(1) as 'High' | 'Medium' | 'Low'} />
                      )}
                      <Link 
                        href={`/analysis/${a.document_id}`} 
                        className="inline-flex items-center text-xs font-semibold text-[var(--brand-red)] hover:underline"
                      >
                        Details <ArrowRight className="h-3 w-3 ml-0.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Risk Distribution Breakdown */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Risk Severity Distribution</CardTitle>
            <CardDescription>Live breakdown across all processed contracts.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-4 pt-2">
            <Link href="/risk" className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center justify-between hover:bg-red-500/10 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--risk-high)]"></div>
                <span className="text-sm font-semibold text-foreground">High Severity</span>
              </div>
              <span className="text-base font-bold text-[var(--risk-high)]">{stats.high_risks}</span>
            </Link>

            <Link href="/risk" className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between hover:bg-amber-500/10 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--risk-medium)]"></div>
                <span className="text-sm font-semibold text-foreground">Medium Severity</span>
              </div>
              <span className="text-base font-bold text-[var(--risk-medium)]">{stats.medium_risks}</span>
            </Link>

            <Link href="/risk" className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between hover:bg-emerald-500/10 transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--risk-low)]"></div>
                <span className="text-sm font-semibold text-foreground">Low Severity</span>
              </div>
              <span className="text-base font-bold text-[var(--risk-low)]">{stats.low_risks}</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
