import type { NotificationPreferences } from '@/lib/types'

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  push_enabled: false,
  push_messages: true,
  push_sales: true,
  push_favorites: true,
  push_follows: true,
  push_report_updates: true,
  push_account_notices: true,
}
