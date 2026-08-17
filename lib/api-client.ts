import type { AdminAnalytics, AdminSettingsSnapshot, AdminStats, Article, AuditLog, Conversation, FollowedProfile, Listing, Message, Notification, Paginated, Payment, Profile, Report, Shop } from '@/lib/types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    cache: 'no-store',
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers ?? {}),
    },
  })
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.')
  }
  return payload
}

export const api = {
  listings: (params?: string) => request<{ data: Listing[] }>(`/api/listings${params ? `?${params}` : ''}`),
  listing: (id: string) => request<{ data: Listing }>(`/api/listings/${id}`),
  createListing: (body: Record<string, unknown>) =>
    request<{ data: Listing }>('/api/listings', { method: 'POST', body: JSON.stringify(body) }),
  updateListing: (id: string, body: Record<string, unknown>) =>
    request<{ data: Listing }>(`/api/listings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteListing: (id: string) =>
    request<{ archived: boolean }>(`/api/listings/${id}`, { method: 'DELETE' }),
  profile: () => request<{ data: Profile | null; user: { id: string; email?: string; providers?: string[] } }>('/api/profile'),
  updateProfile: (body: Record<string, unknown>) =>
    request<{ data: Profile }>('/api/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  favorites: () => request<{ data: { listing_id: string; listings: Listing | null }[] }>('/api/favorites'),
  saveFavorite: (listing_id: string) =>
    request<{ saved: boolean }>('/api/favorites', { method: 'POST', body: JSON.stringify({ listing_id }) }),
  removeFavorite: (listing_id: string) =>
    request<{ saved: boolean }>('/api/favorites', { method: 'DELETE', body: JSON.stringify({ listing_id }) }),
  articles: () => request<{ data: Article[] }>('/api/articles'),
  article: (slug: string) => request<{ data: Article }>(`/api/articles/${slug}`),
  conversations: () => request<{ data: Conversation[] }>('/api/conversations'),
  startConversation: (body: { recipient_id: string; listing_id?: string }) =>
    request<{ data: Conversation }>('/api/conversations', { method: 'POST', body: JSON.stringify(body) }),
  messages: (conversation_id: string) =>
    request<{ data: Message[] }>(`/api/messages?conversation_id=${conversation_id}`),
  sendMessage: (body: { conversation_id: string; body: string }) =>
    request<{ data: Message }>('/api/messages', { method: 'POST', body: JSON.stringify(body) }),
  markRead: (conversation_id: string) =>
    request('/api/messages/read', { method: 'POST', body: JSON.stringify({ conversation_id }) }),
  notifications: () => request<{ data: Notification[]; unread: number }>('/api/notifications'),
  markNotificationsRead: () => request('/api/notifications', { method: 'PATCH', body: JSON.stringify({ all: true }) }),
  report: (body: Record<string, unknown>) =>
    request<{ data: Report }>('/api/reports', { method: 'POST', body: JSON.stringify(body) }),
  follow: (following_id: string) =>
    request('/api/follows', { method: 'POST', body: JSON.stringify({ following_id }) }),
  unfollow: (following_id: string) =>
    request('/api/follows', { method: 'DELETE', body: JSON.stringify({ following_id }) }),
  follows: () => request<{ data: FollowedProfile[] }>('/api/follows'),
  shop: () => request<{ data: Shop | null }>('/api/shops'),
  shops: (params?: string) => request<{ data: Shop[] }>(`/api/shops${params ? `?${params}` : ''}`),
  shopByOwner: (ownerId: string) => request<{ data: Shop | null }>(`/api/shops?owner_id=${ownerId}`),
  shopBySlug: (slug: string) =>
    request<{ data: Shop; listings: Listing[]; follower_count: number; following: boolean }>(`/api/shops/${slug}`),
  createShop: (body: Record<string, unknown>) =>
    request<{ data: Shop }>('/api/shops', { method: 'POST', body: JSON.stringify(body) }),
  updateShop: (body: Record<string, unknown>) =>
    request<{ data: Shop }>('/api/shops', { method: 'PATCH', body: JSON.stringify(body) }),
  checkout: (body: { listing_id: string; method: 'mobile_money' | 'card' }) =>
    request<{ checkout_url: string }>('/api/payments/checkout', { method: 'POST', body: JSON.stringify(body) }),
  adminStats: (range?: string) => request<{ data: AdminStats }>(`/api/admin/stats${range ? `?range=${range}` : ''}`),
  adminUsers: (params?: string) => request<Paginated<Profile>>(`/api/admin/users${params ? `?${params}` : ''}`),
  adminUser: (id: string) => request<{ data: Profile; shop: Shop | null; listings: Listing[]; reports: Report[]; payments: Payment[]; conversation_count: number }>(`/api/admin/users/${id}`),
  adminListings: (params?: string) => request<Paginated<Listing>>(`/api/admin/listings${params ? `?${params}` : ''}`),
  adminListing: (id: string) => request<{ data: Listing; reports: Report[]; payments: Payment[] }>(`/api/admin/listings/${id}`),
  adminShops: (params?: string) => request<Paginated<Shop>>(`/api/admin/shops${params ? `?${params}` : ''}`),
  adminShop: (id: string) => request<{ data: Shop; listings: Listing[] }>(`/api/admin/shops/${id}`),
  updateShopStatus: (id: string, status: string) =>
    request('/api/admin/shops', { method: 'PATCH', body: JSON.stringify({ id, status }) }),
  adminReports: (params?: string) => request<Paginated<Report> & { counts: { open: number; reviewing: number; resolved: number; dismissed: number } }>(`/api/admin/reports${params ? `?${params}` : ''}`),
  adminReport: (id: string) => request<{ data: Report; related: Report[] }>(`/api/admin/reports/${id}`),
  adminPayments: (params?: string) => request<Paginated<Payment>>(`/api/admin/payments${params ? `?${params}` : ''}`),
  adminPayment: (id: string) => request<{ data: Payment }>(`/api/admin/payments/${id}`),
  adminArticles: (params?: string) => request<Paginated<Article>>(`/api/admin/articles${params ? `?${params}` : ''}`),
  adminArticle: (id: string) => request<{ data: Article }>(`/api/admin/articles/${id}`),
  createArticle: (body: Record<string, unknown>) =>
    request<{ data: Article }>('/api/admin/articles', { method: 'POST', body: JSON.stringify(body) }),
  updateArticle: (id: string, body: Record<string, unknown>) =>
    request<{ data: Article }>(`/api/admin/articles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminMessages: (params?: string) => request<Paginated<Conversation>>(`/api/admin/messages${params ? `?${params}` : ''}`),
  adminThread: (id: string) => request<{ data: Conversation; messages: Message[] }>(`/api/admin/messages/${id}`),
  adminAudit: (params?: string) => request<Paginated<AuditLog>>(`/api/admin/audit${params ? `?${params}` : ''}`),
  adminAnalytics: (params?: string) => request<AdminAnalytics>(`/api/admin/analytics${params ? `?${params}` : ''}`),
  adminHealth: () => request<{ ok: boolean; database: string; time: string }>('/api/health'),
  adminSettings: () => request<{ data: AdminSettingsSnapshot }>('/api/admin/settings'),
  resolveReport: (id: string, status: string) =>
    request(`/api/admin/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  moderateListing: (id: string, body: Record<string, unknown>) =>
    request('/api/admin/listings', { method: 'PATCH', body: JSON.stringify({ id, ...body }) }),
  updateUser: (id: string, body: Record<string, unknown>) =>
    request('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ id, ...body }) }),
  publishArticle: (id: string, status: string) =>
    request(`/api/admin/articles/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  track: (event_name: string, metadata?: Record<string, unknown>, listing_id?: string) =>
    request('/api/analytics', { method: 'POST', body: JSON.stringify({ event_name, metadata, listing_id }) }).catch(() => null),
  uploadMedia: async (listingId: string, file: File) => {
    const form = new FormData()
    form.set('listing_id', listingId)
    form.set('file', file)
    const response = await fetch('/api/media', { method: 'POST', body: form, credentials: 'include' })
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    if (!response.ok) throw new Error(payload.error || 'Unable to upload image.')
    return payload
  },
  uploadAvatar: async (file: File) => {
    const form = new FormData()
    form.set('kind', 'avatar')
    form.set('file', file)
    const response = await fetch('/api/media', { method: 'POST', body: form, credentials: 'include' })
    const payload = (await response.json().catch(() => ({}))) as { data?: Profile; url?: string; error?: string }
    if (!response.ok) throw new Error(payload.error || 'Unable to upload photo.')
    return payload
  },
  uploadShopCover: async (file: File) => {
    const form = new FormData()
    form.set('kind', 'shop-cover')
    form.set('file', file)
    const response = await fetch('/api/media', { method: 'POST', body: form, credentials: 'include' })
    const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string }
    if (!response.ok) throw new Error(payload.error || 'Unable to upload cover.')
    return payload
  },
}
