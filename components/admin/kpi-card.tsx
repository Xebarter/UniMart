import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'

export function KpiCard({
  label,
  value,
  change,
  hint,
  icon: Icon,
  accent = 'green',
}: {
  label: string
  value: string
  change?: number
  hint?: string
  icon: LucideIcon
  accent?: 'green' | 'coral' | 'slate' | 'amber'
}) {
  const down = typeof change === 'number' && change < 0
  const accentStyles = {
    green: 'from-[#eef6f3] to-white text-[#315e55] ring-[#d4e8e0]',
    coral: 'from-[#fff5f0] to-white text-[#d1734b] ring-[#f5ddd0]',
    slate: 'from-[#f3f6f5] to-white text-[#526861] ring-[#e2e9e5]',
    amber: 'from-[#fff9ed] to-white text-[#b8860b] ring-[#f0e4c8]',
  }[accent]

  return (
    <div className="group relative overflow-hidden rounded-[22px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(36,62,57,0.08)]">
      <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-gradient-to-br from-[#eef6f3]/90 to-transparent opacity-80" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">{label}</p>
          <p className="mt-3 font-display text-[1.85rem] font-bold leading-none tracking-[-0.04em] text-[#243e39]">{value}</p>
        </div>
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ring-1 ${accentStyles}`}>
          <Icon size={18} strokeWidth={2} />
        </span>
      </div>
      {typeof change === 'number' ? (
        <div className="relative mt-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${down ? 'bg-[#fff0ea] text-[#c86c48]' : 'bg-[#edf6f1] text-[#3d7a62]'}`}>
            {down ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="text-[10px] font-medium text-[#a5afab]">{hint ?? 'vs previous period'}</span>
        </div>
      ) : hint ? (
        <p className="relative mt-4 text-[11px] font-medium text-[#8b9994]">{hint}</p>
      ) : null}
    </div>
  )
}
