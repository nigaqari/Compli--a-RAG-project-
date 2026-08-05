import { ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between pb-6 mb-8 border-b border-border">
      <div>
        <h1 className="text-[40px] font-bold tracking-tight text-[var(--text-primary)] leading-tight">{title}</h1>
        {description && <p className="text-[16px] text-[var(--text-secondary)] mt-2">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
