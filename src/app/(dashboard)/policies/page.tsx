import { PageHeader } from "@/components/shared/page-header"
import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function PolicyLibraryPage() {
  return (
    <div>
      <PageHeader 
        title="Policy Library" 
        action={<Link href="/upload" className={buttonVariants({ variant: "default" })}>Upload Policy</Link>} 
      />
      <div className="border rounded-md bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Linked Documents</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Data_Privacy_2026.pdf</TableCell>
              <TableCell><Badge variant="outline">Data Privacy</Badge></TableCell>
              <TableCell>2026-08-01</TableCell>
              <TableCell>45</TableCell>
              <TableCell><span className={buttonVariants({ variant: "ghost", size: "sm" })}>View</span></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
