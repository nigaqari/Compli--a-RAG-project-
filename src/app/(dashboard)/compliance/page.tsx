import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ComplianceCenterPage() {
  return (
    <div>
      <PageHeader title="Compliance Center" />
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card><CardHeader><CardTitle className="text-sm">Overall Score</CardTitle></CardHeader><CardContent className="text-2xl font-bold">87%</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Documents Evaluated</CardTitle></CardHeader><CardContent className="text-2xl font-bold">142</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Open Gaps</CardTitle></CardHeader><CardContent className="text-2xl font-bold">23</CardContent></Card>
      </div>
      <Card className="p-12 text-center text-muted-foreground border-dashed bg-surface-alt/20">
        Compliance Table (Coming Soon)
      </Card>
    </div>
  )
}
