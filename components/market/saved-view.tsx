'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BriefcaseBusiness, ChevronRight, Heart, Home, LayoutGrid, Package, Search, Sparkles, Tag, TrendingUp } from 'lucide-react'
import { ListingCard } from '@/components/market/listing-card'
import { useMarket } from '@/components/market/provider'
import { loginHref } from '@/lib/auth'
import { marketPaths } from '@/lib/market-paths'
import { LISTING_CATEGORIES, type ListingCategory } from '@/lib/types'

type Filter = 'All' | ListingCategory

const CATEGORY_UI: Record<Filter, { hint: string; icon: typeof Package }> = {
  All: { hint: 'Everything you saved', icon: LayoutGrid },
  Products: { hint: 'Goods & finds', icon: Package },
  Services: { hint: 'Skills on demand', icon: BriefcaseBusiness },
  Rentals: { hint: 'Rooms & gear', icon: Home },
  Gigs: { hint: 'Short paid work', icon: Tag },
}

export function SavedView() {
  const { profile, saved, savedListings, toggleSaved, loading } = useMarket()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('All')

  const missing = Math.max(0, saved.length - savedListings.length)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return savedListings.filter((item) => {
      if (filter !== 'All' && item.category !== filter) return false
      if (!q) return true
      return `${item.title} ${item.location} ${item.profiles?.display_name ?? ''} ${item.category}`.toLowerCase().includes(q)
    })
  }, [filter, query, savedListings])

  const searching = Boolean(query.trim())
  const categoryCount = useMemo(() => new Set(savedListings.map((item) => item.category)).size, [savedListings])
  const resultSummary = searching
    ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'}${filter !== 'All' ? ` in ${filter}` : ''}`
    : filter === 'All'
      ? `${savedListings.length} listing${savedListings.length === 1 ? '' : 's'} saved for later`
      : `${filtered.length} ${filter.toLowerCase()} listing${filtered.length === 1 ? '' : 's'} saved`

  if (loading && !profile) {
    return (
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-8 lg:px-10">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#e7eeeb]" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-[4/5] animate-pulse rounded-2xl bg-[#eef3f0]" />
          ))}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-8 sm:py-16">
        <section className="relative overflow-hidden rounded-[28px] bg-[#315e55] px-6 py-14 text-center text-white sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rotate-[-18deg] rounded-[44%] border-[22px] border-[#47766b] opacity-60" />
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">Saved</p>
          <h1 className="mt-3 font-display text-[1.85rem] font-bold tracking-[-0.04em] sm:text-4xl">Keep the finds you like.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#d4e4df]">Sign in to save listings, come back to them later, and get back to a seller in one tap.</p>
          <a href={loginHref(marketPaths.saved)} className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[#f3c8ad] px-5 text-sm font-bold text-[#315e55] hover:bg-white">
            Sign in
          </a>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-12 pt-5 sm:px-8 sm:pt-8 lg:px-10">
      <section className="relative overflow-hidden rounded-2xl bg-[#315e55] px-5 py-5 text-white sm:rounded-[26px] sm:px-10 sm:py-8">
        <div className="relative z-10 max-w-[600px]">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-wide text-[#c7ddd6] sm:text-xs">CURATED FOR LATER</p>
          <h1 className="font-display max-w-[520px] text-[28px] font-bold leading-[1.1] tracking-[-0.04em] sm:text-[44px] sm:leading-[1.08]">
            Saved listings,
            <br />
            <span className="text-[#f1c6aa]">kept beautifully in reach.</span>
          </h1>
          <p className="mt-2 max-w-[420px] text-sm leading-6 text-[#d4e4df] sm:mt-3 sm:text-[15px]">Come back to the best finds in one place.</p>
          <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-5">
            <Link href={marketPaths.home} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f3c8ad] px-4 py-3 text-sm font-bold text-[#315e55] transition hover:bg-white sm:py-2.5">
              Browse fresh listings <ChevronRight size={16} />
            </Link>
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-[#dfece7] backdrop-blur-md sm:py-2.5">
              <Heart size={15} className="text-[#f3c8ad]" fill="currentColor" />
              {savedListings.length} saved
            </span>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-12 -top-20 hidden h-[340px] w-[400px] rotate-[-14deg] rounded-[44%] border-[26px] border-[#47766b]/70 md:block lg:-right-8 lg:-top-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] bg-gradient-to-l from-[#244840]/35 to-transparent md:block" />
        <div className="absolute right-5 top-1/2 z-10 hidden -translate-y-1/2 md:block lg:right-10">
          <div className="flex min-w-[172px] items-center gap-3.5 rounded-[22px] border border-white/18 bg-white/[0.12] px-4 py-3.5 shadow-[0_18px_48px_rgba(8,24,20,0.22)] backdrop-blur-md">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#f3c8ad]/18 ring-1 ring-[#f3c8ad]/25">
              <TrendingUp className="text-[#f3c8ad]" size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#c7ddd6]">Ready to revisit</p>
              <p className="mt-1 font-display text-[1.65rem] font-bold leading-none tracking-[-0.04em] text-white">{filtered.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:mt-7 sm:grid-cols-4">
        {[
          { label: 'Saved total', value: savedListings.length },
          { label: 'Visible now', value: filtered.length },
          { label: 'Categories', value: categoryCount },
          { label: 'Unavailable', value: missing },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#e5eae7] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(36,62,57,0.04)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-[#29463f]">{item.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 sm:mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Refine</p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.035em] text-[#29463f] sm:text-2xl">Filter your saved collection</h2>
            <p className="mt-1 text-xs text-[#95a19d]">{resultSummary}</p>
          </div>
          <Link href={marketPaths.home} className="hidden shrink-0 items-center gap-1 text-xs font-bold text-[#6a8179] sm:flex">
            Explore more <ChevronRight size={15} />
          </Link>
        </div>
        <div className="relative max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9994]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search saved listings"
            className="h-11 w-full rounded-xl border border-[#e5eae7] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-2.5">
          {(['All', ...LISTING_CATEGORIES] as Filter[]).map((item) => {
            const { hint, icon: Icon } = CATEGORY_UI[item]
            const active = filter === item
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item)}
                className={`flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-center transition sm:min-h-[88px] sm:px-3 ${
                  active
                    ? 'border-[#315e55] bg-[#315e55] text-white shadow-[0_10px_24px_rgba(49,94,85,0.18)]'
                    : 'border-[#e3eae6] bg-white text-[#526861] hover:border-[#b8d1c9] hover:bg-[#f7fbf9]'
                }`}
              >
                <span className={`flex size-8 items-center justify-center rounded-xl sm:size-9 ${active ? 'bg-white/15 text-white' : 'bg-[#eef4f1] text-[#315e55]'}`}>
                  <Icon size={16} strokeWidth={2.15} />
                </span>
                <span className="text-[11px] font-bold leading-none tracking-[-0.01em] sm:text-xs">{item}</span>
                <span className={`hidden text-[10px] font-medium leading-none lg:block ${active ? 'text-[#d4e4df]' : 'text-[#8b9994]'}`}>{hint}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-6 sm:mt-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-[-0.025em] text-[#29463f] sm:text-xl">
              {searching ? `Results for “${query.trim()}”` : filter === 'All' ? 'Saved for later' : `${filter} you saved`}
            </h2>
            <p className="mt-1 text-xs text-[#95a19d]">
              {filtered.length
                ? `${filtered.length} listing${filtered.length === 1 ? '' : 's'}`
                : 'Nothing here right now'}
            </p>
          </div>
          <Link href={marketPaths.home} className="hidden shrink-0 items-center gap-1 text-xs font-bold text-[#6a8179] sm:flex">
            Browse all <ChevronRight size={15} />
          </Link>
        </div>
      </section>

      {missing > 0 ? (
        <p className="mt-4 rounded-2xl border border-[#f0c7b3] bg-[#fff8f4] px-4 py-3 text-[13px] leading-6 text-[#9a4f32]">
          {missing} saved item{missing === 1 ? ' is' : 's are'} no longer listed. They were sold, archived, or taken down.
        </p>
      ) : null}

      {filtered.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
          {filtered.map((item) => (
            <ListingCard
              key={item.id}
              item={item}
              saved
              toggleSaved={toggleSaved}
              compact
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[28px] border border-dashed border-[#d5e4de] bg-[#f7fbf9] px-6 py-14 text-center sm:py-16">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-[#d1734b] shadow-[0_8px_24px_rgba(49,94,85,0.08)]">
            {query || filter !== 'All' ? <Search size={22} /> : <Sparkles size={22} />}
          </span>
          <h2 className="mt-5 font-display text-xl font-bold text-[#29463f]">
            {savedListings.length ? 'No matches in this view.' : 'Nothing saved yet.'}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#748780]">
            {savedListings.length
              ? 'Try another search or filter.'
              : 'Tap the heart to keep a listing here.'}
          </p>
          <Link
            href={marketPaths.home}
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44]"
          >
            {savedListings.length ? 'Browse more listings' : 'Find something to save'}
          </Link>
        </div>
      )}
    </div>
  )
}
