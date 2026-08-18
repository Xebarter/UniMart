import { ilikeOr, parseListQuery } from '@/lib/admin/query'
import { dbError, jsonError, jsonOk, requireAdmin } from '@/lib/api/http'
import { careersSchemaError, isApplicationStatus } from '@/lib/careers'

const SELECT = '*, job_roles(id, title, slug, department, status)'

function schemaOrDb(error: { message?: string; code?: string } | null, fallback: string, status = 500) {
  if (careersSchemaError(error)) {
    return jsonError('Careers tables are not initialized. Run scripts/012_careers.sql in the Supabase SQL editor.', 503)
  }
  return dbError(error, fallback, status)
}

export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response
  const { page, pageSize, q, from, to, searchParams } = parseListQuery(new URL(request.url))
  const status = searchParams.get('status')
  const roleId = searchParams.get('role_id')
  const general = searchParams.get('kind')

  let query = auth.supabase.from('job_applications').select(SELECT, { count: 'exact' })
  if (isApplicationStatus(status)) query = query.eq('status', status)
  if (roleId && roleId !== 'all') query = query.eq('role_id', roleId)
  if (general === 'general') query = query.is('role_id', null)
  if (q) query = query.or(ilikeOr(['name', 'email', 'location', 'cover_letter'], q))

  const [{ data, error, count }, incoming, reviewing, shortlisted, rejected, hired] = await Promise.all([
    query.order('created_at', { ascending: false }).range(from, to),
    auth.supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    auth.supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('status', 'reviewing'),
    auth.supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('status', 'shortlisted'),
    auth.supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    auth.supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('status', 'hired'),
  ])
  if (error) return schemaOrDb(error, 'Unable to load applications.')
  return jsonOk({
    data: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    counts: {
      new: incoming.count ?? 0,
      reviewing: reviewing.count ?? 0,
      shortlisted: shortlisted.count ?? 0,
      rejected: rejected.count ?? 0,
      hired: hired.count ?? 0,
    },
  })
}
