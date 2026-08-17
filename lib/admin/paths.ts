import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  ScrollText,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react'

export const adminPaths = {
  home: '/admin',
  users: '/admin/users',
  user: (id: string) => `/admin/users/${id}`,
  listings: '/admin/listings',
  listing: (id: string) => `/admin/listings/${id}`,
  shops: '/admin/shops',
  shop: (id: string) => `/admin/shops/${id}`,
  reports: '/admin/reports',
  report: (id: string) => `/admin/reports/${id}`,
  payments: '/admin/payments',
  payment: (id: string) => `/admin/payments/${id}`,
  articles: '/admin/articles',
  articleNew: '/admin/articles/new',
  article: (id: string) => `/admin/articles/${id}`,
  messages: '/admin/messages',
  message: (id: string) => `/admin/messages/${id}`,
  analytics: '/admin/analytics',
  activity: '/admin/activity',
  settings: '/admin/settings',
} as const

export type AdminNavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
  adminOnly?: boolean
}

export const adminNav: AdminNavItem[] = [
  { href: adminPaths.home, label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: adminPaths.users, label: 'Users', icon: Users },
  { href: adminPaths.listings, label: 'Listings', icon: ShoppingBag },
  { href: adminPaths.shops, label: 'Shops', icon: Store },
  { href: adminPaths.reports, label: 'Reports', icon: ShieldAlert },
  { href: adminPaths.messages, label: 'Messages', icon: MessageSquare },
  { href: adminPaths.payments, label: 'Payments', icon: Receipt },
  { href: adminPaths.articles, label: 'Articles', icon: BookOpen },
  { href: adminPaths.analytics, label: 'Analytics', icon: TrendingUp },
  { href: adminPaths.activity, label: 'Activity', icon: ScrollText },
  { href: adminPaths.settings, label: 'Settings', icon: Settings, adminOnly: true },
]

export function isAdminNavActive(pathname: string, item: AdminNavItem) {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
