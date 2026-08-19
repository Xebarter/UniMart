import { getFirebaseAdminMessaging } from '@/lib/firebase-admin'
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/notification-prefs'
import type { createClient as createServerSupabase } from '@/lib/supabase/server'
import type { Notification, NotificationPreferences, NotificationType } from '@/lib/types'

type Supabase = Awaited<ReturnType<typeof createServerSupabase>>

type NotificationInsert = {
  user_id: string
  type: NotificationType
  title: string
  body?: string | null
  listing_id?: string | null
  conversation_id?: string | null
  actor_id?: string | null
  path?: string | null
  metadata?: Record<string, unknown>
}

export async function loadNotificationPreferences(supabase: Supabase, userId: string) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[unimart:notifications:prefs]', error.message)
    return { user_id: userId, ...DEFAULT_NOTIFICATION_PREFERENCES }
  }
  return { user_id: userId, ...DEFAULT_NOTIFICATION_PREFERENCES, ...(data ?? {}) } as NotificationPreferences
}

export async function saveNotificationPreferences(
  supabase: Supabase,
  userId: string,
  updates: Partial<NotificationPreferences>,
) {
  const cleaned = Object.fromEntries(Object.entries(updates).filter(([, value]) => typeof value === 'boolean'))
  const payload = {
    user_id: userId,
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...cleaned,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as NotificationPreferences
}

export async function createNotification(supabase: Supabase, input: NotificationInsert) {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      body: input.body ?? '',
      listing_id: input.listing_id ?? null,
      conversation_id: input.conversation_id ?? null,
      actor_id: input.actor_id ?? null,
      path: input.path ?? fallbackPath(input),
      metadata: input.metadata ?? {},
    })
    .select('*')
    .single()

  if (error) throw error
  const notification = data as Notification
  await dispatchPushReadyNotification(supabase, notification).catch((dispatchError) => {
    console.error('[unimart:notifications:push]', dispatchError instanceof Error ? dispatchError.message : dispatchError)
  })
  return notification
}

function fallbackPath(input: NotificationInsert) {
  if (input.conversation_id) return `/messages/${input.conversation_id}`
  if (input.listing_id) return `/listings/${input.listing_id}`
  return '/messages?tab=alerts'
}

function isPushEnabledForType(preferences: NotificationPreferences, type: NotificationType) {
  if (!preferences.push_enabled) return false
  if (type === 'message' || type === 'gig_application') return preferences.push_messages
  if (type === 'sale') return preferences.push_sales
  if (type === 'favorite') return preferences.push_favorites
  if (type === 'follow') return preferences.push_follows
  if (type === 'report_update') return preferences.push_report_updates
  return preferences.push_account_notices
}

async function dispatchPushReadyNotification(supabase: Supabase, notification: Notification) {
  const preferences = await loadNotificationPreferences(supabase, notification.user_id)
  if (!isPushEnabledForType(preferences, notification.type)) return

  const { data: tokens, error } = await supabase
    .from('push_tokens')
    .select('token, platform')
    .eq('user_id', notification.user_id)

  if (error) throw error
  if (!tokens?.length) return
  const messaging = getFirebaseAdminMessaging()
  if (!messaging) return

  await messaging.sendEachForMulticast({
    tokens: tokens.map((item) => item.token),
    notification: {
      title: notification.title,
      body: notification.body,
    },
    webpush: {
      fcmOptions: {
        link: notification.path ?? '/messages?tab=alerts',
      },
      notification: {
        icon: '/favicon.ico',
      },
    },
    data: {
      notificationId: notification.id,
      type: notification.type,
      path: notification.path ?? '/messages?tab=alerts',
    },
  })
}
