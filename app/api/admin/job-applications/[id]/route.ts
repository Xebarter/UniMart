import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import { careersSchemaError, isApplicationStatus } from '@/lib/careers'

type Params = { params: Promise<{ id: string }> }

const SELECT = '*, job_roles(id, title, slug, department, status)'

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (careersSchemaError(error)) {
    return jsonError('Careers tables are not initialized. Run scripts/012_careers.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('job_applications').select(SELECT).eq('id', id).maybeSingle()
  if (error) return schemaOrDb(error, 'Unable to load application.')
  if (!data) return jsonError('Application not found.', 404)
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
    if (!isApplicationStatus(body.status)) return jsonError('Invalid status.')
    updates.status = body.status
  }
  if (typeof body.notes === 'string') updates.notes = body.notes.trim().slice(0, 8000)
  if (!Object.keys(updates).length) return jsonError('No updates provided.')

  const { data, error } = await auth.supabase.from('job_applications').update(updates).eq('id', id).select(SELECT).single()
  if (error) return schemaOrDb(error, 'Unable to update application.', 400)
  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'career.application',
    entityType: 'job_application',
    entityId: id,
    metadata: updates,
  })
  return jsonOk({ data })
}
