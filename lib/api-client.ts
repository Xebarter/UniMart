import type {
  AdminAnalytics,
  AdminSettingsSnapshot,
  AdminStats,
  Article,
  AuditLog,
  CareerPageSettings,
  ContactChannel,
  ContactInquiry,
  ContactPageSettings,
  ContactTopic,
  PressPage,
  NewsletterSubscriber,
  JobApplication,
  JobRole,
  Conversation,
  FollowedProfile,
  Listing,
  Message,
  Notification,
  NotificationPreferences,
  NotificationType,
  Paginated,
  Payment,
  Profile,
  Report,
  Shop,
} from '@/lib/types'

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
  careers: () => request<{ data: JobRole[]; settings: CareerPageSettings }>('/api/careers'),
  career: (slug: string) => request<{ data: JobRole; settings: CareerPageSettings }>(`/api/careers/${slug}`),
  applyCareer: (body: Record<string, unknown>) =>
    request<{ ok: boolean }>('/api/careers/apply', { method: 'POST', body: JSON.stringify(body) }),
  contactPage: () =>
    request<{ settings: ContactPageSettings; channels: ContactChannel[]; topics: ContactTopic[] }>('/api/contact'),
  submitContact: (body: Record<string, unknown>) =>
    request<{ ok: boolean }>('/api/contact', { method: 'POST', body: JSON.stringify(body) }),
  adminContactPage: () =>
    request<{ data: ContactPageSettings; channels: ContactChannel[]; topics: ContactTopic[] }>('/api/admin/contact-page'),
  updateContactPage: (body: Record<string, unknown>) =>
    request<{ data: ContactPageSettings }>('/api/admin/contact-page', { method: 'PATCH', body: JSON.stringify(body) }),
  createContactChannel: (body: Record<string, unknown>) =>
    request<{ data: ContactChannel }>('/api/admin/contact-channels', { method: 'POST', body: JSON.stringify(body) }),
  updateContactChannel: (id: string, body: Record<string, unknown>) =>
    request<{ data: ContactChannel }>(`/api/admin/contact-channels/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteContactChannel: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/contact-channels/${id}`, { method: 'DELETE' }),
  createContactTopic: (body: Record<string, unknown>) =>
    request<{ data: ContactTopic }>('/api/admin/contact-topics', { method: 'POST', body: JSON.stringify(body) }),
  updateContactTopic: (id: string, body: Record<string, unknown>) =>
    request<{ data: ContactTopic }>(`/api/admin/contact-topics/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteContactTopic: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/contact-topics/${id}`, { method: 'DELETE' }),
  adminContactInquiries: (params?: string) =>
    request<Paginated<ContactInquiry> & { counts: { new: number; reviewing: number; replied: number; closed: number } }>(
      `/api/admin/contact-inquiries${params ? `?${params}` : ''}`,
    ),
  adminContactInquiry: (id: string) => request<{ data: ContactInquiry }>(`/api/admin/contact-inquiries/${id}`),
  updateContactInquiry: (id: string, body: Record<string, unknown>) =>
    request<{ data: ContactInquiry }>(`/api/admin/contact-inquiries/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminCareers: (params?: string) =>
    request<Paginated<JobRole> & { counts: { draft: number; published: number; closed: number; archived: number }; applications: { new: number; total: number } }>(
      `/api/admin/careers${params ? `?${params}` : ''}`,
    ),
  adminCareer: (id: string) => request<{ data: JobRole }>(`/api/admin/careers/${id}`),
  createCareer: (body: Record<string, unknown>) =>
    request<{ data: JobRole }>('/api/admin/careers', { method: 'POST', body: JSON.stringify(body) }),
  updateCareer: (id: string, body: Record<string, unknown>) =>
    request<{ data: JobRole }>(`/api/admin/careers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminCareerPage: () => request<{ data: CareerPageSettings }>('/api/admin/career-page'),
  updateCareerPage: (body: Record<string, unknown>) =>
    request<{ data: CareerPageSettings }>('/api/admin/career-page', { method: 'PATCH', body: JSON.stringify(body) }),
  press: () => request<{ data: PressPage }>('/api/press'),
  adminPress: () => request<{ data: PressPage }>('/api/admin/press'),
  updateAdminPress: (body: Record<string, unknown>) =>
    request<{ data: PressPage }>('/api/admin/press', { method: 'PATCH', body: JSON.stringify(body) }),
  subscribe: (body: Record<string, unknown>) =>
    request<{ ok: boolean; status: string; already?: boolean; resumed?: boolean }>('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  newsletterMe: () =>
    request<{ subscribed: boolean; status: string; email: string | null; available: boolean }>('/api/subscribe/me'),
  updateNewsletterMe: (body: { subscribed: boolean }) =>
    request<{ subscribed: boolean; status: string }>('/api/subscribe/me', { method: 'PATCH', body: JSON.stringify(body) }),
  unsubscribePreview: (token: string) =>
    request<{ status: string; email: string; subscribed: boolean }>(`/api/subscribe/unsubscribe?token=${encodeURIComponent(token)}`),
  unsubscribe: (token: string) =>
    request<{ ok: boolean; status: string }>('/api/subscribe/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),
  adminSubscribers: (params?: string) =>
    request<Paginated<NewsletterSubscriber> & { counts: { subscribed: number; unsubscribed: number; pending: number } }>(
      `/api/admin/subscribers${params ? `?${params}` : ''}`,
    ),
  adminSubscriber: (id: string) => request<{ data: NewsletterSubscriber; unsubscribe_url: string }>(`/api/admin/subscribers/${id}`),
  updateAdminSubscriber: (id: string, body: Record<string, unknown>) =>
    request<{ data: NewsletterSubscriber }>(`/api/admin/subscribers/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteAdminSubscriber: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/subscribers/${id}`, { method: 'DELETE' }),
  adminJobApplications: (params?: string) =>
    request<Paginated<JobApplication> & { counts: { new: number; reviewing: number; shortlisted: number; rejected: number; hired: number } }>(
      `/api/admin/job-applications${params ? `?${params}` : ''}`,
    ),
  adminJobApplication: (id: string) => request<{ data: JobApplication }>(`/api/admin/job-applications/${id}`),
  updateJobApplication: (id: string, body: Record<string, unknown>) =>
    request<{ data: JobApplication }>(`/api/admin/job-applications/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  conversations: () => request<{ data: Conversation[] }>('/api/conversations'),
  startConversation: (body: { recipient_id: string; listing_id?: string }) =>
    request<{ data: Conversation }>('/api/conversations', { method: 'POST', body: JSON.stringify(body) }),
  messages: (conversation_id: string) =>
    request<{ data: Message[] }>(`/api/messages?conversation_id=${conversation_id}`),
  sendMessage: (body: { conversation_id: string; body: string }) =>
    request<{ data: Message }>('/api/messages', { method: 'POST', body: JSON.stringify(body) }),
  markRead: (conversation_id: string) =>
    request('/api/messages/read', { method: 'POST', body: JSON.stringify({ conversation_id }) }),
  notifications: (params?: {
    unread?: boolean
    type?: NotificationType | 'all'
    limit?: number
    before?: string
  }) => {
    const search = new URLSearchParams()
    if (params?.unread) search.set('unread', '1')
    if (params?.type && params.type !== 'all') search.set('type', params.type)
    if (params?.limit) search.set('limit', String(params.limit))
    if (params?.before) search.set('before', params.before)
    const query = search.toString()
    return request<{ data: Notification[]; unread: number; preferences: NotificationPreferences }>(`/api/notifications${query ? `?${query}` : ''}`)
  },
  markNotificationsRead: () => request<{ read: number }>('/api/notifications', { method: 'PATCH', body: JSON.stringify({ all: true }) }),
  markNotificationRead: (id: string) =>
    request<{ read: number }>('/api/notifications', { method: 'PATCH', body: JSON.stringify({ id }) }),
  updateNotificationPreferences: (body: Partial<NotificationPreferences>) =>
    request<{ preferences: NotificationPreferences }>('/api/notifications', { method: 'PUT', body: JSON.stringify(body) }),
  report: (body: Record<string, unknown>) =>
    request<{ data: Report }>('/api/reports', { method: 'POST', body: JSON.stringify(body) }),
  follow: (following_id: string) =>
    request('/api/follows', { method: 'POST', body: JSON.stringify({ following_id }) }),
  unfollow: (following_id: string) =>
    request('/api/follows', { method: 'DELETE', body: JSON.stringify({ following_id }) }),
  follows: () => request<{ data: FollowedProfile[] }>('/api/follows'),
  saveDeviceToken: (token: string, platform = 'web') =>
    request('/api/devices', { method: 'POST', body: JSON.stringify({ token, platform }) }),
  removeDeviceToken: (token: string) =>
    request('/api/devices', { method: 'DELETE', body: JSON.stringify({ token }) }),
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
  uploadArticleCover: async (file: File, onProgress?: (percent: number) => void) => {
    const form = new FormData()
    form.set('kind', 'article-cover')
    form.set('file', file)
    const { uploadFormWithProgress } = await import('@/lib/upload-with-progress')
    const payload = await uploadFormWithProgress('/api/media', form, onProgress)
    const url = typeof payload.url === 'string' ? payload.url : ''
    if (!url) throw new Error('Unable to upload article image.')
    return { url }
  },
}
