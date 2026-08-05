import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function DocumentViewerPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader 
        title="Vendor_Agreement_Acme.pdf" 
        action={
          <div className="flex gap-2">
            <Link href="/chat" className={buttonVariants({ variant: "outline" })}>Ask Juris</Link>
            <Link href={`/analysis/${params.id}`} className={buttonVariants({ variant: "default" })}>Run Analysis</Link>
          </div>
        } 
      />
      
      <div className="flex gap-6 flex-1 overflow-hidden">
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="py-3 bg-surface-alt border-b shrink-0">
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full p-6 text-sm leading-relaxed text-muted-foreground">
              [Mock PDF content would be rendered here]
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...
            </ScrollArea>
          </CardContent>
        </Card>
        
        <div className="w-[350px] flex flex-col gap-4 overflow-auto shrink-0">
          <Card>
            <CardHeader className="py-3 bg-surface-alt border-b">
              <CardTitle className="text-sm">Document Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-medium">Jane Doe</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Upload Date</span><span className="font-medium">2026-08-01</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">Contract</span></div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3 bg-surface-alt border-b">
              <CardTitle className="text-sm">Detected Clauses</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-wrap gap-2">
              <Badge variant="outline">Termination</Badge>
              <Badge variant="outline">Liability</Badge>
              <Badge variant="outline">Confidentiality</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
