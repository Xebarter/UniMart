import { careersSchemaError, DEFAULT_CAREER_PAGE, isJobRoleOpen } from '@/lib/careers'
import { dbError, jsonError, jsonOk } from '@/lib/api/http'
import { createClient } from '@/lib/supabase/server'
import type { CareerPageSettings, JobRole } from '@/lib/types'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params
  const supabase = await createClient()
  const [{ data: role, error: roleError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase.from('job_roles').select('*').eq('slug', slug).maybeSingle(),
    supabase.from('career_page_settings').select('*').eq('id', 1).maybeSingle(),
  ])

  if (careersSchemaError(roleError) || careersSchemaError(settingsError)) {
    return jsonError('Careers tables are not initialized. Run scripts/012_careers.sql in the Supabase SQL editor.', 503)
  }
  if (roleError) return dbError(roleError, 'Unable to load role.')
  if (!role || !isJobRoleOpen(role as JobRole)) return jsonError('This role is not available.', 404)
  return jsonOk({
    data: role as JobRole,
    settings: (settings as CareerPageSettings | null) ?? DEFAULT_CAREER_PAGE,
  })
}
