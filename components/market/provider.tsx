'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AUTH_INTENT_KEY } from '@/lib/auth-client'
import { loginHref } from '@/lib/auth'
import { marketPaths } from '@/lib/market-paths'
import { api } from '@/lib/api-client'
import { ensureBrowserSession } from '@/lib/auth-session'
import { createClient } from '@/lib/supabase/client'
import type { Article, Conversation, Listing, Notification, Profile } from '@/lib/types'

type MarketContextValue = {
  profile: Profile | null
  listings: Listing[]
  articles: Article[]
  myListings: Listing[]
  savedListings: Listing[]
  saved: string[]
  conversations: Conversation[]
  notifications: Notification[]
  loading: boolean
  setupNeeded: boolean
  query: string
  setQuery: (value: string) => void
  toast: string
  authOpen: boolean
  unreadMessages: number
  unreadNotes: number
  refresh: () => Promise<void>
  toggleSaved: (id: string) => Promise<void>
  notify: (message: string) => void
  requestPost: () => void
  closeAuth: () => void
  finishAuth: () => Promise<void>
  markNotificationsRead: () => Promise<void>
  addListing: (listing: Listing) => void
  setProfile: (profile: Profile | null) => void
}

const MarketContext = createContext<MarketContextValue | null>(null)

export function MarketProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [listings, setListings] = useState<Listing[]>([])
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [savedListings, setSavedListings] = useState<Listing[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [saved, setSaved] = useState<string[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
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
    const [listingResult, articleResult] = await Promise.all([
      api.listings('limit=48').catch(() => ({ data: [] as Listing[] })),
      api.articles().catch(() => ({ data: [] as Article[] })),
    ])
    if (generation !== refreshGeneration.current) return
    setListings(listingResult.data)
    setArticles(articleResult.data)
    if (!sessionUser) {
      setProfile(null)
      setSaved([])
      setSavedListings([])
      setMyListings([])
      setConversations([])
      setLoading(false)
      return
    }
    try {
      const me = await api.profile().catch(() => api.profile())
      if (generation !== refreshGeneration.current) return
      setProfile(me.data)
      const [favorites, inbox, notes, mine] = await Promise.all([
        api.favorites().catch(() => ({ data: [] as { listing_id: string; listings: Listing | null }[] })),
        api.conversations().catch(() => ({ data: [] as Conversation[] })),
        api.notifications().catch(() => ({ data: [] as Notification[], unread: 0 })),
        api.listings('mine=1').catch(() => ({ data: [] as Listing[] })),
      ])
      if (generation !== refreshGeneration.current) return
      setSaved(favorites.data.map((row) => row.listing_id))
      setSavedListings(favorites.data.map((row) => row.listings).filter((item): item is Listing => Boolean(item)))
      setMyListings(mine.data)
      setConversations(inbox.data)
      setNotifications(notes.data)
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
    if (sessionStorage.getItem(AUTH_INTENT_KEY) !== 'post') return
    sessionStorage.removeItem(AUTH_INTENT_KEY)
    setAuthOpen(false)
    router.push(marketPaths.post)
  }, [profile, router])

  const requestPost = useCallback(() => {
    if (profile) {
      router.push(marketPaths.post)
      return
    }
    sessionStorage.setItem(AUTH_INTENT_KEY, 'post')
    setAuthOpen(true)
  }, [profile, router])

  const closeAuth = useCallback(() => {
    sessionStorage.removeItem(AUTH_INTENT_KEY)
    setAuthOpen(false)
    if (pathname === marketPaths.post) router.replace(marketPaths.home)
  }, [pathname, router])

  const finishAuth = useCallback(async () => {
    sessionStorage.removeItem(AUTH_INTENT_KEY)
    await refresh()
    setAuthOpen(false)
    router.push(marketPaths.post)
  }, [refresh, router])

  const toggleSaved = useCallback(async (id: string) => {
    if (!profile) {
      window.location.href = loginHref(pathname || '/')
      return
    }
    const currently = saved.includes(id)
    setSaved((current) => currently ? current.filter((item) => item !== id) : [...current, id])
    try {
      if (currently) await api.removeFavorite(id)
      else await api.saveFavorite(id)
      notify(currently ? 'Removed from saved listings' : 'Saved for later')
    } catch (err) {
      setSaved((current) => currently ? [...current, id] : current.filter((item) => item !== id))
      notify(err instanceof Error ? err.message : 'Unable to update saved listings')
    }
  }, [notify, pathname, profile, saved])

  const markNotificationsRead = useCallback(async () => {
    const unread = notifications.filter((item) => !item.read_at).length
    await api.markNotificationsRead().catch(() => undefined)
    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })))
    notify(unread ? 'Notifications marked as read' : 'No new notifications')
  }, [notifications, notify])

  const addListing = useCallback((listing: Listing) => {
    setListings((current) => [listing, ...current])
    setMyListings((current) => [listing, ...current])
  }, [])

  const value = useMemo<MarketContextValue>(() => ({
    profile,
    listings,
    articles,
    myListings,
    savedListings,
    saved,
    conversations,
    notifications,
    loading,
    setupNeeded,
    query,
    setQuery,
    toast,
    authOpen,
    unreadMessages: conversations.reduce((sum, item) => sum + (item.unread_count ?? 0), 0),
    unreadNotes: notifications.filter((item) => !item.read_at).length,
    refresh,
    toggleSaved,
    notify,
    requestPost,
    closeAuth,
    finishAuth,
    markNotificationsRead,
    addListing,
    setProfile,
  }), [
    addListing,
    articles,
    authOpen,
    closeAuth,
    conversations,
    finishAuth,
    listings,
    loading,
    markNotificationsRead,
    myListings,
    notifications,
    notify,
    profile,
    query,
    refresh,
    requestPost,
    saved,
    savedListings,
    setupNeeded,
    toast,
    toggleSaved,
  ])

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
}

export function useMarket() {
  const context = useContext(MarketContext)
  if (!context) throw new Error('useMarket must be used within MarketProvider')
  return context
}
