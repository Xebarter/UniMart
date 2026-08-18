'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Heart, Home, MessageCircle, Plus, Settings, Store, UserRound } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { Avatar } from '@/components/market/avatar'
import { useMarket } from '@/components/market/provider'
import { loginHref } from '@/lib/auth'
import { colorFromSeed } from '@/lib/format'
import { marketPaths, viewFromPath, type MarketView } from '@/lib/market-paths'
import type { Profile } from '@/lib/types'

export const navItems: { id: MarketView; href: string; label: string; icon: typeof Home; intent?: 'post' }[] = [
  { id: 'home', href: marketPaths.home, label: 'Home', icon: Home },
  { id: 'explore', href: marketPaths.explore, label: 'Explore', icon: Compass },
  { id: 'post', href: marketPaths.post, label: 'Post', icon: Plus, intent: 'post' },
  { id: 'profile', href: marketPaths.profile, label: 'Profile', icon: UserRound },
]

export function AppSidebar({
  variant = 'desktop',
  onNavigate,
}: {
  variant?: 'desktop' | 'mobile'
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const view = viewFromPath(pathname)
  const { profile, myShop, unreadMessages, unreadNotes, requestPost, requestShop } = useMarket()

  const itemClass = (active: boolean) =>
    `group flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left font-inherit text-[13px] font-medium transition-all duration-200 ${
      active
        ? 'bg-white/[0.12] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
        : 'text-[#b8ccc6] hover:bg-white/[0.06] hover:text-white'
    }`
  const iconWrap = (active: boolean) =>
    `flex size-8 shrink-0 items-center justify-center rounded-[11px] transition ${
      active ? 'bg-[#d1734b]/25 text-[#f3c8ad]' : 'bg-white/[0.06] text-[#9db5ae] group-hover:bg-white/10 group-hover:text-white'
    }`

  function go(intent?: 'post' | 'shop') {
    onNavigate?.()
    if (intent === 'post') requestPost()
    if (intent === 'shop') requestShop()
  }

  const shopActive = view === 'shop'

  return (
    <aside
      className={variant === 'mobile'
        ? 'relative flex h-full w-full shrink-0 flex-col overflow-y-auto px-4 py-6'
        : 'relative sticky top-0 hidden h-svh w-[252px] shrink-0 self-start flex-col overflow-y-auto border-r border-white/5 px-4 py-6 lg:flex'}
      style={{ background: 'linear-gradient(180deg, #1a3c36 0%, #142e2a 48%, #102824 100%)' }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(241,198,170,0.14),transparent_46%)]" />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Link href={marketPaths.home} onClick={onNavigate} className={`mb-8 flex items-center gap-2.5 px-1.5 text-left ${variant === 'mobile' ? 'pr-11' : ''}`}>
          <BrandLogo size={36} />
          <span className="font-display text-[1.35rem] font-bold tracking-[-0.045em] text-white">Uni<span className="text-[#f0b696]">Mart</span></span>
        </Link>
        <p className="mb-2.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7d9a93]">Workspace</p>
        <nav className="space-y-1">
          {navItems.map(({ id, href, label, icon: Icon, intent }) => (
            intent && !profile ? (
              <button key={id} type="button" onClick={() => go(intent)} className={itemClass(view === id)}>
                <span className={iconWrap(view === id)}><Icon size={16} strokeWidth={1.9} /></span>
                <span>{label}</span>
              </button>
            ) : (
              <Link key={id} href={href} onClick={onNavigate} className={itemClass(view === id)}>
                <span className={iconWrap(view === id)}><Icon size={16} strokeWidth={1.9} /></span>
                <span>{label}</span>
              </Link>
            )
          ))}
        </nav>
        <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        <p className="mb-2.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7d9a93]">Your space</p>
        <nav className="space-y-1">
          <Link href={marketPaths.shop} onClick={onNavigate} className={itemClass(shopActive)}>
            <span className={iconWrap(shopActive)}><Store size={16} strokeWidth={1.9} /></span>
            <span>{myShop ? 'My shop' : 'Shop'}</span>
          </Link>
          <Link href={marketPaths.profile} onClick={onNavigate} className={itemClass(false)}>
            <span className={iconWrap(false)}><Heart size={16} strokeWidth={1.9} /></span>
            Saved listings
          </Link>
          <Link href={marketPaths.messages} onClick={onNavigate} className={itemClass(view === 'messages')}>
            <span className={`${iconWrap(view === 'messages')} relative`}>
              <MessageCircle size={16} strokeWidth={1.9} />
              {unreadNotes > 0 && <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[#f3c8ad]" />}
            </span>
            Messages
            {unreadMessages > 0 && <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d1734b] px-1.5 text-[10px] font-bold text-white">{unreadMessages}</span>}
          </Link>
        </nav>
        <div className="mt-auto pt-8">
          <Link href={marketPaths.settings} onClick={onNavigate} className={itemClass(view === 'settings')}>
            <span className={iconWrap(view === 'settings')}><Settings size={16} strokeWidth={1.9} /></span>
            Settings
          </Link>
          <ProfileCard profile={profile} onNavigate={onNavigate} />
        </div>
      </div>
    </aside>
  )
}

function ProfileCard({ profile, onNavigate }: { profile: Profile | null; onNavigate?: () => void }) {
  const pathname = usePathname()
  if (!profile) {
    return (
      <Link href={loginHref(pathname || '/')} onClick={onNavigate} className="mt-3 flex w-full items-center justify-center rounded-2xl bg-[#d1734b] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#c26640]">
        Sign in
      </Link>
    )
  }
  return (
    <Link href={marketPaths.profile} onClick={onNavigate} className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-2.5 text-left transition hover:bg-white/[0.1]">
      <Avatar name={profile.display_name} color={colorFromSeed(profile.id)} image={profile.avatar_url} />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-white">{profile.display_name}</span>
        <span className="block truncate text-[11px] text-[#9ab5ae]">{profile.verified ? 'Verified member' : profile.campus || profile.university || 'Member'}</span>
      </span>
    </Link>
  )
}
