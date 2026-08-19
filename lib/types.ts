export const LISTING_CATEGORIES = ['Products', 'Services', 'Rentals', 'Gigs'] as const
export type ListingCategory = (typeof LISTING_CATEGORIES)[number]
export const RENT_PERIODS = ['day', 'week', 'month'] as const
export type RentPeriod = (typeof RENT_PERIODS)[number]
export type ListingStatus = 'draft' | 'pending' | 'active' | 'unavailable' | 'sold' | 'archived' | 'removed'

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
  student_number?: string | null
  phone_primary?: string | null
  phone_secondary?: string | null
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
  profiles?: Pick<Profile, 'id' | 'display_name' | 'university' | 'campus' | 'avatar_url' | 'verified' | 'phone_primary' | 'phone_secondary'> | null
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
  profiles?: Pick<Profile, 'id' | 'display_name' | 'university' | 'campus' | 'avatar_url' | 'verified' | 'phone_primary' | 'phone_secondary'> | null
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
  cover_url?: string | null
  cover_color: string
  accent_color: string
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  created_at: string
}

export const JOB_EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship'] as const
export type JobEmploymentType = (typeof JOB_EMPLOYMENT_TYPES)[number]

export const JOB_WORKPLACES = ['onsite', 'remote', 'hybrid'] as const
export type JobWorkplace = (typeof JOB_WORKPLACES)[number]

export const JOB_STATUSES = ['draft', 'published', 'closed', 'archived'] as const
export type JobStatus = (typeof JOB_STATUSES)[number]

export const JOB_APPLICATION_STATUSES = ['new', 'reviewing', 'shortlisted', 'rejected', 'hired'] as const
export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number]

export const JOB_DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Operations',
  'Trust & safety',
  'Marketing',
  'General',
] as const

export type JobRole = {
  id: string
  created_by: string | null
  title: string
  slug: string
  department: string
  location: string
  employment_type: JobEmploymentType
  workplace: JobWorkplace
  excerpt: string
  description: string
  requirements: string
  benefits: string
  apply_email: string | null
  apply_url: string | null
  featured: boolean
  sort_order: number
  status: JobStatus
  published_at: string | null
  closes_at: string | null
  created_at: string
  updated_at?: string
}

export type CareerPageSettings = {
  id: number
  headline: string
  intro: string
  apply_email: string
  accept_general: boolean
  updated_at?: string
}

export const CONTACT_CHANNEL_ICONS = ['mail', 'message', 'map', 'phone', 'globe', 'shield', 'newspaper'] as const
export type ContactChannelIcon = (typeof CONTACT_CHANNEL_ICONS)[number]

export const CONTACT_INQUIRY_STATUSES = ['new', 'reviewing', 'replied', 'closed'] as const
export type ContactInquiryStatus = (typeof CONTACT_INQUIRY_STATUSES)[number]

export type ContactPageSettings = {
  id: number
  headline: string
  intro: string
  response_note: string
  office_label: string
  office_address: string
  hours: string
  accept_inquiries: boolean
  updated_at?: string
}

export type ContactChannel = {
  id: string
  title: string
  description: string
  value: string
  href: string
  icon: ContactChannelIcon | string
  sort_order: number
  published: boolean
  created_at: string
  updated_at?: string
}

export type ContactTopic = {
  id: string
  label: string
  description: string
  sort_order: number
  published: boolean
  created_at: string
  updated_at?: string
}

export type ContactInquiry = {
  id: string
  topic_id: string | null
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: ContactInquiryStatus
  notes: string
  created_at: string
  updated_at?: string
  contact_topics?: Pick<ContactTopic, 'id' | 'label'> | null
}

export type PressHighlight = {
  title: string
  body: string
}

export type PressFaq = {
  question: string
  answer: string
}

export type PressPage = {
  id: number
  eyebrow: string
  hero_title: string
  hero_subtitle: string
  contact_email: string
  contact_copy: string
  contact_sla: string
  boilerplate_title: string
  boilerplate: string
  highlights: PressHighlight[]
  quote_text: string
  quote_attribution: string
  quote_role: string
  faqs: PressFaq[]
  media_notes: string
  updated_at?: string
}

export const NEWSLETTER_STATUSES = ['pending', 'subscribed', 'unsubscribed'] as const
export type NewsletterStatus = (typeof NEWSLETTER_STATUSES)[number]

export const NEWSLETTER_SOURCES = ['footer', 'settings', 'admin'] as const
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number]

export const UNSUBSCRIBE_REASONS = [
  { value: 'too-many', label: 'Too many emails' },
  { value: 'not-relevant', label: 'The content is not relevant' },
  { value: 'never-signed-up', label: 'I never signed up' },
  { value: 'temporary', label: 'I only wanted a one-time update' },
  { value: 'other', label: 'Something else' },
] as const
export type UnsubscribeReason = (typeof UNSUBSCRIBE_REASONS)[number]['value']

export type NewsletterSubscriber = {
  id: string
  email: string
  status: NewsletterStatus
  source: NewsletterSource | string
  user_id: string | null
  confirm_token?: string | null
  unsubscribe_token?: string | null
  confirmed_at: string | null
  unsubscribed_at: string | null
  notes: string
  created_at: string
  updated_at?: string
}

export type JobApplication = {
  id: string
  role_id: string | null
  name: string
  email: string
  phone: string
  location: string
  portfolio_url: string
  linkedin_url: string
  resume_url: string
  cover_letter: string
  status: JobApplicationStatus
  notes: string
  created_at: string
  updated_at?: string
  job_roles?: Pick<JobRole, 'id' | 'title' | 'slug' | 'department' | 'status'> | null
}

export const GIG_APPLICATION_STATUSES = ['submitted', 'withdrawn'] as const
export type GigApplicationStatus = (typeof GIG_APPLICATION_STATUSES)[number]

export type GigApplication = {
  id: string
  listing_id: string
  applicant_id: string
  conversation_id: string | null
  cover_letter: string
  resume_path: string
  name: string
  email: string
  phone: string
  student_number: string
  university: string
  campus: string
  status: GigApplicationStatus
  created_at: string
  updated_at?: string
  profiles?: Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'university' | 'campus'> | null
}

export type MessageKind = 'text' | 'gig_application'

export type Conversation = {
  id: string
  listing_id: string | null
  created_at: string
  updated_at: string
  listing?: Pick<Listing, 'id' | 'title' | 'price' | 'category'> | null
  conversation_members?: { user_id: string; last_read_at?: string | null; profiles?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null }[]
  messages?: { id: string; body: string; created_at: string; sender_id: string; kind?: MessageKind; application_id?: string | null }[]
  unread_count?: number
  other?: Pick<Profile, 'id' | 'display_name' | 'avatar_url'> | null
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  kind?: MessageKind
  application_id?: string | null
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

export type FeaturePrice = {
  category: ListingCategory
  amount_ugx: number
  updated_at?: string
  updated_by?: string | null
}

export type FeaturePriceMap = Record<ListingCategory, number>

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
    job_roles: boolean
    press_pages: boolean
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

export const NOTIFICATION_TYPES = ['message', 'sale', 'favorite', 'follow', 'report_update', 'account_notice', 'gig_application'] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export type Notification = {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  listing_id: string | null
  conversation_id: string | null
  actor_id?: string | null
  path?: string | null
  metadata?: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export type NotificationPreferences = {
  user_id?: string
  push_enabled: boolean
  push_messages: boolean
  push_sales: boolean
  push_favorites: boolean
  push_follows: boolean
  push_report_updates: boolean
  push_account_notices: boolean
  created_at?: string
  updated_at?: string
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
