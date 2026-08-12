"use client"

import { useEffect, useState, use } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RiskBadge } from "@/components/shared/risk-badge"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { analysisApi, AnalysisOut, AnalysisStatus } from "@/lib/api/analysis"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, FolderOpen, ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id

  const [status, setStatus] = useState<AnalysisStatus | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isPlaceholder = !id || id === "placeholder"

  const fetchStatus = async () => {
    if (isPlaceholder) {
      setLoading(false)
      return
    }

    try {
      const currentStatus = await analysisApi.getAnalysisStatus(id)
      setStatus(currentStatus)

      if (currentStatus.status === "completed") {
        const data = await analysisApi.getLatestAnalysis(id)
        setAnalysis(data)
        setLoading(false)
      } else if (currentStatus.status === "failed") {
        setLoading(false)
      } else if (currentStatus.status === "analyzing" || currentStatus.status === "pending") {
        setTimeout(fetchStatus, 3000)
      } else {
        // none
        setLoading(false)
      }
    } catch (e: any) {
      console.error(e)
      setErrorMessage(e.response?.data?.detail || e.message || "Failed to load document analysis")
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [id])

  const handleRunAnalysis = async () => {
    if (isPlaceholder) return
    setLoading(true)
    setErrorMessage(null)
    try {
      await analysisApi.triggerAnalysis(id)
      setTimeout(fetchStatus, 1000)
    } catch (e: any) {
      console.error(e)
      const msg = e.response?.data?.detail || e.message || "Failed to trigger analysis"
      setErrorMessage(msg)
      setLoading(false)
    }
  }

  if (isPlaceholder) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8 border border-dashed rounded-xl">
        <FolderOpen className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Select a Document to Analyze</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Please select a contract or document from your Document Library to view or run AI analysis.
        </p>
        <Link href="/documents" className={buttonVariants({ variant: "default" })}>
          Go to Document Library
        </Link>
      </div>
    )
  }

  if (loading && (!status || status.status === "analyzing" || status.status === "pending")) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
        <h2 className="text-xl font-semibold">Analyzing document...</h2>
        <p className="text-muted-foreground mt-2">This may take a minute.</p>
      </div>
    )
  }

  if (errorMessage && !analysis) {
    return (
      <div className="p-6">
        <Link href="/documents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Document Library
        </Link>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col items-start gap-4">
            <p>{errorMessage}</p>
            <Link href="/documents" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Select Another Document
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (status?.status === "none" || !status) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold mb-4">No Analysis Found</h2>
        <p className="text-muted-foreground mb-6">This document has not been analyzed yet.</p>
        {errorMessage && (
          <p className="text-sm text-destructive mb-4">{errorMessage}</p>
        )}
        <Button onClick={handleRunAnalysis}>Run AI Analysis</Button>
      </div>
    )
  }

  if (status?.status === "failed") {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis Failed</AlertTitle>
          <AlertDescription className="mt-2 flex flex-col items-start gap-4">
            <p>{status.error || "An unknown error occurred during analysis."}</p>
            <Button variant="outline" onClick={handleRunAnalysis}>Retry Analysis</Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!analysis) return null

  return (
    <div>
      <PageHeader 
        title="Document Analysis" 
        action={
          <div className="flex items-center gap-3">
            <Link
              href="/reports"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <FileText className="h-4 w-4 mr-1.5 text-[var(--brand-red)]" />
              Generate Report
            </Link>
            {analysis.compliance_score !== null && (
              <div className="text-right pl-3 border-l">
                <div className="text-xs text-muted-foreground">Compliance Score</div>
                <div className="text-xl font-bold text-[var(--risk-medium)]">{analysis.compliance_score}%</div>
              </div>
            )}
          </div>
        } 
      />
      
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="compliance">Clauses</TabsTrigger>
          <TabsTrigger value="risks">Risks</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {analysis.executive_summary || "No summary available."}
              </p>
            </CardContent>
          </Card>

          {analysis.key_parties && analysis.key_parties.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Key Parties</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.key_parties.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-semibold">{p.name}</span>
                      <span className="text-muted-foreground">- {p.role}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="compliance">
          <div className="grid gap-4">
            {analysis.clauses.map(clause => (
              <Card key={clause.id} className={clause.found ? "" : "opacity-60"}>
                <CardHeader className="py-3 bg-surface-alt/50 border-b flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-semibold capitalize">{clause.category.replace(/_/g, ' ')}</CardTitle>
                  <Badge variant={clause.found ? "default" : "outline"}>
                    {clause.found ? "Present" : "Not Found"}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4">
                  {clause.found ? (
                    <>
                      <p className="text-sm text-muted-foreground mb-4">{clause.summary_text}</p>
                      {clause.page_number && (
                        <Link 
                          href={`/documents/${analysis.document_id}#page=${clause.page_number}`}
                          className="text-sm text-[var(--brand-red)] hover:underline"
                        >
                          View in document (Page {clause.page_number})
                        </Link>
                      )}
                    </>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">Clause not found in the document.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="risks">
          <div className="grid gap-4">
            {analysis.risks.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No risks identified in this document.</p>
            )}
            {analysis.risks.map(risk => (
              <Card key={risk.id} className={risk.severity === "high" ? "border-[var(--risk-high)]/50" : ""}>
                <CardHeader className={`${risk.severity === "high" ? "bg-[var(--risk-high)]/5" : "bg-surface-alt/50"} flex flex-row items-center justify-between pb-4 border-b`}>
                  <CardTitle className="text-base font-semibold">{risk.title}</CardTitle>
                  <RiskBadge level={risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1) as 'High' | 'Medium' | 'Low'} />
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground mb-4">{risk.rationale}</p>
                  {risk.page_number && (
                    <Link 
                      href={`/documents/${analysis.document_id}#page=${risk.page_number}`}
                      className="text-sm text-[var(--brand-red)] hover:underline"
                    >
                      View related clause (Page {risk.page_number})
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="grid gap-4">
            {analysis.recommendations.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No recommendations generated.</p>
            )}
            {analysis.recommendations.map(rec => {
              const relatedRisk = analysis.risks.find(r => r.id === rec.related_risk_id)
              return (
                <Card key={rec.id}>
                  <CardContent className="p-6">
                    <p className="text-sm mb-4 leading-relaxed">{rec.text}</p>
                    {relatedRisk && (
                      <div className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold bg-surface-alt text-muted-foreground">
                        Mitigates: {relatedRisk.title}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
