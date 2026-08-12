"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { complianceApi, ComplianceResult } from "@/lib/api/compliance"
import { Loader2, AlertCircle, FileText, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

export default function ComplianceCenterPage() {
  const [results, setResults] = useState<ComplianceResult[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchResults() {
      try {
        const r = await complianceApi.getAllResults()
        setResults(r)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
        <h2 className="text-xl font-semibold">Loading compliance results...</h2>
      </div>
    )
  }

  const completed = results.filter(r => r.status === 'completed')
  const avgScore = completed.length > 0 
    ? Math.round(completed.reduce((acc, r) => acc + (r.compliance_score || 0), 0) / completed.length) 
    : 0

  const totalFindings = completed.reduce((acc, r) => acc + (r.findings?.length || 0), 0)

  return (
    <div>
      <PageHeader 
        title="Compliance Center" 
        description="Monitor contract compliance against organizational policies."
      />
      
      <div className="grid gap-6 md:grid-cols-3 mb-10">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[52px] font-bold leading-none text-[var(--success)] tracking-tight">{avgScore}%</div>
              <CheckCircle className="h-8 w-8 text-[var(--success)]/80" />
            </div>
            <div className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Avg Compliance Score</div>
            <p className="text-[14px] text-[var(--text-secondary)] font-medium">Across evaluated documents</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[52px] font-bold leading-none text-blue-600 dark:text-blue-500 tracking-tight">{results.length}</div>
              <FileText className="h-8 w-8 text-blue-600/80 dark:text-blue-500/80" />
            </div>
            <div className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Documents Evaluated</div>
            <p className="text-[14px] text-[var(--text-secondary)] font-medium">Against policies</p>
          </CardContent>
        </Card>

        <Card className="border-[var(--risk-high)]/20 bg-[var(--risk-high)]/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[52px] font-bold leading-none text-[var(--risk-high)] tracking-tight">{totalFindings}</div>
              <AlertCircle className="h-8 w-8 text-[var(--risk-high)]/80" />
            </div>
            <div className="text-[18px] font-semibold text-[var(--text-primary)] mb-1">Open Gaps</div>
            <p className="text-[14px] text-[var(--risk-high)] font-semibold">Missing or conflicting clauses</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Compliance Checks</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-md">
              <FileText className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>No compliance checks run yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Findings</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant="outline" className={r.status === 'completed' ? 'border-[var(--success)] text-[var(--success)]' : ''}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{r.compliance_score ?? '--'}%</TableCell>
                    <TableCell className="font-semibold">{r.risk_score ?? '--'}%</TableCell>
                    <TableCell>{r.findings?.length || 0}</TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {/* TODO: Create a proper result detail page or modal if we had time. For now just link to doc analysis page */}
                      <Link href={`/analysis/${r.document_id}`} className="text-sm font-medium text-[var(--brand-red)] hover:underline">
                        View Document
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
