'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AUTH_INTENT_KEY } from '@/lib/auth-client'
import { loginHref } from '@/lib/auth'
import { marketPaths } from '@/lib/market-paths'
import { api } from '@/lib/api-client'
import { ensureBrowserSession } from '@/lib/auth-session'
import { subscribeToFirebaseForegroundMessages } from '@/lib/firebase-messaging'
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notification-prefs'
import { createClient } from '@/lib/supabase/client'
import type { MarketCategory } from '@/lib/search'
import type { Article, Conversation, Listing, Notification, NotificationPreferences, Profile, Shop } from '@/lib/types'

type MarketContextValue = {
  profile: Profile | null
  listings: Listing[]
  shops: Shop[]
  articles: Article[]
  myListings: Listing[]
  myShop: Shop | null
  savedListings: Listing[]
  saved: string[]
  conversations: Conversation[]
  notifications: Notification[]
  notificationPreferences: NotificationPreferences
  loading: boolean
  setupNeeded: boolean
  query: string
  setQuery: (value: string) => void
  category: MarketCategory
  setCategory: (value: MarketCategory) => void
  toast: string
  authOpen: boolean
  unreadMessages: number
  unreadNotes: number
  refresh: () => Promise<void>
  toggleSaved: (id: string, listing?: Listing) => Promise<void>
  notify: (message: string) => void
  requestShop: () => void
  requestPost: () => void
  closeAuth: () => void
  finishAuth: () => Promise<void>
  markNotificationsRead: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  saveNotificationPreferences: (updates: Partial<NotificationPreferences>) => Promise<void>
  addListing: (listing: Listing) => void
  updateMyListing: (listing: Listing) => void
  setMyShop: (shop: Shop | null) => void
  setProfile: (profile: Profile | null) => void
}

const AUTH_INTENT_SHOP = 'shop'
const AUTH_INTENT_COMPOSE = 'compose'

function pathForAuthIntent(intent: string | null) {
  if (intent === AUTH_INTENT_SHOP) return marketPaths.shop
  return marketPaths.post
}

const MarketContext = createContext<MarketContextValue | null>(null)

export function MarketProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<MarketCategory>('All')
  const [toast, setToast] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [myShop, setMyShop] = useState<Shop | null>(null)
  const [savedListings, setSavedListings] = useState<Listing[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saved, setSaved] = useState<string[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const refreshGeneration = useRef(0)

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }, [])

  const refresh = useCallback(async () => {
    const generation = ++refreshGeneration.current
    const sessionUser = await ensureBrowserSession()
    const health = await fetch('/api/health').then((response) => response.json()).catch(() => ({ database: 'ready' }))
    if (generation !== refreshGeneration.current) return
    setSetupNeeded(health.database === 'uninitialized')
    const [listingResult, articleResult, shopResult] = await Promise.all([
      api.listings('limit=48').catch(() => ({ data: [] as Listing[] })),
      api.articles().catch(() => ({ data: [] as Article[] })),
      api.shops('limit=12').catch(() => ({ data: [] as Shop[] })),
    ])
    if (generation !== refreshGeneration.current) return
    setListings(listingResult.data)
    setArticles(articleResult.data)
    setShops(shopResult.data)
    if (!sessionUser) {
      setProfile(null)
      setSaved([])
      setSavedListings([])
      setMyListings([])
      setMyShop(null)
      setConversations([])
      setNotifications([])
      setNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES)
      setLoading(false)
      return
    }
    try {
      const me = await api.profile().catch(() => api.profile())
      if (generation !== refreshGeneration.current) return
      setProfile(me.data)
      const [favorites, inbox, notes, mine, shop] = await Promise.all([
        api.favorites().catch(() => ({ data: [] as { listing_id: string; listings: Listing | null }[] })),
        api.conversations().catch(() => ({ data: [] as Conversation[] })),
        api.notifications({ limit: 80 }).catch(() => ({
          data: [] as Notification[],
          unread: 0,
          preferences: DEFAULT_NOTIFICATION_PREFERENCES,
        })),
        api.listings('mine=1').catch(() => ({ data: [] as Listing[] })),
        api.shop().catch(() => ({ data: null as Shop | null })),
      ])
      if (generation !== refreshGeneration.current) return
      setSaved(favorites.data.map((row) => row.listing_id))
      setSavedListings(favorites.data.map((row) => row.listings).filter((item): item is Listing => Boolean(item)))
      setMyListings(mine.data)
      setMyShop(shop.data)
      setConversations(inbox.data)
      setNotifications(notes.data)
      setNotificationPreferences(notes.preferences ?? DEFAULT_NOTIFICATION_PREFERENCES)
    } catch {
      if (generation !== refreshGeneration.current) return
    } finally {
      if (generation === refreshGeneration.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const supabase = createClient()
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return
      window.setTimeout(() => {
        if (event === 'SIGNED_OUT') {
          void createClient().auth.getSession().then(({ data: { session } }) => {
            if (session) return
            void refresh()
          })
          return
        }
        void refresh()
      }, 0)
    })
    const keepAlive = () => {
      if (document.visibilityState === 'visible') void createClient().auth.getUser()
    }
    document.addEventListener('visibilitychange', keepAlive)
    window.addEventListener('focus', keepAlive)
    return () => {
      data.subscription.unsubscribe()
      document.removeEventListener('visibilitychange', keepAlive)
      window.removeEventListener('focus', keepAlive)
    }
  }, [refresh])

  useEffect(() => {
    if (!profile) return
    let unsubscribe: (() => void) | undefined
    void subscribeToFirebaseForegroundMessages(({ title, body }) => {
      if (title || body) notify([title, body].filter(Boolean).join(' · '))
      void refresh()
    }).then((next) => {
      unsubscribe = next
    })
    return () => {
      unsubscribe?.()
    }
  }, [notify, profile, refresh])

  useEffect(() => {
    if (!profile) return
    const intent = sessionStorage.getItem(AUTH_INTENT_KEY)
    if (intent !== AUTH_INTENT_SHOP && intent !== AUTH_INTENT_COMPOSE && intent !== 'post' && intent !== 'post-new') return
    sessionStorage.removeItem(AUTH_INTENT_KEY)
    setAuthOpen(false)
    router.push(pathForAuthIntent(intent))
  }, [profile, router])

  const requestShop = useCallback(() => {
    if (profile) {
      router.push(marketPaths.shop)
      return
    }
    sessionStorage.setItem(AUTH_INTENT_KEY, AUTH_INTENT_SHOP)
    setAuthOpen(true)
  }, [profile, router])

  const requestPost = useCallback(() => {
    if (profile) {
      router.push(marketPaths.post)
      return
    }
    sessionStorage.setItem(AUTH_INTENT_KEY, AUTH_INTENT_COMPOSE)
    setAuthOpen(true)
  }, [profile, router])

  const closeAuth = useCallback(() => {
    sessionStorage.removeItem(AUTH_INTENT_KEY)
    setAuthOpen(false)
    if (pathname.startsWith(marketPaths.post) || pathname === marketPaths.shop) router.replace(marketPaths.home)
  }, [pathname, router])

  const finishAuth = useCallback(async () => {
    const intent = sessionStorage.getItem(AUTH_INTENT_KEY)
    sessionStorage.removeItem(AUTH_INTENT_KEY)
    await refresh()
    setAuthOpen(false)
    router.push(pathForAuthIntent(intent))
  }, [refresh, router])

  const toggleSaved = useCallback(async (id: string, listing?: Listing) => {
    if (!profile) {
      window.location.href = loginHref(pathname || '/')
      return
    }
    const currently = saved.includes(id)
    const known = listing
      || listings.find((item) => item.id === id)
      || myListings.find((item) => item.id === id)
      || savedListings.find((item) => item.id === id)

    setSaved((current) => (currently ? current.filter((item) => item !== id) : current.includes(id) ? current : [...current, id]))
    setSavedListings((current) => {
      if (currently) return current.filter((item) => item.id !== id)
      if (!known || current.some((item) => item.id === id)) return current
      return [known, ...current]
    })

    try {
      if (currently) {
        await api.removeFavorite(id)
        notify('Removed from saved listings')
        return
      }
      await api.saveFavorite(id)
      if (!known) {
        const fresh = await api.listing(id).catch(() => null)
        if (fresh?.data) {
          setSavedListings((current) => (current.some((item) => item.id === id) ? current : [fresh.data, ...current]))
        }
      }
      notify('Saved for later')
    } catch (err) {
      setSaved((current) => (currently ? (current.includes(id) ? current : [...current, id]) : current.filter((item) => item !== id)))
      setSavedListings((current) => {
        if (currently) {
          if (!known || current.some((item) => item.id === id)) return current
          return [known, ...current]
        }
        return current.filter((item) => item.id !== id)
      })
      notify(err instanceof Error ? err.message : 'Unable to update saved listings')
    }
  }, [listings, myListings, notify, pathname, profile, saved, savedListings])

  const markNotificationsRead = useCallback(async () => {
    const unread = notifications.filter((item) => !item.read_at).length
    await api.markNotificationsRead().catch(() => undefined)
    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })))
    notify(unread ? 'Notifications marked as read' : 'No new notifications')
  }, [notifications, notify])

  const markNotificationRead = useCallback(async (id: string) => {
    await api.markNotificationRead(id).catch(() => undefined)
    setNotifications((current) => current.map((item) => (
      item.id === id ? { ...item, read_at: item.read_at ?? new Date().toISOString() } : item
    )))
  }, [])

  const saveNotificationPreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    const result = await api.updateNotificationPreferences(updates)
    setNotificationPreferences(result.preferences)
  }, [])

  const addListing = useCallback((listing: Listing) => {
    setListings((current) => [listing, ...current])
    setMyListings((current) => [listing, ...current])
  }, [])

  const updateMyListing = useCallback((listing: Listing) => {
    setMyListings((current) => {
      const exists = current.some((item) => item.id === listing.id)
      if (!exists) return [listing, ...current]
      return current.map((item) => (item.id === listing.id ? listing : item))
    })
    setListings((current) => {
      if (listing.status !== 'active') return current.filter((item) => item.id !== listing.id)
      const exists = current.some((item) => item.id === listing.id)
      if (!exists) return [listing, ...current]
      return current.map((item) => (item.id === listing.id ? listing : item))
    })
  }, [])

  const value = useMemo<MarketContextValue>(() => ({
    profile,
    listings,
    shops,
    articles,
    myListings,
    myShop,
    savedListings,
    saved,
    conversations,
    notifications,
    notificationPreferences,
    loading,
    setupNeeded,
    query,
    setQuery,
    category,
    setCategory,
    toast,
    authOpen,
    unreadMessages: conversations.reduce((sum, item) => sum + (item.unread_count ?? 0), 0),
    unreadNotes: notifications.filter((item) => !item.read_at).length,
    refresh,
    toggleSaved,
    notify,
    requestShop,
    requestPost,
    closeAuth,
    finishAuth,
    markNotificationsRead,
    markNotificationRead,
    saveNotificationPreferences,
    addListing,
    updateMyListing,
    setMyShop,
    setProfile,
  }), [
    addListing,
    articles,
    authOpen,
    category,
    closeAuth,
    conversations,
    finishAuth,
    listings,
    loading,
    markNotificationsRead,
    markNotificationRead,
    notificationPreferences,
    myListings,
    myShop,
    notifications,
    notify,
    profile,
    query,
    refresh,
    requestPost,
    requestShop,
    saveNotificationPreferences,
    saved,
    savedListings,
    setupNeeded,
    shops,
    toast,
    toggleSaved,
    updateMyListing,
  ])

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
}

export function useMarket() {
  const context = useContext(MarketContext)
  if (!context) throw new Error('useMarket must be used within MarketProvider')
  return context
}
