import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import { contactSchemaError, DEFAULT_CONTACT_PAGE } from '@/lib/contact'
import type { ContactChannel, ContactPageSettings, ContactTopic } from '@/lib/types'

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (contactSchemaError(error)) {
    return jsonError('Contact tables are not initialized. Run scripts/013_contact.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const [{ data: settings, error: settingsError }, { data: channels, error: channelsError }, { data: topics, error: topicsError }] = await Promise.all([
    auth.supabase.from('contact_page_settings').select('*').eq('id', 1).maybeSingle(),
    auth.supabase.from('contact_channels').select('*').order('sort_order', { ascending: true }),
    auth.supabase.from('contact_topics').select('*').order('sort_order', { ascending: true }),
  ])
  if (settingsError) return schemaOrDb(settingsError, 'Unable to load contact page copy.')
  if (channelsError) return schemaOrDb(channelsError, 'Unable to load contact channels.')
  if (topicsError) return schemaOrDb(topicsError, 'Unable to load contact topics.')
  return jsonOk({
    data: (settings as ContactPageSettings | null) ?? DEFAULT_CONTACT_PAGE,
    channels: (channels ?? []) as ContactChannel[],
    topics: (topics ?? []) as ContactTopic[],
  })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')

  const updates: Record<string, unknown> = {}
  if (typeof body.headline === 'string') updates.headline = body.headline.trim().slice(0, 160) || DEFAULT_CONTACT_PAGE.headline
  if (typeof body.intro === 'string') updates.intro = body.intro.trim().slice(0, 1200) || DEFAULT_CONTACT_PAGE.intro
  if (typeof body.response_note === 'string') updates.response_note = body.response_note.trim().slice(0, 240) || DEFAULT_CONTACT_PAGE.response_note
  if (typeof body.office_label === 'string') updates.office_label = body.office_label.trim().slice(0, 120) || DEFAULT_CONTACT_PAGE.office_label
  if (typeof body.office_address === 'string') updates.office_address = body.office_address.trim().slice(0, 240) || DEFAULT_CONTACT_PAGE.office_address
  if (typeof body.hours === 'string') updates.hours = body.hours.trim().slice(0, 160) || DEFAULT_CONTACT_PAGE.hours
  if (typeof body.accept_inquiries === 'boolean') updates.accept_inquiries = body.accept_inquiries
  if (!Object.keys(updates).length) return jsonError('No updates provided.')

  const { data, error } = await auth.supabase
    .from('contact_page_settings')
    .update(updates)
    .eq('id', 1)
    .select()
    .single()
  if (error) return schemaOrDb(error, 'Unable to update contact page copy.', 400)
  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'contact.page',
    entityType: 'contact_page',
    entityId: '1',
    metadata: updates,
  })
  return jsonOk({ data })
}
