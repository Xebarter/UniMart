import { careersSchemaError, DEFAULT_CAREER_PAGE, isJobRoleOpen } from '@/lib/careers'
import { dbError, jsonOk } from '@/lib/api/http'
import { createClient } from '@/lib/supabase/server'
import type { CareerPageSettings, JobRole } from '@/lib/types'

export async function GET() {
  const supabase = await createClient()
  const [{ data: settings, error: settingsError }, { data: roles, error: rolesError }] = await Promise.all([
    supabase.from('career_page_settings').select('*').eq('id', 1).maybeSingle(),
    supabase
      .from('job_roles')
      .select('*')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true })
      .order('published_at', { ascending: false }),
  ])

  if (careersSchemaError(rolesError)) {
    return jsonOk({ data: [] as JobRole[], settings: DEFAULT_CAREER_PAGE })
  }
  if (rolesError) return dbError(rolesError, 'Unable to load roles.')
  if (settingsError && !careersSchemaError(settingsError)) return dbError(settingsError, 'Unable to load careers page.')

  const open = (roles ?? []).filter((role) => isJobRoleOpen(role as JobRole)) as JobRole[]
  return jsonOk({
    data: open,
    settings: (settings as CareerPageSettings | null) ?? DEFAULT_CAREER_PAGE,
  })
}
