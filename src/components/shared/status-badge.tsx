import React from "react"
import { Badge } from "@/components/ui/badge"

export type DocumentStatus = "Analyzed" | "Pending" | "Flagged" | "uploaded" | "processing" | "completed" | "failed" | string

const CONFIG: Record<string, { className: string; label: string }> = {
  Analyzed:   { className: "border-[var(--success)] text-[var(--success)]", label: "Analyzed" },
  completed:  { className: "border-[var(--success)] text-[var(--success)]", label: "Completed" },
  Pending:    { className: "border-amber-500 text-amber-500", label: "Pending" },
  uploaded:   { className: "border-blue-500 text-blue-500", label: "Uploaded" },
  processing: { className: "border-amber-500 text-amber-500", label: "Processing" },
  Flagged:    { className: "border-[var(--risk-high)] text-[var(--risk-high)]", label: "Flagged" },
  failed:     { className: "border-[var(--risk-high)] text-[var(--risk-high)]", label: "Failed" },
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = CONFIG[status] || { className: "border-muted-foreground text-muted-foreground", label: status }
  return (
    <Badge
      variant="outline"
      className={`capitalize font-medium text-xs ${config.className}`}
    >
      {config.label}
    </Badge>
  )
}
