import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  compact = false,
}: {
  eyebrow: string
  title: string
  description?: string
  actions?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between ${compact ? '' : 'pb-1'}`}>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d1734b]">{eyebrow}</p>
        <h1 className={`mt-2 font-display font-bold tracking-[-0.04em] text-[#243e39] ${compact ? 'text-xl' : 'text-[1.75rem] sm:text-[2rem]'}`}>{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#748780]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
