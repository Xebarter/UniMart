import type { LucideIcon } from 'lucide-react'

export function InsightTile({
  label,
  value,
  hint,
  icon: Icon,
  active,
  accent = 'green',
  onClick,
}: {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  active?: boolean
  accent?: 'green' | 'coral' | 'slate' | 'amber'
  onClick: () => void
}) {
  const iconTone = {
    green: 'from-[#eef6f3] to-white text-[#315e55] ring-[#d4e8e0]',
    coral: 'from-[#fff5f0] to-white text-[#d1734b] ring-[#f5ddd0]',
    slate: 'from-[#f3f6f5] to-white text-[#526861] ring-[#e2e9e5]',
    amber: 'from-[#fff9ed] to-white text-[#b8860b] ring-[#f0e4c8]',
  }[accent]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[22px] border p-4 text-left shadow-[0_10px_32px_rgba(36,62,57,0.04)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(36,62,57,0.08)] ${
        active
          ? 'border-[#8bb4a7] bg-white ring-2 ring-[#dcebe6]'
          : 'border-[#e5eae7] bg-white'
      }`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-gradient-to-br from-[#eef6f3]/90 to-transparent" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">{label}</p>
          <p className="mt-2 font-display text-[1.65rem] font-bold leading-none tracking-[-0.04em] text-[#243e39]">{value}</p>
          <p className="mt-2 text-[11px] font-medium text-[#8b9994]">{hint}</p>
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br ring-1 ${iconTone}`}>
          <Icon size={17} strokeWidth={2} />
        </span>
      </div>
    </button>
  )
}
