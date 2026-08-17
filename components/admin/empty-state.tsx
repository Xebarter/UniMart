import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf4f0] text-[#315e55]">
        <Icon size={22} />
      </span>
      <h3 className="mt-4 font-display text-base font-bold text-[#29463f]">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm leading-6 text-[#8b9994]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
