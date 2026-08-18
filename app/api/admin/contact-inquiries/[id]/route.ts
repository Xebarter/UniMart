import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import { contactSchemaError, isContactInquiryStatus } from '@/lib/contact'

type Params = { params: Promise<{ id: string }> }

const SELECT = '*, contact_topics(id, label)'

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (contactSchemaError(error)) {
    return jsonError('Contact tables are not initialized. Run scripts/013_contact.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('contact_inquiries').select(SELECT).eq('id', id).maybeSingle()
  if (error) return schemaOrDb(error, 'Unable to load inquiry.')
  if (!data) return jsonError('Inquiry not found.', 404)
  return jsonOk({ data })
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')

  const updates: Record<string, unknown> = {}
  if (typeof body.status === 'string') {
    if (!isContactInquiryStatus(body.status)) return jsonError('Invalid status.')
    updates.status = body.status
  }
  if (typeof body.notes === 'string') updates.notes = body.notes.trim().slice(0, 8000)
  if (!Object.keys(updates).length) return jsonError('No updates provided.')

  const { data, error } = await auth.supabase.from('contact_inquiries').update(updates).eq('id', id).select(SELECT).single()
  if (error) return schemaOrDb(error, 'Unable to update inquiry.', 400)
  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'contact.inquiry',
    entityType: 'contact_inquiry',
    entityId: id,
    metadata: updates,
  })
  return jsonOk({ data })
}
