'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, ChevronDown, MapPin, Menu } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { ProfileMenu } from '@/components/market/profile-menu'
import { useMarket } from '@/components/market/provider'
import { SearchField } from '@/components/market/search-suggest'
import { marketPaths } from '@/lib/market-paths'

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { profile, unreadNotes, markNotificationsRead } = useMarket()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`sticky top-0 z-30 flex h-16 items-center gap-2 overflow-visible border-b px-3 backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-200 sm:h-[72px] sm:gap-3 sm:px-8 ${scrolled ? 'border-[#d7e2de] bg-[#fbfcfb]/92 shadow-[0_10px_30px_rgba(36,62,57,0.08)]' : 'border-[#e5e7e4] bg-[#fbfcfb]/95'}`}>
      <button type="button" aria-label="Open menu" onClick={onOpenMenu} className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#e4e9e6] bg-white text-[#687b75] shadow-[0_1px_2px_rgba(36,62,57,0.04)] lg:hidden">
        <Menu size={18} />
      </button>
      <Link href={marketPaths.home} className="shrink-0 lg:hidden" aria-label="UniMart home">
        <BrandLogo size={32} />
      </Link>
      <SearchField />
      <button className="hidden h-10 shrink-0 items-center gap-2 rounded-xl border border-[#e4e9e6] bg-white px-3.5 text-sm font-medium text-[#62746e] md:flex"><MapPin size={16} className="text-[#d1734b]" />{profile?.campus || profile?.university || 'Uganda'}<ChevronDown size={14} /></button>
      <button type="button" aria-label="Notifications" onClick={() => { void markNotificationsRead() }} className="relative ml-auto flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#e4e9e6] bg-white text-[#687b75] hover:bg-[#f1f5f3] sm:size-10">
        <Bell size={18} />
        {unreadNotes > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#d1734b]" />}
      </button>
      <ProfileMenu />
    </header>
  )
}
