'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, BookOpen, ChevronRight, Filter, Plus, Store, TrendingUp } from 'lucide-react'
import { ListingCard } from '@/components/market/listing-card'
import { useMarket } from '@/components/market/provider'
import { readTime } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import type { ListingCategory } from '@/lib/types'

type Category = 'All' | ListingCategory

export function HomeView() {
  const { query, listings, articles, saved, toggleSaved, loading, requestPost } = useMarket()
  const [category, setCategory] = useState<Category>('All')
  const filtered = useMemo(
    () => listings.filter((item) => (category === 'All' || item.category === category) && `${item.title} ${item.profiles?.display_name ?? ''} ${item.location}`.toLowerCase().includes(query.toLowerCase())),
    [category, query, listings],
  )

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-8 sm:py-8 lg:px-10">
      <section className="relative overflow-hidden rounded-2xl bg-[#315e55] px-5 py-7 text-white sm:rounded-[26px] sm:px-10 sm:py-10">
        <div className="relative z-10 max-w-[570px]">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-wide text-[#c7ddd6] sm:text-xs">YOUR CAMPUS, YOUR MARKETPLACE</p>
          <h1 className="font-display max-w-[520px] text-[28px] font-bold leading-[1.1] tracking-[-0.04em] sm:text-[44px] sm:leading-[1.08]">Find it. Sell it.<br /><span className="text-[#f1c6aa]">Make it yours.</span></h1>
          <p className="mt-3 max-w-[440px] text-sm leading-6 text-[#d4e4df] sm:mt-4 sm:text-[15px]">The trusted marketplace for students, creators, and businesses across Uganda.</p>
          <button type="button" onClick={requestPost} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#f3c8ad] px-4 py-3 text-sm font-bold text-[#315e55] transition hover:bg-white sm:mt-7 sm:w-auto sm:py-2.5">Start selling <ArrowUpRight size={16} /></button>
        </div>
        <div className="pointer-events-none absolute -right-8 -top-16 hidden h-[320px] w-[390px] rotate-[-16deg] rounded-[44%] border-[28px] border-[#47766b] opacity-65 md:block" />
        <div className="absolute right-10 top-10 hidden h-20 w-20 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur md:block">
          <TrendingUp className="mb-3 text-[#f3c8ad]" size={23} />
          <span className="block text-[10px] font-semibold text-[#d4e4df]">Live listings</span>
          <span className="text-lg font-bold">{listings.length}</span>
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
          {(['All', 'Products', 'Services', 'Rentals', 'Gigs'] as Category[]).map((item) => (
            <button key={item} onClick={() => setCategory(item)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${category === item ? 'bg-[#315e55] text-white' : 'border border-[#e3eae6] bg-white text-[#75847f] hover:border-[#b8d1c9]'}`}>{item}</button>
          ))}
        </div>
      </section>
      <section className="mt-6 sm:mt-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold tracking-[-0.025em] text-[#29463f] sm:text-xl">Fresh on campus</h2>
            <p className="mt-1 text-xs text-[#95a19d]">Listings from your university community</p>
          </div>
          <button className="flex shrink-0 items-center gap-1 rounded-lg border border-[#e5eae7] px-2.5 py-2 text-xs font-semibold text-[#6e8079] sm:px-3"><Filter size={14} /> <span className="hidden sm:inline">Filters</span></button>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-dashed border-[#d9e5e0] bg-white p-8 text-center text-sm text-[#81908b]">Loading listings…</div>
        ) : filtered.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {filtered.slice(0, 8).map((item) => (
              <ListingCard key={item.id} item={item} saved={saved.includes(item.id)} toggleSaved={toggleSaved} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d9e5e0] bg-white p-8 text-center text-sm text-[#81908b] sm:p-10">No listings match your search yet. Be the first to post.</div>
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
          <p className="mt-2 text-sm leading-6 text-[#8e7162]">Turn your talent or side hustle into a storefront the campus can find.</p>
          <button type="button" onClick={requestPost} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d1734b] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#b9623e] sm:w-auto">Create a listing <Plus size={15} /></button>
        </div>
      </section>
    </div>
  )
}
