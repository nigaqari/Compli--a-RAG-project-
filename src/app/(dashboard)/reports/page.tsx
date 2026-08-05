import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { FileText } from "lucide-react"

export default function ReportsPage() {
  return (
    <div>
      <PageHeader 
        title="Reports" 
        action={<Button>Generate New Report</Button>} 
      />
      <EmptyState 
        icon={<FileText className="h-6 w-6" />}
        title="No reports generated"
        description="Generate your first compliance or risk summary report."
        action={<Button variant="outline">Create Report</Button>}
      />
    </div>
  )
}
