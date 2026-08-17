import type { AdminStats, Article, Conversation, Listing, Message, Notification, Profile, Report } from '@/lib/types'

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
  profile: () => request<{ data: Profile | null; user: { id: string; email?: string } }>('/api/profile'),
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
  follows: () => request<{ data: Profile[] }>('/api/follows'),
  checkout: (body: { listing_id: string; method: 'mobile_money' | 'card' }) =>
    request<{ checkout_url: string }>('/api/payments/checkout', { method: 'POST', body: JSON.stringify(body) }),
  adminStats: () => request<{ data: AdminStats }>('/api/admin/stats'),
  adminUsers: () => request<{ data: Profile[] }>('/api/admin/users'),
  adminReports: () => request<{ data: Report[] }>('/api/reports'),
  resolveReport: (id: string, status: string) =>
    request(`/api/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  moderateListing: (id: string, status: string) =>
    request(`/api/admin/listings`, { method: 'PATCH', body: JSON.stringify({ id, status }) }),
  updateUser: (id: string, body: Record<string, unknown>) =>
    request('/api/admin/users', { method: 'PATCH', body: JSON.stringify({ id, ...body }) }),
  publishArticle: (id: string, status: string) =>
    request('/api/admin/articles', { method: 'PATCH', body: JSON.stringify({ id, status }) }),
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
}
