import { PageHeader } from "@/components/shared/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RiskBadge } from "@/components/shared/risk-badge"

export default function AnalysisPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <PageHeader 
        title="Analysis: Vendor_Agreement_Acme.pdf" 
        action={<div className="text-right"><div className="text-sm text-muted-foreground mb-1">Compliance Score</div><div className="text-2xl font-bold text-[var(--risk-medium)]">72%</div></div>} 
      />
      
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
          <Card>
            <CardHeader><CardTitle>AI Summary by Juris</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                This vendor agreement lacks a standard limitation of liability clause required by the corporate policy. It also contains an auto-renewal provision that flags as medium risk.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="risks">
          <Card className="border-[var(--risk-high)]/50">
            <CardHeader className="bg-[var(--risk-high)]/5 flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base font-semibold">Missing Limitation of Liability</CardTitle>
              <RiskBadge level="High" />
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground mb-4">
                The contract does not cap the vendor's liability, exposing the company to uncapped damages in the event of a breach.
              </p>
              <blockquote className="border-l-4 pl-4 text-sm italic border-muted bg-surface-alt/50 p-3 rounded-r-md">
                No matching clause found in document.
              </blockquote>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
