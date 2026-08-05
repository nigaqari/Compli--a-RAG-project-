import { ReactNode } from "react"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed bg-surface-alt/50">
      <div className="mb-4 text-ink-muted bg-surface p-4 rounded-full shadow-sm">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">{description}</p>
      {action}
    </div>
  )
}
