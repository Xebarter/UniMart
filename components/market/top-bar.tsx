'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, ChevronDown, MapPin, Menu, Search } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { Avatar } from '@/components/market/avatar'
import { useMarket } from '@/components/market/provider'
import { loginHref } from '@/lib/auth'
import { colorFromSeed } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname()
  const { profile, query, setQuery, unreadNotes, markNotificationsRead } = useMarket()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-3 backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-200 sm:h-[72px] sm:gap-3 sm:px-8 ${scrolled ? 'border-[#d7e2de] bg-[#fbfcfb]/92 shadow-[0_10px_30px_rgba(36,62,57,0.08)]' : 'border-[#e5e7e4] bg-[#fbfcfb]/95'}`}>
      <button type="button" aria-label="Open menu" onClick={onOpenMenu} className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#e4e9e6] bg-white text-[#687b75] shadow-[0_1px_2px_rgba(36,62,57,0.04)] lg:hidden">
        <Menu size={18} />
      </button>
      <Link href={marketPaths.home} className="shrink-0 lg:hidden" aria-label="UniMart home">
        <BrandLogo size={32} />
      </Link>
      <div className="relative min-w-0 flex-1 sm:max-w-[390px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#93a09c] sm:left-3.5" size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search UniMart..." className="h-10 w-full min-w-0 rounded-xl border border-[#e4e9e6] bg-white pl-9 pr-3 text-sm text-[#243e39] shadow-[0_1px_2px_rgba(36,62,57,0.03)] outline-none placeholder:text-[#a8b2ae] focus:border-[#7fa59a] focus:ring-2 focus:ring-[#dcebe6] sm:pl-10 sm:pr-4" />
      </div>
      <button className="hidden h-10 shrink-0 items-center gap-2 rounded-xl border border-[#e4e9e6] bg-white px-3.5 text-sm font-medium text-[#62746e] md:flex"><MapPin size={16} className="text-[#d1734b]" />{profile?.campus || profile?.university || 'Uganda'}<ChevronDown size={14} /></button>
      <button type="button" aria-label="Notifications" onClick={() => { void markNotificationsRead() }} className="relative ml-auto flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#e4e9e6] bg-white text-[#687b75] hover:bg-[#f1f5f3] sm:size-10">
        <Bell size={18} />
        {unreadNotes > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#d1734b]" />}
      </button>
      {profile ? (
        <Link href={marketPaths.profile} className="flex shrink-0 items-center gap-2">
          <Avatar name={profile.display_name} color={colorFromSeed(profile.id)} image={profile.avatar_url} />
          <span className="hidden text-left lg:block"><span className="block text-xs font-bold text-[#2e4942]">{profile.display_name}</span><span className="block text-[10px] text-[#91a09b]">{profile.verified ? 'Verified student' : 'Student'}</span></span>
          <ChevronDown size={14} className="hidden text-[#9aa7a2] lg:block" />
        </Link>
      ) : (
        <Link href={loginHref(pathname || '/')} className="rounded-xl bg-[#315e55] px-3 py-2 text-xs font-bold text-white">Sign in</Link>
      )}
    </header>
  )
}
