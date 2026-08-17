'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { useOperator } from '@/components/admin/operator-context'
import { adminNav, isAdminNavActive } from '@/lib/admin/paths'
import { signOutUniMart } from '@/lib/auth-session'
import { colorFromSeed, initials } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'

export function AdminTopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname()
  const operator = useOperator()
  const [signingOut, setSigningOut] = useState(false)
  const activeItem = adminNav.find((item) => isAdminNavActive(pathname, item))

  async function handleSignOut() {
    setSigningOut(true)
    await signOutUniMart()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#e5eae7]/80 bg-[#fbfcfb]/88 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:h-[72px]">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onOpenMenu} className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e5eae7] bg-white text-[#526861] shadow-[0_1px_2px_rgba(36,62,57,0.04)] lg:hidden" aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Admin console</p>
            <p className="truncate font-display text-sm font-bold tracking-[-0.02em] text-[#243e39] sm:text-base">
              {activeItem?.label ?? 'Overview'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href={marketPaths.home}
            className="hidden items-center gap-1.5 rounded-xl border border-[#dfe7e3] bg-white px-3 py-2 text-xs font-bold text-[#638076] shadow-[0_1px_2px_rgba(36,62,57,0.03)] transition hover:bg-[#f1f6f3] sm:inline-flex"
          >
            <ExternalLink size={14} />
            Marketplace
          </Link>
          <span className="hidden rounded-full bg-[#edf4f0] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#315e55] md:inline">
            {operator.role}
          </span>
          <span
            className="hidden size-9 items-center justify-center rounded-full text-[11px] font-bold text-[#31574e] sm:flex"
            style={{ background: colorFromSeed(operator.id) }}
            aria-hidden
          >
            {initials(operator.name)}
          </span>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => { void handleSignOut() }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe7e3] bg-white px-3 py-2 text-xs font-bold text-[#638076] shadow-[0_1px_2px_rgba(36,62,57,0.03)] transition hover:bg-[#f1f6f3] disabled:opacity-60"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">{signingOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
