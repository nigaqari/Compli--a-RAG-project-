import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RiskCenterPage() {
  return (
    <div>
      <PageHeader title="Risk Center" />
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card className="border-[var(--risk-high)]/20"><CardHeader><CardTitle className="text-sm">High Risk</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-[var(--risk-high)]">12</CardContent></Card>
        <Card className="border-[var(--risk-medium)]/20"><CardHeader><CardTitle className="text-sm">Medium Risk</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-[var(--risk-medium)]">45</CardContent></Card>
        <Card className="border-[var(--risk-low)]/20"><CardHeader><CardTitle className="text-sm">Low Risk</CardTitle></CardHeader><CardContent className="text-2xl font-bold text-[var(--risk-low)]">89</CardContent></Card>
      </div>
      <Card className="p-12 text-center text-muted-foreground border-dashed bg-surface-alt/20">
        Risk Analysis List (Coming Soon)
      </Card>
    </div>
  )
}
