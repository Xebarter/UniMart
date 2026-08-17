export const LISTING_CATEGORIES = ['Products', 'Services', 'Rentals', 'Gigs'] as const
export type ListingCategory = (typeof LISTING_CATEGORIES)[number]
export type ListingStatus = 'draft' | 'pending' | 'active' | 'sold' | 'archived' | 'removed'

export type Profile = {
  id: string
  display_name: string
  university: string | null
  campus: string | null
  bio: string | null
  avatar_url: string | null
  role: 'student' | 'moderator' | 'admin'
  verified: boolean
  created_at: string
  updated_at: string
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
  status: ListingStatus
  featured_until: string | null
  view_count: number
  created_at: string
  updated_at: string
  listing_media?: ListingMedia[]
  profiles?: Pick<Profile, 'id' | 'display_name' | 'university' | 'campus' | 'avatar_url' | 'verified'> | null
  saved?: boolean
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

export type Report = {
  id: string
  reporter_id: string
  listing_id: string | null
  reported_user_id: string | null
  reason: string
  details: string
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
  created_at: string
  listings?: Pick<Listing, 'id' | 'title'> | null
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
  users_change: number
  listings_change: number
  reports_change: number
  volume_change: number
  activity: number[]
  by_category: { label: ListingCategory; count: number; percent: string }[]
}
