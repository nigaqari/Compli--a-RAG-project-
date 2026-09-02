import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 mb-4 sm:mb-8 border-b border-border w-full">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl md:text-[36px] font-bold tracking-tight text-[var(--text-primary)] leading-tight break-words">{title}</h1>
        {description && <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 sm:mt-2 break-words">{description}</p>}
      </div>
      {action && <div className="shrink-0 self-start sm:self-auto">{action}</div>}
    </div>
  )
}
