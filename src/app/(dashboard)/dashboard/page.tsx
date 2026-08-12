"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ShieldAlert, CheckCircle, Activity, Loader2 } from "lucide-react"
import { dashboardApi, DashboardStats, RiskBreakdown, ActivityTrend, RecentAnalysis } from "@/lib/api/dashboard"
import { RiskBadge } from "@/components/shared/risk-badge"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<RecentAnalysis[]>([])
  // We can add Recharts for risk breakdown and activity trend here, but we will keep it simple for now or use basic bars
  
  useEffect(() => {
    async function loadData() {
      try {
        const [s, r] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getRecentAnalyses(5)
        ])
        setStats(s)
        setRecent(r)
      } catch (e) {
        console.error("Failed to load dashboard data", e)
      }
    }
    loadData()
  }, [])

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
        <h2 className="text-xl font-semibold">Loading dashboard...</h2>
      </div>
    )
  }

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        description="Monitor contracts, compliance and risks across your organization."
      />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[52px] font-bold leading-none text-blue-600 dark:text-blue-500 tracking-tight">{stats.total_documents}</div>
              <FileText className="h-8 w-8 text-blue-600/80 dark:text-blue-500/80" />
            </div>
            <div className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Total Documents</div>
            <p className="text-[14px] text-[var(--text-secondary)] font-medium">
              In library
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[52px] font-bold leading-none text-amber-600 dark:text-amber-500 tracking-tight">{stats.pending_reviews}</div>
              <Activity className="h-8 w-8 text-amber-600/80 dark:text-amber-500/80" />
            </div>
            <div className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Pending Reviews</div>
            <p className="text-[14px] text-[var(--text-secondary)] font-medium">
              Awaiting analysis
            </p>
          </CardContent>
        </Card>

        <Card className="border-[var(--risk-high)]/20 bg-[var(--risk-high)]/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[52px] font-bold leading-none text-[var(--risk-high)] tracking-tight">{stats.open_risks}</div>
              <ShieldAlert className="h-8 w-8 text-[var(--risk-high)]/80" />
            </div>
            <div className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Open Risks</div>
            <p className="text-[14px] text-[var(--risk-high)] font-semibold">
              {stats.high_risks} High Severity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[52px] font-bold leading-none text-[var(--success)] tracking-tight">{stats.avg_compliance_score ?? "--"}%</div>
              <CheckCircle className="h-8 w-8 text-[var(--success)]/80" />
            </div>
            <div className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Avg Compliance</div>
            <p className="text-[14px] text-[var(--success)] font-semibold">
              Across analyzed docs
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-[18px]">Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
               <p className="text-muted-foreground py-8 text-center border border-dashed rounded-md">No recent analyses found.</p>
            ) : (
              <div className="space-y-4">
                {recent.map((a) => (
                  <div key={a.analysis_id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium">{a.document_name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(a.completed_at || "").toLocaleDateString()} · {a.risk_count} risks identified
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {a.top_risk_severity && <RiskBadge level={a.top_risk_severity.charAt(0).toUpperCase() + a.top_risk_severity.slice(1) as 'High' | 'Medium' | 'Low'} />}
                      <Link href={`/analysis/${a.document_id}`} className="text-sm text-[var(--brand-red)] hover:underline font-medium">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-[18px]">Risk Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col justify-center gap-6 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">High Severity</span>
              <span className="text-sm font-bold text-[var(--risk-high)]">{stats.high_risks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Medium Severity</span>
              <span className="text-sm font-bold text-[var(--risk-medium)]">{stats.medium_risks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Low Severity</span>
              <span className="text-sm font-bold text-[var(--risk-low)]">{stats.low_risks}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
