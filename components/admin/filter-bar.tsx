import type { ReactNode } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function FilterBar({
  search,
  onSearch,
  searchPlaceholder = 'Search…',
  children,
}: {
  search?: string
  onSearch?: (value: string) => void
  searchPlaceholder?: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {onSearch ? (
        <div className="relative w-full max-w-md">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa7a2]" />
          <Input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 border-[#e5eae7] bg-white pl-10 shadow-[0_1px_2px_rgba(36,62,57,0.03)]"
          />
        </div>
      ) : <div />}
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  )
}

export function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 appearance-none rounded-xl border border-[#e5eae7] bg-white py-2 pl-3 pr-9 text-xs font-bold text-[#526861] shadow-[0_1px_2px_rgba(36,62,57,0.03)] outline-none transition focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8b9994]" />
    </div>
  )
}

export function AdminButton({
  children,
  href,
  onClick,
  variant = 'secondary',
  disabled = false,
}: {
  children: ReactNode
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}) {
  const className = `${variant === 'primary'
    ? 'inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white transition hover:bg-[#294f48]'
    : 'inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe7e3] bg-white px-4 text-xs font-bold text-[#638076] shadow-[0_1px_2px_rgba(36,62,57,0.03)] transition hover:border-[#c8dbd4] hover:bg-[#f7fbf9]'} disabled:cursor-not-allowed disabled:opacity-60`

  if (href) {
    return <a href={href} className={className} aria-disabled={disabled}>{children}</a>
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  )
}
