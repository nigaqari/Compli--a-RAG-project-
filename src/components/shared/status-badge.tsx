import type { DocumentStatus } from "@/lib/mock-data/documents"

const CONFIG: Record<DocumentStatus, { bg: string; text: string; border: string }> = {
  Analyzed: { bg: "transparent", text: "var(--risk-low)",    border: "var(--risk-low)" },
  Pending:  { bg: "transparent", text: "var(--risk-medium)", border: "var(--risk-medium)" },
  Flagged:  { bg: "transparent", text: "var(--risk-high)",   border: "var(--risk-high)" },
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const { bg, text, border } = CONFIG[status]
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: bg, color: text, borderColor: border }}
    >
      {status}
    </span>
  )
}
