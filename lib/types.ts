export const LISTING_CATEGORIES = ['Products', 'Services', 'Rentals', 'Gigs'] as const
export type ListingCategory = (typeof LISTING_CATEGORIES)[number]
export const RENT_PERIODS = ['day', 'week', 'month'] as const
export type RentPeriod = (typeof RENT_PERIODS)[number]
export type ListingStatus = 'draft' | 'pending' | 'active' | 'sold' | 'archived' | 'removed'

export type AccountStatus = 'active' | 'suspended' | 'banned'
export type UserRole = 'student' | 'moderator' | 'admin'

export type Profile = {
  id: string
  display_name: string
  university: string | null
  campus: string | null
  bio: string | null
  avatar_url: string | null
  role: UserRole
  verified: boolean
  account_status?: AccountStatus
  created_at: string
  updated_at: string
  email?: string | null
}

export type ListingMedia = {
  id: string
  listing_id: string
  owner_id: string
  storage_path: string
  alt_text: string
  sort_order: number
  public_url?: string
}

export type Listing = {
  id: string
  owner_id: string
  title: string
  description: string
  category: ListingCategory
  price: number
  currency: string
  location: string
  condition: string
  rent_period?: RentPeriod | null
  status: ListingStatus
  featured_until: string | null
  view_count: number
  shop_id?: string | null
  created_at: string
  updated_at: string
  listing_media?: ListingMedia[]
  profiles?: Pick<Profile, 'id' | 'display_name' | 'university' | 'campus' | 'avatar_url' | 'verified'> | null
  saved?: boolean
}

export type ShopStatus = 'active' | 'disabled'

export type Shop = {
  id: string
  owner_id: string
  name: string
  slug: string
  bio: string | null
  cover_url: string | null
  status?: ShopStatus
  created_at: string
  updated_at: string
  listing_count?: number
  follower_count?: number
  following?: boolean
  profiles?: Pick<Profile, 'id' | 'display_name' | 'university' | 'campus' | 'avatar_url' | 'verified'> | null
}

export type FollowedProfile = Profile & {
  shop: Pick<Shop, 'name' | 'slug'> | null
}

export type Article = {
  id: string
  author_id: string | null
  title: string
  slug: string
  excerpt: string
  body: string
  type: string
  cover_color: string
  accent_color: string
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  created_at: string
}

export type Conversation = {
  id: string
  listing_id: string | null
  created_at: string
  updated_at: string
  listing?: Pick<Listing, 'id' | 'title' | 'price' | 'category'> | null
  conversation_members?: { user_id: string; last_read_at?: string | null; profiles?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null }[]
  messages?: { id: string; body: string; created_at: string; sender_id: string }[]
  unread_count?: number
  other?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed'

export type Report = {
  id: string
  reporter_id: string
  listing_id: string | null
  reported_user_id: string | null
  reason: string
  details: string
  status: ReportStatus
  created_at: string
  resolved_at?: string | null
  resolved_by?: string | null
  listings?: (Pick<Listing, 'id' | 'title'> & { category?: Listing['category']; listing_media?: Listing['listing_media'] }) | null
  reporter?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null
  reported_user?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired'
export type PaymentProvider = 'paytota' | 'dpo'

export type Payment = {
  id: string
  user_id: string
  listing_id: string | null
  provider: PaymentProvider
  purpose: string
  amount: number
  currency: string
  status: PaymentStatus
  provider_payment_id: string | null
  provider_reference: string | null
  checkout_url: string | null
  raw?: Record<string, unknown>
  paid_at: string | null
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null
  listings?: Pick<Listing, 'id' | 'title'> | null
}

export type AuditLog = {
  id: string
  actor_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  actor?: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'role'> | null
}

export type AnalyticsEvent = {
  id: string
  user_id: string | null
  event_name: string
  listing_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  listings?: Pick<Listing, 'id' | 'title'> | null
  profiles?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null
}

export type AdminAnalytics = {
  range_days: number
  total_events: number
  events_change: number
  unique_users: number
  unique_users_change: number
  unique_listings: number
  event_types: number
  identified_share: number
  listing_share: number
  activity: { date: string; events: number; users: number }[]
  totals: { event_name: string; count: number; percent: string }[]
  event_names: string[]
  top_listings: {
    id: string
    title: string
    category: ListingCategory
    count: number
    listing_media?: ListingMedia[]
  }[]
  top_users: { id: string; display_name: string; avatar_url: string | null; count: number }[]
  data: AnalyticsEvent[]
  total: number
  page: number
  pageSize: number
}

export type Paginated<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export type AdminOperator = {
  id: string
  name: string
  role: UserRole
  canManageRoles: boolean
  accountStatus?: AccountStatus
}

export type AdminSettingsSnapshot = {
  checked_at: string
  environment: 'production' | 'development'
  app_url: string | null
  database: 'ready' | 'uninitialized'
  schema: {
    audit_logs: boolean
    account_status: boolean
    shop_status: boolean
    ops_ready: boolean
  }
  integrations: {
    supabase: boolean
    firebase: boolean
    google_auth: boolean
    paytota: boolean
    paytota_webhook: boolean
    dpo: boolean
    app_url: boolean
    service_role: boolean
  }
  operator: {
    id: string
    email: string | null
    name: string
    role: UserRole
    account_status: AccountStatus
    avatar_url: string | null
    verified: boolean
    created_at: string | null
    campus: string | null
    university: string | null
  }
}

export type Notification = {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  listing_id: string | null
  conversation_id: string | null
  read_at: string | null
  created_at: string
}

export type AdminStats = {
  total_users: number
  active_listings: number
  pending_reports: number
  gross_volume: number
  total_shops: number
  featured_listings: number
  paid_features: number
  users_change: number
  listings_change: number
  reports_change: number
  volume_change: number
  range_days: number
  activity: { date: string; listings: number; users: number }[]
  by_category: { label: ListingCategory; count: number; percent: string }[]
  queues: {
    reports: Report[]
    listings: Pick<Listing, 'id' | 'title' | 'status' | 'category' | 'created_at'>[]
    payments: Payment[]
  }
}
