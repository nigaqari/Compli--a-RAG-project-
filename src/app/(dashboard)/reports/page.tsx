"use client"

import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { reportsApi, ReportItem, ReportType } from "@/lib/api/reports"
import { documentsApi, DocumentItem } from "@/lib/api/documents"
import {
  Loader2, Download, Plus, FileText, Trash2, CheckCircle,
  AlertCircle, Clock, Sparkles
} from "lucide-react"

const reportTypeLabels: Record<string, string> = {
  executive_summary: "Executive Summary",
  compliance: "Compliance Evaluation",
  risk_assessment: "Risk Assessment",
  complete_analysis: "Complete Analysis (Full)",
  full: "Complete Analysis (Full)",
  risk: "Risk Assessment"
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState("")
  const [selectedType, setSelectedType] = useState<ReportType>("executive_summary")
  const [generating, setGenerating] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    try {
      const data = await reportsApi.getReports()
      setReports(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
    documentsApi.getDocuments().then(setDocuments).catch(() => {})
  }, [fetchReports])

  // Polling for active reports
  useEffect(() => {
    const hasActive = reports.some(r => r.status === "pending" || r.status === "generating")
    if (!hasActive) return

    const interval = setInterval(() => {
      fetchReports()
    }, 3000)

    return () => clearInterval(interval)
  }, [reports, fetchReports])

  const handleOpenDialog = () => {
    setDialogOpen(true)
    setSelectedDocId(documents[0]?.id || "")
    setSelectedType("executive_summary")
    setDialogError(null)
  }

  const handleCreateReport = async () => {
    if (!selectedDocId) {
      setDialogError("Please select a document.")
      return
    }
    setGenerating(true)
    setDialogError(null)
    try {
      await reportsApi.createReport(selectedDocId, selectedType)
      setDialogOpen(false)
      fetchReports()
    } catch (e: any) {
      setDialogError(e.message || "Failed to start report generation")
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await reportsApi.deleteReport(id)
      setReports(prev => prev.filter(r => r.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  const renderStatus = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="border-[var(--success)] text-[var(--success)] flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Ready
          </Badge>
        )
      case "generating":
      case "pending":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Generating...
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="border-[var(--risk-high)] text-[var(--risk-high)] flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> Failed
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div>
      <PageHeader 
        title="Report Center" 
        description="Generate, review, and download audit-ready executive, risk, and compliance PDF reports."
        action={
          <Button 
            id="generate-report-btn"
            onClick={handleOpenDialog} 
            className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Generate New Report
          </Button>
        } 
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] border border-dashed rounded-xl text-center p-8">
          <FileText className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
          <h3 className="text-lg font-semibold mb-1">No reports generated yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first executive summary, compliance, or risk assessment report.</p>
          <Button onClick={handleOpenDialog} className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90">
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      ) : (
        <div className="border rounded-xl bg-[var(--surface)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Type</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((rep) => (
                <TableRow key={rep.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                  <TableCell className="font-semibold">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[var(--brand-red)]" />
                      <span>{reportTypeLabels[rep.report_type] || rep.report_type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {rep.document_name || "Document"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(rep.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {renderStatus(rep.status)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {rep.status === "completed" && (
                      <a
                        href={`/api/v1/reports/${rep.id}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white transition-colors"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download PDF
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rep.id)}
                      className="text-muted-foreground hover:text-destructive h-8 px-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Generate Report Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Audit Report</DialogTitle>
            <DialogDescription>
              Select a contract and report type to produce an executive-ready PDF report with charts and findings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Select Document</label>
              <Select value={selectedDocId} onValueChange={(v) => setSelectedDocId(v ?? '')}>
                <SelectTrigger id="report-doc-select">
                  <SelectValue placeholder="Choose document…" />
                </SelectTrigger>
                <SelectContent>
                  {documents.length === 0 ? (
                    <SelectItem value="_empty" disabled>No documents uploaded</SelectItem>
                  ) : (
                    documents.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.original_name || d.filename}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Report Type</label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType((v as ReportType) ?? 'executive_summary')}>
                <SelectTrigger id="report-type-select">
                  <SelectValue placeholder="Select report type…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive_summary">Executive Summary (Summary, Parties, Top Risks)</SelectItem>
                  <SelectItem value="compliance">Compliance Evaluation (Score Gauge & Gaps)</SelectItem>
                  <SelectItem value="risk_assessment">Risk Assessment (Donut Chart & Full Rationale)</SelectItem>
                  <SelectItem value="complete_analysis">Complete Analysis Report (Comprehensive)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dialogError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{dialogError}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={generating}>
              Cancel
            </Button>
            <Button
              id="report-submit-btn"
              onClick={handleCreateReport}
              disabled={generating || !selectedDocId}
              className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Create Report</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
