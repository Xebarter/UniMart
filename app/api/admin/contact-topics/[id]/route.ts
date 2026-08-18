import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import { contactSchemaError, topicFromBody } from '@/lib/contact'

type Params = { params: Promise<{ id: string }> }

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (contactSchemaError(error)) {
    return jsonError('Contact tables are not initialized. Run scripts/013_contact.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  const payload = topicFromBody(body)
  if (!payload.label) return jsonError('Give this topic a label.')

  const { data, error } = await auth.supabase.from('contact_topics').update(payload).eq('id', id).select().single()
  if (error) return schemaOrDb(error, 'Unable to update topic.', 400)
  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'contact.topic.update',
    entityType: 'contact_topic',
    entityId: id,
    metadata: payload,
  })
  return jsonOk({ data })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { error } = await auth.supabase.from('contact_topics').delete().eq('id', id)
  if (error) return schemaOrDb(error, 'Unable to delete topic.', 400)
  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'contact.topic.delete',
    entityType: 'contact_topic',
    entityId: id,
  })
  return jsonOk({ ok: true })
}
