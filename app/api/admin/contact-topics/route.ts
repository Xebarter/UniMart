import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import { contactSchemaError, topicFromBody } from '@/lib/contact'

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (contactSchemaError(error)) {
    return jsonError('Contact tables are not initialized. Run scripts/013_contact.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  const payload = topicFromBody(body)
  if (!payload.label) return jsonError('Give this topic a label.')

  const { data, error } = await auth.supabase.from('contact_topics').insert(payload).select().single()
  if (error) return schemaOrDb(error, 'Unable to create topic.', 400)
  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'contact.topic.create',
    entityType: 'contact_topic',
    entityId: data.id,
    metadata: { label: payload.label },
  })
  return jsonOk({ data }, 201)
}
