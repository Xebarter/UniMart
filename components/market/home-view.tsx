'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, BookOpen, ChevronRight, Filter, Store, TrendingUp } from 'lucide-react'
import { ListingCard } from '@/components/market/listing-card'
import { ShopCard } from '@/components/market/shop-card'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { readTime } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import { mergeShops, rankListings, rankShops, type MarketCategory } from '@/lib/search'
import type { Shop } from '@/lib/types'

const CATEGORIES: MarketCategory[] = ['All', 'Products', 'Services', 'Rentals', 'Gigs']
const PREVIEW_COUNT = 8
const SHOP_PREVIEW_COUNT = 8

export function HomeView() {
  const { query, category, setCategory, listings, shops, articles, saved, toggleSaved, loading, requestPost, requestShop } = useMarket()
  const [showAll, setShowAll] = useState(false)
  const [remoteShops, setRemoteShops] = useState<Shop[]>([])
  const [shopsSearching, setShopsSearching] = useState(false)

  const filtered = useMemo(() => {
    const ranked = rankListings(listings, query)
    return category === 'All' ? ranked : ranked.filter((item) => item.category === category)
  }, [category, query, listings])

  const searching = Boolean(query.trim())

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setRemoteShops([])
      setShopsSearching(false)
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setShopsSearching(true)
      api.shops(`q=${encodeURIComponent(q)}&limit=12`)
        .then((result) => {
          if (!controller.signal.aborted) setRemoteShops(result.data)
        })
        .catch(() => {
          if (!controller.signal.aborted) setRemoteShops([])
        })
        .finally(() => {
          if (!controller.signal.aborted) setShopsSearching(false)
        })
    }, 220)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  const matchedShops = useMemo(
    () => rankShops(mergeShops(shops, remoteShops), query),
    [query, remoteShops, shops],
  )

  const visibleShops = searching ? matchedShops : shops.slice(0, SHOP_PREVIEW_COUNT)
  const visible = searching || showAll ? filtered : filtered.slice(0, PREVIEW_COUNT)

  const resultSummary = searching
    ? [
        matchedShops.length ? `${matchedShops.length} shop${matchedShops.length === 1 ? '' : 's'}` : null,
        `${filtered.length} listing${filtered.length === 1 ? '' : 's'}`,
        category !== 'All' ? `in ${category}` : null,
      ].filter(Boolean).join(' · ')
    : 'Listings from your university community'

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
      <section className="relative overflow-hidden rounded-2xl bg-[#315e55] px-5 py-7 text-white sm:rounded-[26px] sm:px-10 sm:py-10">
        <div className="relative z-10 max-w-[570px]">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-wide text-[#c7ddd6] sm:text-xs">YOUR CAMPUS, YOUR MARKETPLACE</p>
          <h1 className="font-display max-w-[520px] text-[28px] font-bold leading-[1.1] tracking-[-0.04em] sm:text-[44px] sm:leading-[1.08]">Find it. Sell it.<br /><span className="text-[#f1c6aa]">Make it yours.</span></h1>
          <p className="mt-3 max-w-[440px] text-sm leading-6 text-[#d4e4df] sm:mt-4 sm:text-[15px]">The trusted marketplace for students, creators, and businesses across Uganda.</p>
          <button type="button" onClick={requestPost} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f3c8ad] px-4 py-3 text-sm font-bold text-[#315e55] transition hover:bg-white sm:mt-7 sm:w-auto sm:py-2.5">Start selling <ArrowUpRight size={16} /></button>
        </div>
        <div className="pointer-events-none absolute -right-12 -top-20 hidden h-[340px] w-[400px] rotate-[-14deg] rounded-[44%] border-[26px] border-[#47766b]/70 md:block lg:-right-8 lg:-top-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] bg-gradient-to-l from-[#244840]/35 to-transparent md:block" />
        <div className="absolute right-5 top-1/2 z-10 hidden -translate-y-1/2 md:block lg:right-10">
          <div className="flex min-w-[152px] items-center gap-3.5 rounded-[22px] border border-white/18 bg-white/[0.12] px-4 py-3.5 shadow-[0_18px_48px_rgba(8,24,20,0.22)] backdrop-blur-md">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-[14px] bg-[#f3c8ad]/18 ring-1 ring-[#f3c8ad]/25">
              <TrendingUp className="text-[#f3c8ad]" size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#c7ddd6]">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#8fd4b8] opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[#a8e0c8]" />
                </span>
                Live listings
              </p>
              <p className="mt-1 font-display text-[1.65rem] font-bold leading-none tracking-[-0.04em] text-white">{listings.length}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="mt-6 sm:mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Discover</p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.035em] text-[#29463f] sm:text-2xl">What are you looking for?</h2>
          </div>
          <Link href={marketPaths.explore} className="hidden shrink-0 items-center gap-1 text-xs font-bold text-[#6a8179] sm:flex">Browse all <ChevronRight size={15} /></Link>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:px-0">
          {CATEGORIES.map((item) => (
            <button key={item} type="button" onClick={() => { setCategory(item); setShowAll(false) }} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${category === item ? 'bg-[#315e55] text-white' : 'border border-[#e3eae6] bg-white text-[#75847f] hover:border-[#b8d1c9]'}`}>{item}</button>
          ))}
        </div>
      </section>

      {!searching && visibleShops.length > 0 ? (
        <section className="mt-6 sm:mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Storefronts</p>
              <h2 className="mt-1 font-display text-lg font-bold tracking-[-0.025em] text-[#29463f] sm:text-xl">Shops on campus</h2>
              <p className="mt-1 text-xs text-[#95a19d]">Follow a shop to keep up with new listings</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {visibleShops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} compact />
            ))}
          </div>
        </section>
      ) : null}

      {searching && (visibleShops.length > 0 || shopsSearching) ? (
        <section className="mt-6 sm:mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold tracking-[-0.025em] text-[#29463f] sm:text-xl">Matching shops</h2>
              <p className="mt-1 text-xs text-[#95a19d]">
                {shopsSearching && !visibleShops.length ? 'Searching shops…' : `${visibleShops.length} storefront${visibleShops.length === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>
          {visibleShops.length ? (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {visibleShops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} compact />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-6 sm:mt-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-[-0.025em] text-[#29463f] sm:text-xl">
              {searching ? `Results for “${query.trim()}”` : 'Fresh on campus'}
            </h2>
            <p className="mt-1 text-xs text-[#95a19d]">{resultSummary}</p>
          </div>
          <button className="flex shrink-0 items-center gap-1 rounded-lg border border-[#e5eae7] px-2.5 py-2 text-xs font-semibold text-[#6e8079] sm:px-3"><Filter size={14} /> <span className="hidden sm:inline">Filters</span></button>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-dashed border-[#d9e5e0] bg-white p-8 text-center text-sm text-[#81908b]">Loading listings…</div>
        ) : filtered.length ? (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
              {visible.map((item) => (
                <ListingCard key={item.id} item={item} saved={saved.includes(item.id)} toggleSaved={toggleSaved} compact />
              ))}
            </div>
            {filtered.length > PREVIEW_COUNT && !searching && (
              <button
                type="button"
                onClick={() => setShowAll((open) => !open)}
                className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl border border-[#e5eae7] bg-white py-2.5 text-xs font-bold text-[#315e55] hover:border-[#b8d1c9] sm:mt-5"
              >
                {showAll ? 'Show fewer listings' : `See ${filtered.length - PREVIEW_COUNT} more listing${filtered.length - PREVIEW_COUNT === 1 ? '' : 's'}`}
                <ChevronRight size={14} className={showAll ? 'rotate-[-90deg]' : 'rotate-90'} />
              </button>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d9e5e0] bg-white p-8 text-center text-sm text-[#81908b] sm:p-10">
            {searching && matchedShops.length
              ? 'No listings match this search yet. Check the matching shops above.'
              : 'No listings match your search yet. Be the first to post.'}
          </div>
        )}
      </section>
      <section className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-[#e5eae7] bg-white p-4 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Campus magazine</p>
              <h2 className="mt-1 font-display text-lg font-bold tracking-[-0.025em] text-[#29463f] sm:text-xl">Stories worth sharing</h2>
            </div>
            <Link href={marketPaths.explore} className="shrink-0 pt-1 text-xs font-bold text-[#638076]">See all</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {articles.slice(0, 3).map((article) => (
              <Link href={marketPaths.explore} key={article.id} className="min-w-0 text-left">
                <div className="mb-3 h-20 rounded-xl p-3" style={{ background: article.cover_color, color: article.accent_color }}>
                  <BookOpen size={18} />
                  <span className="mt-3 block text-[10px] font-bold uppercase tracking-wider">{article.type}</span>
                </div>
                <h3 className="text-xs font-bold leading-5 text-[#3d5650]">{article.title}</h3>
                <p className="mt-1 text-[10px] text-[#9aa7a2]">{readTime(article.body)}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-[#f8eee7] p-5 sm:p-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#fff9f4] text-[#d1734b]"><Store size={19} /></div>
          <h2 className="mt-5 font-display text-xl font-bold tracking-[-0.025em] text-[#5b4337]">Open your shop</h2>
          <p className="mt-2 text-sm leading-6 text-[#8e7162]">Turn your listings into a storefront campus can follow.</p>
          <button type="button" onClick={requestShop} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d1734b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#b9623e] sm:w-auto">Open a shop <Store size={15} /></button>
        </div>
      </section>
    </div>
  )
}
