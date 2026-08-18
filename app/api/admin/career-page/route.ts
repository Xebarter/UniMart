import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import { careersSchemaError, DEFAULT_CAREER_PAGE } from '@/lib/careers'
import type { CareerPageSettings } from '@/lib/types'

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (careersSchemaError(error)) {
    return jsonError('Careers tables are not initialized. Run scripts/012_careers.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('career_page_settings').select('*').eq('id', 1).maybeSingle()
  if (error) return schemaOrDb(error, 'Unable to load careers page copy.')
  return jsonOk({ data: (data as CareerPageSettings | null) ?? DEFAULT_CAREER_PAGE })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')

  const updates: Record<string, unknown> = {}
  if (typeof body.headline === 'string') updates.headline = body.headline.trim().slice(0, 160) || DEFAULT_CAREER_PAGE.headline
  if (typeof body.intro === 'string') updates.intro = body.intro.trim().slice(0, 1200) || DEFAULT_CAREER_PAGE.intro
  if (typeof body.apply_email === 'string') updates.apply_email = body.apply_email.trim().slice(0, 160) || DEFAULT_CAREER_PAGE.apply_email
  if (typeof body.accept_general === 'boolean') updates.accept_general = body.accept_general
  if (!Object.keys(updates).length) return jsonError('No updates provided.')

  const { data, error } = await auth.supabase
    .from('career_page_settings')
    .update(updates)
    .eq('id', 1)
    .select()
    .single()
  if (error) return schemaOrDb(error, 'Unable to update careers page copy.', 400)
  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'career.page',
    entityType: 'career_page',
    entityId: '1',
    metadata: updates,
  })
  return jsonOk({ data })
}
