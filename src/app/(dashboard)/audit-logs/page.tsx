import { PageHeader } from "@/components/shared/page-header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockAuditLogs } from "@/lib/mock-data/audit"
import { Badge } from "@/components/ui/badge"

export default function AuditLogsPage() {
  return (
    <div>
      <PageHeader title="Audit Logs" />
      <div className="border rounded-md bg-surface overflow-hidden">
        <Table className="text-sm">
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAuditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{log.timestamp}</TableCell>
                <TableCell>{log.user.name}</TableCell>
                <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                <TableCell className="truncate max-w-[200px]">{log.target}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{log.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
