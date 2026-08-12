"use client"

import { useEffect, useState, useMemo } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { complianceApi, UnifiedRisk } from "@/lib/api/compliance"
import {
  Loader2, AlertTriangle, ShieldAlert, ShieldCheck, ShieldOff,
  FileText, Scale, Bot, BookMarked, ChevronRight, MapPin
} from "lucide-react"

const severityConfig = {
  high: {
    label: "High",
    badgeClass: "bg-[var(--risk-high)]/10 text-[var(--risk-high)] border-[var(--risk-high)]/30",
    dotClass: "bg-[var(--risk-high)]",
    cardBorder: "border-l-[var(--risk-high)]",
  },
  medium: {
    label: "Medium",
    badgeClass: "bg-[var(--risk-medium)]/10 text-[var(--risk-medium)] border-[var(--risk-medium)]/30",
    dotClass: "bg-[var(--risk-medium)]",
    cardBorder: "border-l-[var(--risk-medium)]",
  },
  low: {
    label: "Low",
    badgeClass: "bg-[var(--risk-low)]/10 text-[var(--risk-low)] border-[var(--risk-low)]/30",
    dotClass: "bg-[var(--risk-low)]",
    cardBorder: "border-l-[var(--risk-low)]",
  },
}

const sourceConfig = {
  document_risk: {
    label: "AI Risk",
    icon: <Bot className="h-3.5 w-3.5" />,
    class: "border-indigo-500/30 text-indigo-500 bg-indigo-500/5",
  },
  compliance_gap: {
    label: "Compliance Gap",
    icon: <Scale className="h-3.5 w-3.5" />,
    class: "border-amber-500/30 text-amber-500 bg-amber-500/5",
  },
}

function StatCard({ severity, count, icon }: { severity: string; count: number; icon: React.ReactNode }) {
  const cfg = severityConfig[severity as keyof typeof severityConfig]
  return (
    <Card className={`border-l-4 ${cfg.cardBorder}`}>
      <CardContent className="p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">{cfg.label} Risk</p>
          <p className="text-4xl font-bold tracking-tight">{count}</p>
        </div>
        <div className="opacity-60">{icon}</div>
      </CardContent>
    </Card>
  )
}

export default function RiskCenterPage() {
  const [risks, setRisks] = useState<UnifiedRisk[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRisk, setSelectedRisk] = useState<UnifiedRisk | null>(null)

  // Filters
  const [severityFilter, setSeverityFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [documentFilter, setDocumentFilter] = useState("all")

  useEffect(() => {
    async function fetchRisks() {
      try {
        const data = await complianceApi.getRiskCenter()
        setRisks(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchRisks()
  }, [])

  const documentOptions = useMemo(() => {
    const seen = new Set<string>()
    const options: { id: string; name: string }[] = []
    for (const r of risks) {
      if (!seen.has(r.document_id)) {
        seen.add(r.document_id)
        options.push({ id: r.document_id, name: r.document_name })
      }
    }
    return options
  }, [risks])

  const filtered = useMemo(() => risks.filter(r => {
    if (severityFilter !== "all" && r.severity !== severityFilter) return false
    if (sourceFilter !== "all" && r.source_type !== sourceFilter) return false
    if (documentFilter !== "all" && r.document_id !== documentFilter) return false
    return true
  }), [risks, severityFilter, sourceFilter, documentFilter])

  const highCount = risks.filter(r => r.severity === "high").length
  const medCount = risks.filter(r => r.severity === "medium").length
  const lowCount = risks.filter(r => r.severity === "low").length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)] mb-4" />
        <p className="text-[var(--text-secondary)]">Loading risk data...</p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Risk Center"
        description="Unified view of AI-identified document risks and compliance gaps across all your contracts."
      />

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <StatCard severity="high" count={highCount} icon={<ShieldOff className="h-10 w-10 text-[var(--risk-high)]" />} />
        <StatCard severity="medium" count={medCount} icon={<ShieldAlert className="h-10 w-10 text-[var(--risk-medium)]" />} />
        <StatCard severity="low" count={lowCount} icon={<ShieldCheck className="h-10 w-10 text-[var(--risk-low)]" />} />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v ?? 'all')}>
          <SelectTrigger id="severity-filter" className="w-[160px]">
            <SelectValue placeholder="All Severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v ?? 'all')}>
          <SelectTrigger id="source-filter" className="w-[190px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="document_risk">Document Risks (AI)</SelectItem>
            <SelectItem value="compliance_gap">Compliance Gaps</SelectItem>
          </SelectContent>
        </Select>

        {documentOptions.length > 0 && (
          <Select value={documentFilter} onValueChange={(v) => setDocumentFilter(v ?? 'all')}>
            <SelectTrigger id="document-filter" className="w-[220px]">
              <SelectValue placeholder="All Documents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              {documentOptions.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(severityFilter !== "all" || sourceFilter !== "all" || documentFilter !== "all") && (
          <button
            onClick={() => { setSeverityFilter("all"); setSourceFilter("all"); setDocumentFilter("all") }}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 transition-colors underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto text-sm text-[var(--text-secondary)] self-center">
          {filtered.length} of {risks.length} items
        </span>
      </div>

      {/* Risk List */}
      {risks.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[30vh] border border-dashed rounded-xl text-center p-8">
          <ShieldCheck className="h-12 w-12 mb-4 opacity-30" />
          <h3 className="text-lg font-semibold mb-1">No risks found</h3>
          <p className="text-sm text-[var(--text-secondary)]">Run document analysis or compliance checks to populate this view.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-secondary)] border border-dashed rounded-xl">
          <p className="font-medium">No items match your filters.</p>
          <button
            onClick={() => { setSeverityFilter("all"); setSourceFilter("all"); setDocumentFilter("all") }}
            className="text-sm mt-2 text-[var(--brand-red)] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(risk => {
            const sev = severityConfig[risk.severity]
            const src = sourceConfig[risk.source_type]
            return (
              <div
                key={risk.id}
                id={`risk-item-${risk.id}`}
                className={`group border border-l-4 ${sev.cardBorder} rounded-xl p-4 bg-[var(--surface)] hover:bg-[var(--surface-hover)] cursor-pointer transition-all hover:shadow-sm`}
                onClick={() => setSelectedRisk(risk)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="outline" className={`text-xs ${sev.badgeClass}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${sev.dotClass} mr-1.5`} />
                        {sev.label}
                      </Badge>
                      <Badge variant="outline" className={`text-xs flex items-center gap-1 ${src.class}`}>
                        {src.icon}
                        {src.label}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-1 leading-snug">{risk.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{risk.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {risk.document_name}
                      </span>
                      {risk.policy_name && (
                        <span className="flex items-center gap-1">
                          <BookMarked className="h-3 w-3" />
                          {risk.policy_name}
                        </span>
                      )}
                      {risk.page_number && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Page {risk.page_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Risk Detail Sheet */}
      <Sheet open={!!selectedRisk} onOpenChange={(o) => !o && setSelectedRisk(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedRisk && (() => {
            const sev = severityConfig[selectedRisk.severity]
            const src = sourceConfig[selectedRisk.source_type]
            return (
              <>
                <SheetHeader className="mb-6">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant="outline" className={`${sev.badgeClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${sev.dotClass} mr-1.5`} />
                      {sev.label} Risk
                    </Badge>
                    <Badge variant="outline" className={`flex items-center gap-1 ${src.class}`}>
                      {src.icon} {src.label}
                    </Badge>
                  </div>
                  <SheetTitle className="text-xl leading-snug">{selectedRisk.title}</SheetTitle>
                </SheetHeader>

                <div className="space-y-5">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-2">Description</h4>
                    <p className="text-sm leading-relaxed text-[var(--text-primary)]">{selectedRisk.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-border">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Document
                      </p>
                      <p className="text-sm font-medium">{selectedRisk.document_name}</p>
                    </div>
                    {selectedRisk.policy_name && (
                      <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-border">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <BookMarked className="h-3 w-3" /> Policy
                        </p>
                        <p className="text-sm font-medium">{selectedRisk.policy_name}</p>
                      </div>
                    )}
                    {selectedRisk.page_number && (
                      <div className="p-3 rounded-lg bg-[var(--surface-hover)] border border-border">
                        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Location
                        </p>
                        <p className="text-sm font-medium">Page {selectedRisk.page_number}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <a
                      href={`/documents/${selectedRisk.document_id}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand-red)] hover:underline"
                    >
                      <FileText className="h-4 w-4" /> View Source Document
                    </a>
                  </div>
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}
