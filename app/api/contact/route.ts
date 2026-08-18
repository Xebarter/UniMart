import { contactSchemaError, contactText, DEFAULT_CONTACT_PAGE } from '@/lib/contact'
import { dbError, jsonError, jsonOk, parseJson } from '@/lib/api/http'
import { createClient } from '@/lib/supabase/server'
import type { ContactChannel, ContactPageSettings, ContactTopic } from '@/lib/types'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET() {
  const supabase = await createClient()
  const [{ data: settings, error: settingsError }, { data: channels, error: channelsError }, { data: topics, error: topicsError }] = await Promise.all([
    supabase.from('contact_page_settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('contact_channels').select('*').eq('published', true).order('sort_order', { ascending: true }),
    supabase.from('contact_topics').select('*').eq('published', true).order('sort_order', { ascending: true }),
  ])

  if (contactSchemaError(settingsError) || contactSchemaError(channelsError) || contactSchemaError(topicsError)) {
    return jsonOk({
      settings: DEFAULT_CONTACT_PAGE,
      channels: [] as ContactChannel[],
      topics: [] as ContactTopic[],
    })
  }
  if (settingsError) return dbError(settingsError, 'Unable to load contact page.')
  if (channelsError) return dbError(channelsError, 'Unable to load contact channels.')
  if (topicsError) return dbError(topicsError, 'Unable to load contact topics.')

  return jsonOk({
    settings: (settings as ContactPageSettings | null) ?? DEFAULT_CONTACT_PAGE,
    channels: (channels ?? []) as ContactChannel[],
    topics: (topics ?? []) as ContactTopic[],
  })
}

export async function POST(request: Request) {
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  if (contactText(body.company_website, 200)) return jsonOk({ ok: true }, 201)

  const name = contactText(body.name, 120)
  const email = contactText(body.email, 160).toLowerCase()
  const message = contactText(body.message, 8000)
  const subject = contactText(body.subject, 160)
  const phone = contactText(body.phone, 40)
  const topicId = typeof body.topic_id === 'string' && body.topic_id.trim() ? body.topic_id.trim() : null

  if (name.length < 2) return jsonError('Please tell us your name.')
  if (!EMAIL.test(email)) return jsonError('Enter a valid email address.')
  if (message.length < 20) return jsonError('Write a little more so we can help.')

  const supabase = await createClient()
  const { data: settings, error: settingsError } = await supabase
    .from('contact_page_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  if (contactSchemaError(settingsError)) {
    return jsonError('Contact tables are not initialized. Run scripts/013_contact.sql in the Supabase SQL editor.', 503)
  }
  if (settingsError) return dbError(settingsError, 'Unable to send your message.')

  const page = (settings as ContactPageSettings | null) ?? DEFAULT_CONTACT_PAGE
  if (!page.accept_inquiries) return jsonError('The contact form is closed right now. Please use one of the published channels instead.')

  if (topicId) {
    const { data: topic, error: topicError } = await supabase
      .from('contact_topics')
      .select('id, published')
      .eq('id', topicId)
      .maybeSingle()
    if (topicError) return dbError(topicError, 'Unable to send your message.')
    if (!topic?.published) return jsonError('Choose a valid topic.')
  }

  const { error } = await supabase.from('contact_inquiries').insert({
    topic_id: topicId,
    name,
    email,
    phone,
    subject,
    message,
    status: 'new',
  })
  if (error) return dbError(error, 'Unable to send your message.', 400)
  return jsonOk({ ok: true }, 201)
}
