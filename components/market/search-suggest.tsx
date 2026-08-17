'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BriefcaseBusiness, ChevronRight, Home, Package, Search, Store, Tag, X } from 'lucide-react'
import { ListingPhoto } from '@/components/listing-photo'
import { ShopCover } from '@/components/market/shop-cover'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { formatUGX, rentPeriodSuffix } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import { groupListingsByCategory, matchingCategories, mergeShops, rankListings, rankShops } from '@/lib/search'
import type { Listing, ListingCategory, Shop } from '@/lib/types'

const CATEGORY_UI: Record<ListingCategory, { hint: string; icon: typeof Package }> = {
  Products: { hint: 'Goods & campus finds', icon: Package },
  Services: { hint: 'Skills on demand', icon: BriefcaseBusiness },
  Rentals: { hint: 'Rooms, kits & gear', icon: Home },
  Gigs: { hint: 'Short work, fair pay', icon: Tag },
}

const MAX_LISTINGS = 6
const MAX_SHOPS = 4
const MAX_PER_CATEGORY = 3

type Hit =
  | { kind: 'category'; id: ListingCategory }
  | { kind: 'shop'; id: string }
  | { kind: 'listing'; id: string }
  | { kind: 'all' }

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (!q) return text
  const index = text.toLowerCase().indexOf(q.toLowerCase())
  if (index < 0) return text
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-[#eaf3ef] px-0.5 font-bold text-[#315e55]">{text.slice(index, index + q.length)}</mark>
      {text.slice(index + q.length)}
    </>
  )
}

function ResultRow({
  item,
  query,
  selected,
  optionId,
  onHover,
  onChoose,
}: {
  item: Listing
  query: string
  selected: boolean
  optionId: string
  onHover: () => void
  onChoose: () => void
}) {
  return (
    <button
      id={optionId}
      type="button"
      role="option"
      aria-selected={selected}
      onMouseEnter={onHover}
      onClick={onChoose}
      className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-2 py-2 text-left transition sm:px-1.5 sm:py-1.5 ${
        selected ? 'bg-[#eef5f2]' : 'hover:bg-[#f6f9f7]'
      }`}
    >
      <ListingPhoto listing={item} alt="" className="size-14 shrink-0 rounded-xl sm:size-12" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-[#29463f]">
          <Highlight text={item.title} query={query} />
        </span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px]">
          <span className="shrink-0 font-bold text-[#d1734b]">
            {formatUGX(Number(item.price), item.currency)}
            {item.category === 'Rentals' && rentPeriodSuffix(item.rent_period) ? (
              <span className="font-semibold text-[#9aa7a2]"> {rentPeriodSuffix(item.rent_period)}</span>
            ) : null}
          </span>
          <span className="truncate text-[#8c9995]">{item.location || item.category}</span>
        </span>
      </span>
      <ChevronRight size={14} className={`shrink-0 ${selected ? 'text-[#315e55]' : 'text-[#c3d0cb]'}`} />
    </button>
  )
}

function ShopResultRow({
  shop,
  query,
  selected,
  optionId,
  onHover,
  onChoose,
}: {
  shop: Shop
  query: string
  selected: boolean
  optionId: string
  onHover: () => void
  onChoose: () => void
}) {
  const listingCount = shop.listing_count ?? 0
  return (
    <button
      id={optionId}
      type="button"
      role="option"
      aria-selected={selected}
      onMouseEnter={onHover}
      onClick={onChoose}
      className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-2 py-2 text-left transition sm:px-1.5 sm:py-1.5 ${
        selected ? 'bg-[#eef5f2]' : 'hover:bg-[#f6f9f7]'
      }`}
    >
      <ShopCover shop={shop} className="size-14 shrink-0 rounded-xl sm:size-12" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 truncate text-[13px] font-bold text-[#29463f]">
          <Store size={13} className="shrink-0 text-[#638076]" />
          <Highlight text={shop.name} query={query} />
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-[#8c9995]">
          {listingCount} listing{listingCount === 1 ? '' : 's'}
          {shop.profiles?.campus ? ` · ${shop.profiles.campus}` : ''}
        </span>
      </span>
      <ChevronRight size={14} className={`shrink-0 ${selected ? 'text-[#315e55]' : 'text-[#c3d0cb]'}`} />
    </button>
  )
}

function mergeListings(local: Listing[], remote: Listing[]) {
  const map = new Map<string, Listing>()
  for (const item of local) map.set(item.id, item)
  for (const item of remote) map.set(item.id, item)
  return [...map.values()]
}

export function SearchField() {
  const router = useRouter()
  const pathname = usePathname()
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, setQuery, listings, shops, setCategory } = useMarket()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [remote, setRemote] = useState<Listing[]>([])
  const [remoteShops, setRemoteShops] = useState<Shop[]>([])
  const [searching, setSearching] = useState(false)

  const ranked = useMemo(
    () => rankListings(mergeListings(listings, remote), query),
    [listings, query, remote],
  )
  const rankedShops = useMemo(
    () => rankShops(mergeShops(shops, remoteShops), query).slice(0, MAX_SHOPS),
    [query, remoteShops, shops],
  )
  const categories = useMemo(() => {
    const matched = matchingCategories(ranked, query)
    return matched.length ? matched : matchingCategories(ranked, '')
  }, [query, ranked])
  const featured = useMemo(() => ranked.slice(0, 4), [ranked])
  const groups = useMemo(() => {
    if (!query.trim()) return []
    const grouped = groupListingsByCategory(ranked)
    const perGroup = grouped.length <= 1 ? MAX_LISTINGS : MAX_PER_CATEGORY
    return grouped.map((group) => ({ ...group, items: group.items.slice(0, perGroup) }))
  }, [query, ranked])
  const listingHits = useMemo(
    () => (query.trim() ? groups.flatMap((group) => group.items) : featured),
    [featured, groups, query],
  )

  const hits = useMemo<Hit[]>(() => {
    const next: Hit[] = categories.map((id) => ({ kind: 'category', id }))
    for (const shop of rankedShops) next.push({ kind: 'shop', id: shop.id })
    for (const item of listingHits) next.push({ kind: 'listing', id: item.id })
    if (query.trim() && (ranked.length || rankedShops.length)) next.push({ kind: 'all' })
    return next
  }, [categories, listingHits, query, ranked.length, rankedShops])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setRemote([])
      setRemoteShops([])
      setSearching(false)
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setSearching(true)
      Promise.all([
        api.listings(`q=${encodeURIComponent(q)}&limit=24`),
        api.shops(`q=${encodeURIComponent(q)}&limit=6`),
      ])
        .then(([listingResult, shopResult]) => {
          if (!controller.signal.aborted) {
            setRemote(listingResult.data)
            setRemoteShops(shopResult.data)
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setRemote([])
            setRemoteShops([])
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false)
        })
    }, 220)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    setActive(0)
  }, [query, open])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function goHome() {
    if (pathname !== marketPaths.home) router.push(marketPaths.home)
  }

  function chooseCategory(id: ListingCategory) {
    setCategory(id)
    setOpen(false)
    inputRef.current?.blur()
    goHome()
  }

  function chooseListing(id: string) {
    setOpen(false)
    inputRef.current?.blur()
    router.push(marketPaths.listing(id))
  }

  function chooseShop(slug: string) {
    setOpen(false)
    inputRef.current?.blur()
    router.push(marketPaths.shopPublic(slug))
  }

  function chooseAll() {
    setCategory('All')
    setOpen(false)
    inputRef.current?.blur()
    goHome()
  }

  function activate(hit: Hit | undefined) {
    if (!hit) {
      setCategory('All')
      setOpen(false)
      goHome()
      return
    }
    if (hit.kind === 'category') chooseCategory(hit.id)
    else if (hit.kind === 'shop') {
      const shop = rankedShops.find((item) => item.id === hit.id)
      if (shop) chooseShop(shop.slug)
    }
    else if (hit.kind === 'listing') chooseListing(hit.id)
    else chooseAll()
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) setOpen(true)
      setActive((current) => (current + 1) % Math.max(hits.length, 1))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) setOpen(true)
      setActive((current) => (current - 1 + hits.length) % Math.max(hits.length, 1))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      activate(hits[active])
    }
  }

  const typed = query.trim()
  const empty = typed.length === 0
  const activeHit = hits[active]

  return (
    <div ref={rootRef} className={`relative min-w-0 flex-1 sm:max-w-[460px] lg:max-w-[540px] ${open ? 'z-40' : ''}`}>
      {open && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Dismiss search"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 cursor-default bg-[#0c1c19]/18 backdrop-blur-[3px] sm:hidden"
        />
      )}
      <div className={`z-40 ${
        open
          ? 'fixed inset-x-3 top-[max(0.65rem,env(safe-area-inset-top))] rounded-2xl border border-[#d7e4df] bg-white shadow-[0_28px_70px_rgba(36,62,57,0.16)] sm:absolute sm:inset-x-0 sm:top-0'
          : 'relative'
      }`}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#93a09c] sm:left-3.5" size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={open && activeHit ? `${listboxId}-${activeHit.kind}-${activeHit.kind === 'all' ? 'all' : activeHit.id}` : undefined}
            placeholder="Search listings, shops, and categories"
            className={`h-11 w-full min-w-0 bg-white pl-9 pr-10 text-sm text-[#243e39] outline-none placeholder:text-[#a8b2ae] sm:h-10 sm:pl-10 ${
              open
                ? 'rounded-t-2xl rounded-b-none border-0 focus:ring-0'
                : 'rounded-xl border border-[#e4e9e6] shadow-[0_1px_2px_rgba(36,62,57,0.03)] focus:border-[#7fa59a] focus:ring-2 focus:ring-[#dcebe6]'
            }`}
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery('')
                setCategory('All')
                inputRef.current?.focus()
              }}
              className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-[#8a9a95] transition hover:bg-[#f1f5f3] hover:text-[#315e55]"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {open && (
          <div id={listboxId} role="listbox" aria-label="Search suggestions" className="search-tile max-h-[min(calc(100dvh-6.5rem),560px)] overflow-y-auto overscroll-contain border-t border-[#eef3f0] px-3 pb-3 pt-2.5 sm:max-h-[min(calc(100dvh-9rem),560px)] sm:px-3 sm:pb-2.5 sm:pt-2">
            <p className="px-1.5 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#b08a72]">
              {empty ? 'Browse categories' : searching ? 'Finding matches' : ranked.length || rankedShops.length ? 'Related results' : 'No matches yet'}
            </p>

            <div className="grid grid-cols-2 gap-2 sm:gap-1.5">
              {categories.map((id) => {
                const meta = CATEGORY_UI[id]
                const Icon = meta.icon
                const count = ranked.filter((item) => item.category === id).length
                const selected = activeHit?.kind === 'category' && activeHit.id === id
                return (
                  <button
                    key={id}
                    id={`${listboxId}-category-${id}`}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(hits.findIndex((hit) => hit.kind === 'category' && hit.id === id))}
                    onClick={() => chooseCategory(id)}
                    className={`flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition sm:px-2.5 sm:py-2 ${
                      selected
                        ? 'border-[#8bb4a7] bg-[#eaf3ef] shadow-[0_6px_16px_rgba(36,62,57,0.08)]'
                        : 'border-[#e8eeeb] bg-[#fbfcfb] hover:border-[#c5d8d0]'
                    }`}
                  >
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-white text-[#d1734b]' : 'bg-white text-[#d1734b] shadow-[0_1px_2px_rgba(36,62,57,0.04)]'}`}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-bold text-[#29463f]">{id}</span>
                      <span className="block truncate text-[10px] text-[#80918b]">
                        {typed && count ? `${count} match${count === 1 ? '' : 'es'}` : meta.hint}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {empty && featured.length > 0 && (
              <section className="mt-3">
                <p className="mb-1.5 px-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a9a95]">Fresh on campus</p>
                <div className="space-y-1">
                  {featured.map((item) => (
                    <ResultRow
                      key={item.id}
                      item={item}
                      query={query}
                      selected={activeHit?.kind === 'listing' && activeHit.id === item.id}
                      optionId={`${listboxId}-listing-${item.id}`}
                      onHover={() => setActive(hits.findIndex((hit) => hit.kind === 'listing' && hit.id === item.id))}
                      onChoose={() => chooseListing(item.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {rankedShops.length > 0 && (
              <section className="mt-3">
                <p className="mb-1.5 px-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a9a95]">Shops</p>
                <div className="space-y-1">
                  {rankedShops.map((shop) => (
                    <ShopResultRow
                      key={shop.id}
                      shop={shop}
                      query={query}
                      selected={activeHit?.kind === 'shop' && activeHit.id === shop.id}
                      optionId={`${listboxId}-shop-${shop.id}`}
                      onHover={() => setActive(hits.findIndex((hit) => hit.kind === 'shop' && hit.id === shop.id))}
                      onChoose={() => chooseShop(shop.slug)}
                    />
                  ))}
                </div>
              </section>
            )}

            {groups.length > 0 && (
              <div className={`mt-3 space-y-3 ${searching ? 'opacity-80' : ''}`}>
                {groups.map((group) => (
                  <section key={group.category}>
                    <div className="mb-1.5 flex items-center justify-between px-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a9a95]">{group.category}</p>
                      <button
                        type="button"
                        onClick={() => chooseCategory(group.category)}
                        className="text-[10px] font-bold text-[#638076] hover:text-[#315e55]"
                      >
                        View all
                      </button>
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <ResultRow
                          key={item.id}
                          item={item}
                          query={query}
                          selected={activeHit?.kind === 'listing' && activeHit.id === item.id}
                          optionId={`${listboxId}-listing-${item.id}`}
                          onHover={() => setActive(hits.findIndex((hit) => hit.kind === 'listing' && hit.id === item.id))}
                          onChoose={() => chooseListing(item.id)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {!empty && !groups.length && !rankedShops.length && !searching && (
              <div className="mt-3 rounded-xl bg-[#f6f9f7] px-3 py-5 text-center">
                <p className="text-sm font-bold text-[#3d5650]">Nothing matches “{typed}”</p>
                <p className="mt-1 text-[12px] leading-5 text-[#80918b]">Try a category above, or post the first listing for it.</p>
              </div>
            )}

            {typed && (ranked.length > 0 || rankedShops.length > 0) && (
              <button
                id={`${listboxId}-all-all`}
                type="button"
                role="option"
                aria-selected={activeHit?.kind === 'all'}
                onMouseEnter={() => setActive(hits.length - 1)}
                onClick={chooseAll}
                className={`mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[12px] font-bold transition ${
                  activeHit?.kind === 'all' ? 'bg-[#315e55] text-white' : 'bg-[#f4f8f6] text-[#315e55] hover:bg-[#eaf3ef]'
                }`}
              >
                <span>
                  See all {ranked.length + rankedShops.length} result{ranked.length + rankedShops.length === 1 ? '' : 's'}
                </span>
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        )}
      </div>
      {open ? <div className="h-11 sm:h-10" aria-hidden /> : null}
    </div>
  )
}
