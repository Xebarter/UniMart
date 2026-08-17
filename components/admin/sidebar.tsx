'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BrandLogo } from '@/components/brand-logo'
import { useOperator } from '@/components/admin/operator-context'
import { adminNav, adminPaths, isAdminNavActive } from '@/lib/admin/paths'
import { colorFromSeed, initials } from '@/lib/format'

const navSections: { label: string; items: typeof adminNav }[] = [
  {
    label: 'Command',
    items: adminNav.filter((item) => item.href === adminPaths.home),
  },
  {
    label: 'Operations',
    items: adminNav.filter((item) =>
      ['/admin/users', '/admin/listings', '/admin/shops', '/admin/payments'].includes(item.href),
    ),
  },
  {
    label: 'Trust & safety',
    items: adminNav.filter((item) =>
      ['/admin/reports', '/admin/messages'].includes(item.href),
    ),
  },
  {
    label: 'Content',
    items: adminNav.filter((item) => item.href === adminPaths.articles),
  },
  {
    label: 'Insights',
    items: adminNav.filter((item) =>
      ['/admin/analytics', '/admin/activity'].includes(item.href),
    ),
  },
]

export function AdminSidebar({
  variant = 'desktop',
  onNavigate,
}: {
  variant?: 'desktop' | 'mobile'
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const operator = useOperator()

  const itemClass = (active: boolean) =>
    `group flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left text-[13px] font-medium transition-all duration-200 ${
      active
        ? 'bg-white/[0.12] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
        : 'text-[#b8ccc6] hover:bg-white/[0.06] hover:text-white'
    }`
  const iconWrap = (active: boolean) =>
    `flex size-8 shrink-0 items-center justify-center rounded-[11px] transition ${
      active ? 'bg-[#d1734b]/25 text-[#f3c8ad]' : 'bg-white/[0.06] text-[#9db5ae] group-hover:bg-white/10 group-hover:text-white'
    }`

  return (
    <aside
      className={
        variant === 'mobile'
          ? 'relative flex h-full w-full shrink-0 flex-col overflow-y-auto px-4 py-6'
          : 'relative sticky top-0 hidden h-svh w-[260px] shrink-0 self-start flex-col overflow-y-auto border-r border-white/5 px-4 py-6 lg:flex'
      }
      style={{ background: 'linear-gradient(180deg, #1a3c36 0%, #142e2a 48%, #102824 100%)' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(241,198,170,0.14),transparent_46%)]" />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Link href={adminPaths.home} onClick={onNavigate} className={`mb-6 flex items-center gap-2.5 px-1.5 text-left ${variant === 'mobile' ? 'pr-11' : ''}`}>
          <BrandLogo size={36} />
          <span className="font-display text-[1.35rem] font-bold tracking-[-0.045em] text-white">
            Uni<span className="text-[#f0b696]">Mart</span>
          </span>
        </Link>
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">Operator console</p>
          <p className="mt-1 text-[11px] leading-5 text-[#9ab5ae]">Campus marketplace administration</p>
        </div>
        <div className="space-y-5">
          {navSections.map((section) => {
            const items = section.items.filter((item) => !item.adminOnly || operator.canManageRoles)
            if (!items.length) return null
            return (
              <div key={section.label}>
                <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7d9a93]">{section.label}</p>
                <nav className="space-y-1">
                  {items.map((item) => {
                    const active = isAdminNavActive(pathname, item)
                    const Icon = item.icon
                    return (
                      <Link key={item.href} href={item.href} onClick={onNavigate} className={itemClass(active)}>
                        <span className={iconWrap(active)}><Icon size={16} strokeWidth={1.9} /></span>
                        <span>{item.label}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            )
          })}
          {operator.canManageRoles ? (
            <div>
              <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7d9a93]">System</p>
              <nav className="space-y-1">
                {adminNav.filter((item) => item.href === adminPaths.settings).map((item) => {
                  const active = isAdminNavActive(pathname, item)
                  const Icon = item.icon
                  return (
                    <Link key={item.href} href={item.href} onClick={onNavigate} className={itemClass(active)}>
                      <span className={iconWrap(active)}><Icon size={16} strokeWidth={1.9} /></span>
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          ) : null}
        </div>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#31574e]"
              style={{ background: colorFromSeed(operator.id) }}
            >
              {initials(operator.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-white">{operator.name}</p>
              <p className="truncate text-[10px] capitalize text-[#89a59c]">{operator.role} operator</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
