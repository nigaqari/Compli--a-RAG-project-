"use client"

import { useEffect, useState, useCallback } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { complianceApi, ComplianceResult, ComplianceFinding, ComplianceSuggestion } from "@/lib/api/compliance"
import { policiesApi, Policy } from "@/lib/api/policies"
import { documentsApi } from "@/lib/api/documents"
import {
  Loader2, AlertCircle, FileText, CheckCircle, Play, XCircle,
  Clock, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, ShieldCheck
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

// ── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (score: number | undefined) => {
  if (score === undefined || score === null) return "text-muted-foreground"
  if (score >= 75) return "text-[var(--success)]"
  if (score >= 50) return "text-amber-500"
  return "text-[var(--risk-high)]"
}

const statusBadge = (status: string) => {
  switch (status) {
    case "completed":  return <Badge variant="outline" className="border-[var(--success)] text-[var(--success)] flex items-center gap-1"><CheckCircle className="h-3 w-3"/>Completed</Badge>
    case "comparing":  return <Badge variant="outline" className="border-amber-500 text-amber-500 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/>Comparing</Badge>
    case "pending":    return <Badge variant="outline" className="border-blue-500 text-blue-500 flex items-center gap-1"><Clock className="h-3 w-3"/>Pending</Badge>
    case "failed":     return <Badge variant="outline" className="border-[var(--risk-high)] text-[var(--risk-high)] flex items-center gap-1"><XCircle className="h-3 w-3"/>Failed</Badge>
    default:           return <Badge variant="outline">{status}</Badge>
  }
}

const severityBadge = (severity: string) => {
  const map: Record<string, string> = {
    high: "bg-[var(--risk-high)]/10 text-[var(--risk-high)] border-[var(--risk-high)]/30",
    medium: "bg-[var(--risk-medium)]/10 text-[var(--risk-medium)] border-[var(--risk-medium)]/30",
    low: "bg-[var(--risk-low)]/10 text-[var(--risk-low)] border-[var(--risk-low)]/30",
  }
  return <Badge variant="outline" className={`text-xs capitalize ${map[severity] ?? ""}`}>{severity}</Badge>
}

const findingTypeLabel: Record<string, string> = {
  missing_clause: "Missing Clause",
  weak_clause: "Weak Clause",
  conflicting_clause: "Conflicting Clause",
  policy_violation: "Policy Violation",
}

// ── Finding Detail Card ───────────────────────────────────────────────────────

function FindingCard({ finding }: { finding: ComplianceFinding }) {
  return (
    <div className="p-3 border rounded-lg bg-[var(--surface-hover)] space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="secondary" className="text-xs">{finding.category.replace(/_/g, " ")}</Badge>
        {severityBadge(finding.severity)}
        {finding.page_number && (
          <span className="text-xs text-muted-foreground">Page {finding.page_number}</span>
        )}
      </div>
      <p className="text-sm leading-relaxed">{finding.description}</p>
    </div>
  )
}

// ── Result Detail Accordion ───────────────────────────────────────────────────

function ResultDetail({ result }: { result: ComplianceResult }) {
  const findingsByType = {
    missing_clause:    result.findings.filter(f => f.finding_type === "missing_clause"),
    weak_clause:       result.findings.filter(f => f.finding_type === "weak_clause"),
    conflicting_clause:result.findings.filter(f => f.finding_type === "conflicting_clause"),
    policy_violation:  result.findings.filter(f => f.finding_type === "policy_violation"),
  }

  if (result.status !== "completed") {
    return (
      <div className="py-4 text-center text-sm text-muted-foreground">
        {result.status === "failed"
          ? <span className="text-[var(--risk-high)]">Check failed: {result.error || "Unknown error"}</span>
          : "Compliance check is still in progress..."}
      </div>
    )
  }

  if (result.findings.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-[var(--success)] flex items-center justify-center gap-2">
        <CheckCircle className="h-4 w-4" /> No findings — contract is fully compliant with this policy.
      </div>
    )
  }

  const typeTabs = (Object.entries(findingsByType) as [string, ComplianceFinding[]][]).filter(([, arr]) => arr.length > 0)

  return (
    <div className="pt-2 pb-1 space-y-4">
      <Tabs defaultValue={typeTabs[0]?.[0]} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {typeTabs.map(([type, arr]) => (
            <TabsTrigger key={type} value={type} className="text-xs flex items-center gap-1">
              {findingTypeLabel[type]}
              <span className="ml-1 text-[10px] bg-[var(--surface-hover)] rounded-full px-1.5 py-0.5">{arr.length}</span>
            </TabsTrigger>
          ))}
          {result.suggestions.length > 0 && (
            <TabsTrigger value="suggestions" className="text-xs flex items-center gap-1">
              <Lightbulb className="h-3 w-3" /> Suggestions
              <span className="ml-1 text-[10px] bg-[var(--surface-hover)] rounded-full px-1.5 py-0.5">{result.suggestions.length}</span>
            </TabsTrigger>
          )}
        </TabsList>

        {typeTabs.map(([type, findings]) => (
          <TabsContent key={type} value={type} className="mt-3 space-y-2">
            {findings.map(f => <FindingCard key={f.id} finding={f} />)}
          </TabsContent>
        ))}

        {result.suggestions.length > 0 && (
          <TabsContent value="suggestions" className="mt-3 space-y-2">
            {result.suggestions.map(s => (
              <div key={s.id} className="p-3 border rounded-lg bg-[var(--surface-hover)] flex gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm">{s.text}</p>
              </div>
            ))}
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ComplianceCenterPage() {
  const [results, setResults] = useState<ComplianceResult[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Run Check Dialog
  const [runDialogOpen, setRunDialogOpen] = useState(false)
  const [documents, setDocuments] = useState<{ id: string; name: string }[]>([])
  const [selectedDocId, setSelectedDocId] = useState("")
  const [selectedPolicyId, setSelectedPolicyId] = useState("")
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [r, p] = await Promise.all([
        complianceApi.getAllResults(),
        policiesApi.getPolicies()
      ])
      setResults(r)
      setPolicies(p)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Load document and policy list when dialog opens
  const openRunDialog = async () => {
    setRunDialogOpen(true)
    setSelectedDocId("")
    setSelectedPolicyId("")
    setRunError(null)
    setLoadingDocs(true)
    try {
      const [docs, pols] = await Promise.all([
        documentsApi.getDocuments(),
        policiesApi.getPolicies()
      ])
      setDocuments(
        docs
          .filter(d => d.document_type !== "policy")
          .map(d => ({ id: d.id, name: d.original_name || d.filename }))
      )
      setPolicies(pols)
    } catch {
      setDocuments([])
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleRunCheck = async () => {
    if (!selectedDocId || !selectedPolicyId) return
    setRunning(true)
    setRunError(null)
    try {
      await complianceApi.triggerCheck(selectedDocId, selectedPolicyId)
      setRunDialogOpen(false)
      // Poll briefly then refresh
      setTimeout(async () => {
        await fetchAll()
      }, 2000)
    } catch (e: any) {
      let msg = "Failed to start compliance check"
      try { msg = JSON.parse(e.message)?.detail || e.message || msg } catch {}
      setRunError(msg)
    } finally {
      setRunning(false)
    }
  }

  // Enrich result with policy name
  const policyMap = Object.fromEntries(policies.map(p => [p.id, p.name]))

  const completed = results.filter(r => r.status === "completed")
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((acc, r) => acc + (r.compliance_score || 0), 0) / completed.length)
    : 0
  const totalFindings = completed.reduce((acc, r) => acc + (r.findings?.length || 0), 0)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
        <p className="text-[var(--text-secondary)]">Loading compliance results...</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Compliance Center"
        description="Compare contracts against your organization's policies and track gaps."
        action={
          <Button
            id="run-compliance-check-btn"
            className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white"
            onClick={openRunDialog}
          >
            <Play className="h-4 w-4 mr-2" /> Run Compliance Check
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-10">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`text-[52px] font-bold leading-none tracking-tight ${scoreColor(avgScore)}`}>{avgScore}%</div>
              <CheckCircle className="h-8 w-8 text-[var(--success)]/80" />
            </div>
            <div className="text-[18px] font-semibold mb-1">Avg Compliance Score</div>
            <p className="text-[14px] text-[var(--text-secondary)] font-medium">Across evaluated documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[52px] font-bold leading-none text-blue-600 dark:text-blue-500 tracking-tight">{results.length}</div>
              <FileText className="h-8 w-8 text-blue-600/80 dark:text-blue-500/80" />
            </div>
            <div className="text-[18px] font-semibold mb-1">Checks Run</div>
            <p className="text-[14px] text-[var(--text-secondary)] font-medium">Across all policies</p>
          </CardContent>
        </Card>

        <Card className="border-[var(--risk-high)]/20 bg-[var(--risk-high)]/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-[52px] font-bold leading-none text-[var(--risk-high)] tracking-tight">{totalFindings}</div>
              <AlertCircle className="h-8 w-8 text-[var(--risk-high)]/80" />
            </div>
            <div className="text-[18px] font-semibold mb-1">Open Gaps</div>
            <p className="text-[14px] text-[var(--risk-high)] font-semibold">Missing or conflicting clauses</p>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Compliance Checks</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-14 text-muted-foreground border border-dashed rounded-xl">
              <ShieldCheck className="mx-auto h-10 w-10 mb-3 opacity-30 text-[var(--brand-red)]" />
              <p className="font-medium mb-1">No compliance checks run yet.</p>
              <p className="text-sm mb-4">Click "Run Compliance Check" to compare a contract against an uploaded policy.</p>
              <Button
                id="run-compliance-check-empty-btn"
                size="sm"
                className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white"
                onClick={openRunDialog}
              >
                <Play className="h-4 w-4 mr-2" /> Run First Check
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {results.map(r => (
                <div key={r.id} className="border rounded-xl overflow-hidden">
                  {/* Row */}
                  <div
                    className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {statusBadge(r.status)}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          Doc: <span className="font-mono text-xs text-muted-foreground">{r.document_id.slice(0, 8)}…</span>
                          {" vs "}
                          <span className="text-[var(--text-primary)]">{policyMap[r.policy_id] || `Policy ${r.policy_id.slice(0, 8)}…`}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {r.status === "completed" && (
                        <>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Compliance</p>
                            <p className={`text-sm font-bold ${scoreColor(r.compliance_score)}`}>{r.compliance_score?.toFixed(0) ?? "--"}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Risk</p>
                            <p className={`text-sm font-bold ${scoreColor(r.risk_score)}`}>{r.risk_score?.toFixed(0) ?? "--"}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Findings</p>
                            <p className="text-sm font-bold">{r.findings.length}</p>
                          </div>
                        </>
                      )}
                      {expandedId === r.id
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      }
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {expandedId === r.id && (
                    <div className="border-t px-4 pb-4 bg-[var(--surface-hover)]/30">
                      <ResultDetail result={r} />
                      <div className="pt-3 border-t mt-3">
                        <Link
                          href={`/documents/${r.document_id}`}
                          className="text-xs text-[var(--brand-red)] hover:underline"
                        >
                          → View source document
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Run Compliance Check Dialog */}
      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Run Compliance Check</DialogTitle>
            <DialogDescription>
              Select a contract and a policy from your library to compare them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Document Select */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Contract / Agreement</label>
              {loadingDocs ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading documents...
                </div>
              ) : (
                <Select value={selectedDocId} onValueChange={(v) => setSelectedDocId(v ?? '')}>
                  <SelectTrigger id="compliance-doc-select">
                    <SelectValue placeholder="Select a contract or agreement…" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.length === 0
                      ? <SelectItem value="_empty" disabled>No documents available in library</SelectItem>
                      : documents.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Policy Select */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Compliance Policy</label>
              <Select value={selectedPolicyId} onValueChange={(v) => setSelectedPolicyId(v ?? '')}>
                <SelectTrigger id="compliance-policy-select">
                  <SelectValue placeholder="Select an organization policy…" />
                </SelectTrigger>
                <SelectContent>
                  {policies.length === 0
                    ? <SelectItem value="_empty" disabled>No policies uploaded yet</SelectItem>
                    : policies.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} <span className="text-muted-foreground ml-1 text-xs">(v{p.current_version})</span>
                        </SelectItem>
                      ))
                  }
                </SelectContent>
              </Select>
              {policies.length === 0 && (
                <p className="text-xs text-amber-500 mt-1.5">
                  You haven't uploaded any policies yet. <Link href="/policies" className="underline font-semibold">Upload a policy in Policy Library</Link>.
                </p>
              )}
            </div>

            {runError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--risk-high)]/10 border border-[var(--risk-high)]/20">
                <AlertTriangle className="h-4 w-4 text-[var(--risk-high)] shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--risk-high)]">{runError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRunDialogOpen(false)} disabled={running}>Cancel</Button>
            <Button
              id="compliance-run-submit"
              className="bg-[var(--brand-red)] hover:bg-[var(--brand-red)]/90 text-white"
              onClick={handleRunCheck}
              disabled={!selectedDocId || !selectedPolicyId || running}
            >
              {running ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting...</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Run Check</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
