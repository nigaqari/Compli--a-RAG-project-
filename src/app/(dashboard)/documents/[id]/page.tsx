import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PDFViewer } from "@/components/shared/pdf-viewer"
import Link from "next/link"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://compli-9imp.onrender.com/api/v1"

async function fetchDoc(id: string) {
  try {
    const baseUrl = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`
    const res = await fetch(`${baseUrl}/documents/${id}`, { cache: "no-store" })
    if (res.ok) return await res.json()
  } catch {}
  return null
}

export default async function DocumentViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc = await fetchDoc(id)

  const docTitle = doc?.original_name || doc?.filename || `Document ${id}`
  const uploadDate = doc?.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : "Unknown"
  const docType = doc?.document_type ? doc.document_type.toUpperCase() : "Contract"

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader 
        title={docTitle} 
        action={
          <div className="flex gap-2">
            <Link href="/chat" className={buttonVariants({ variant: "outline" })}>Ask Juris</Link>
            <Link href={`/analysis/${id}`} className={buttonVariants({ variant: "default" })}>Run Analysis</Link>
          </div>
        } 
      />
      
      <div className="flex gap-6 flex-1 overflow-hidden">
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardHeader className="py-3 bg-surface-alt border-b shrink-0">
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <PDFViewer url={`${API_BASE}/api/v1/documents/${id}/download`} />
          </CardContent>
        </Card>
        
        <div className="w-[350px] flex flex-col gap-4 overflow-auto shrink-0">
          <Card>
            <CardHeader className="py-3 bg-surface-alt border-b">
              <CardTitle className="text-sm">Document Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono text-xs truncate max-w-[180px]">{id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Upload Date</span><span className="font-medium">{uploadDate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium">{docType}</span></div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-3 bg-surface-alt border-b">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex flex-col gap-2">
              <Link href={`/analysis/${id}`} className={buttonVariants({ variant: "default", size: "sm" })}>
                View AI Analysis
              </Link>
              <Link href="/compliance" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Check Policy Compliance
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
