import { cn } from "@/lib/utils"

type RiskLevel = "High" | "Medium" | "Low" | "Compliant"

const CONFIG: Record<RiskLevel, { bg: string; text: string; label: string }> = {
  High:      { bg: "var(--risk-high)",   text: "#fff", label: "High Risk" },
  Medium:    { bg: "var(--risk-medium)", text: "#fff", label: "Medium Risk" },
  Low:       { bg: "var(--risk-low)",    text: "#fff", label: "Low Risk" },
  Compliant: { bg: "var(--risk-low)",    text: "#fff", label: "Compliant" },
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { bg, text, label } = CONFIG[level]
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  )
}
