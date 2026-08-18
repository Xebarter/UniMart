import { writeAudit } from '@/lib/admin/audit'
import { dbError, jsonError, jsonOk, parseJson, requireAdmin } from '@/lib/api/http'
import {
  DEFAULT_PRESS_PAGE,
  normalizePressPage,
  pressPageFromBody,
  pressPageWritePayload,
  pressSchemaError,
  validatePressPage,
} from '@/lib/press'
import type { PressPage } from '@/lib/types'

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (pressSchemaError(error)) {
    return jsonError('Press page table is not initialized. Run scripts/014_press.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('press_pages').select('*').eq('id', 1).maybeSingle()
  if (error) return schemaOrDb(error, 'Unable to load press page.')
  return jsonOk({ data: data ? normalizePressPage(data as PressPage) : DEFAULT_PRESS_PAGE })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')

  const { data: current, error: loadError } = await auth.supabase.from('press_pages').select('*').eq('id', 1).maybeSingle()
  if (loadError) return schemaOrDb(loadError, 'Unable to load press page.')

  const next = pressPageFromBody(body, current ? normalizePressPage(current as PressPage) : DEFAULT_PRESS_PAGE)
  const invalid = validatePressPage(next)
  if (invalid) return jsonError(invalid)

  const payload = pressPageWritePayload(next)
  const { data, error } = await auth.supabase
    .from('press_pages')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single()
  if (error) return schemaOrDb(error, 'Unable to save press page.', 400)

  await writeAudit(auth.supabase, {
    actorId: auth.user.id,
    action: 'press.page',
    entityType: 'press_page',
    entityId: '1',
    metadata: { fields: Object.keys(payload) },
  })
  return jsonOk({ data: normalizePressPage(data as PressPage) })
}
