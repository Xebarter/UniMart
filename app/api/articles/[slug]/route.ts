import { createClient } from '@/lib/supabase/server'
import { dbError, jsonError, jsonOk } from '@/lib/api/http'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { slug } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('articles').select('*').eq('slug', slug).maybeSingle()
  if (error) return dbError(error, 'Unable to load article.')
  if (!data) return jsonError('Article not found.', 404)
  if (data.status === 'published') return jsonOk({ data })
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.id === data.author_id) return jsonOk({ data })
  const { data: admin } = await supabase.rpc('is_admin')
  if (admin) return jsonOk({ data })
  return jsonError('Article not found.', 404)
}
