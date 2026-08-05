import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, ShieldAlert, CheckCircle, Activity } from "lucide-react"

export default function DashboardPage() {
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
              <div className="text-[52px] font-bold leading-none text-blue-600 dark:text-blue-500 tracking-tight">128</div>
              <FileText className="h-8 w-8 text-blue-600/80 dark:text-blue-500/80" />
            </div>
            <div className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Total Documents</div>
            <p className="text-[14px] text-[var(--text-secondary)] font-medium">
              +12 from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[52px] font-bold leading-none text-amber-600 dark:text-amber-500 tracking-tight">14</div>
              <Activity className="h-8 w-8 text-amber-600/80 dark:text-amber-500/80" />
            </div>
            <div className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Pending Reviews</div>
            <p className="text-[14px] text-[var(--text-secondary)] font-medium">
              5 require immediate action
            </p>
          </CardContent>
        </Card>

        <Card className="border-[var(--risk-high)]/20 bg-[var(--risk-high)]/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[52px] font-bold leading-none text-[var(--risk-high)] tracking-tight">7</div>
              <ShieldAlert className="h-8 w-8 text-[var(--risk-high)]/80" />
            </div>
            <div className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Open Risks</div>
            <p className="text-[14px] text-[var(--risk-high)] font-semibold">
              3 High Severity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[52px] font-bold leading-none text-[var(--success)] tracking-tight">92%</div>
              <CheckCircle className="h-8 w-8 text-[var(--success)]/80" />
            </div>
            <div className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Compliance Score</div>
            <p className="text-[14px] text-[var(--success)] font-semibold">
              +2% since last audit
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-[18px]">Documents Reviewed Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-surface-alt/20 rounded-md m-6 mt-0 border border-dashed">
            <span className="text-muted-foreground">Chart Area (Recharts)</span>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-[18px]">Risk Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center bg-surface-alt/20 rounded-md m-6 mt-0 border border-dashed">
            <span className="text-muted-foreground">Pie Chart (Recharts)</span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
