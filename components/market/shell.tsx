'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { AuthPrompt } from '@/components/auth-prompt'
import { RestrictedAccount } from '@/components/admin/restricted-account'
import { AppSidebar, navItems } from '@/components/market/sidebar'
import { MobileTabSwipe } from '@/components/market/mobile-tab-swipe'
import { TopBar } from '@/components/market/top-bar'
import { useMarket } from '@/components/market/provider'
import { viewFromPath } from '@/lib/market-paths'

export function MarketShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const view = viewFromPath(pathname)
  const { profile, setupNeeded, toast, authOpen, closeAuth, finishAuth, requestPost } = useMarket()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [menuOpen])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-[#fbfcfb] text-[#29463f]">
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileTabSwipe disabled={menuOpen || authOpen}>
            <TopBar onOpenMenu={() => setMenuOpen(true)} />
            {setupNeeded && (
              <div className="mx-auto max-w-[1180px] px-4 pt-4 sm:px-8 lg:px-10">
                <div className="rounded-2xl border border-[#f0c7b3] bg-[#fff5f0] px-4 py-3 text-sm text-[#9a4f32]">
                  The database still needs its schema. Open the Supabase SQL editor and run <code className="font-bold">scripts/001_schema.sql</code>, then refresh this page.
                </div>
              </div>
            )}
            {profile?.account_status === 'suspended' || profile?.account_status === 'banned' ? (
              <RestrictedAccount status={profile.account_status} />
            ) : (
              <div className="pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
                {children}
              </div>
            )}
          </MobileTabSwipe>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="drawer-overlay absolute inset-0 bg-[#0c1c19]/55 backdrop-blur-[6px]" />
          <div className="drawer-panel relative flex h-full w-[min(304px,88vw)] flex-col overflow-hidden rounded-r-[28px] shadow-[24px_0_80px_rgba(8,24,20,0.45)]">
            <AppSidebar variant="mobile" onNavigate={() => setMenuOpen(false)} />
            <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="absolute right-3.5 top-5 flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/85 backdrop-blur-md transition hover:bg-white/16">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[#e5eae7] bg-white/95 px-1 pt-1.5 font-sans backdrop-blur-md lg:hidden" style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))' }}>
        {navItems.map(({ id, href, label, icon: Icon, intent }) => {
          const active = view === id
          const className = `flex min-w-0 flex-1 appearance-none flex-col items-center gap-0.5 bg-transparent font-sans text-[10px] font-bold leading-none ${active ? 'text-[#315e55]' : 'text-[#9aa7a2]'}`
          const icon = (
            <span className={`flex size-8 items-center justify-center rounded-xl ${active ? 'bg-[#e7f0ed]' : ''}`}>
              <Icon size={18} strokeWidth={1.9} />
            </span>
          )
          if (intent && !profile) {
            return (
              <button key={id} type="button" onClick={requestPost} className={className}>
                {icon}
                <span className="font-sans text-[10px] font-bold leading-none">{label}</span>
              </button>
            )
          }
          return (
            <Link key={id} href={href} className={className}>
              {icon}
              <span className="font-sans text-[10px] font-bold leading-none">{label}</span>
            </Link>
          )
        })}
      </nav>

      {toast && <div className="fixed bottom-24 left-1/2 z-40 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl bg-[#29463f] px-4 py-3 text-xs font-semibold text-white shadow-xl lg:bottom-6">{toast}</div>}
      <AuthPrompt open={authOpen} onClose={closeAuth} onSuccess={finishAuth} />
    </div>
  )
}
