import { PageHeader } from "@/components/shared/page-header"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockDocuments } from "@/lib/mock-data/documents"
import { RiskBadge } from "@/components/shared/risk-badge"
import { StatusBadge } from "@/components/shared/status-badge"

export default function DocumentLibraryPage() {
  return (
    <div>
      <PageHeader 
        title="Document Library" 
        action={<Link href="/upload" className={buttonVariants({ variant: "default" })}>Upload Document</Link>} 
      />
      
      <div className="border rounded-md bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Size</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">{doc.name}</TableCell>
                <TableCell>{doc.type}</TableCell>
                <TableCell>{doc.owner.name}</TableCell>
                <TableCell>{doc.uploadDate}</TableCell>
                <TableCell><StatusBadge status={doc.status} /></TableCell>
                <TableCell><RiskBadge level={doc.riskLevel} /></TableCell>
                <TableCell>{doc.size}</TableCell>
                <TableCell><Link href={`/documents/${doc.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>View</Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
