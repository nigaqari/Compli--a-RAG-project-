import { PageHeader } from "@/components/shared/page-header"
import { Card } from "@/components/ui/card"
import { UploadCloud } from "lucide-react"

export default function UploadPage() {
  return (
    <div>
      <PageHeader title="Upload Documents" />
      <Card className="border-dashed border-2 p-12 flex flex-col items-center justify-center hover:border-brand-red transition-colors cursor-pointer bg-surface-alt/50">
        <UploadCloud className="h-12 w-12 text-ink-muted mb-4" />
        <h3 className="text-lg font-semibold">Drag & drop files here</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">PDF only, max 25MB</p>
        <span className="text-brand-red font-medium text-sm">Or click to browse</span>
      </Card>
    </div>
  )
}
