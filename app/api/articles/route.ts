import { createClient } from '@/lib/supabase/server'
import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: admin } = user ? await supabase.rpc('is_admin') : { data: false }
  let builder = supabase.from('articles').select('*').order('created_at', { ascending: false })
  if (!admin) builder = builder.eq('status', 'published')
  const { data, error } = await builder
  if (error) return dbError(error, 'Unable to load articles.')
  return jsonOk({ data: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const body = await parseJson(request)
  if (!body) return jsonError('Invalid JSON body.')
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-') : ''
  if (!title || !slug) return jsonError('Title and slug are required.')
  const { data, error } = await auth.supabase
    .from('articles')
    .insert({
      author_id: auth.user.id,
      title,
      slug,
      excerpt: String(body.excerpt ?? '').trim(),
      body: String(body.body ?? ''),
      type: typeof body.type === 'string' ? body.type : 'Community',
      status: 'draft',
    })
    .select()
    .single()
  if (error) return dbError(error, 'Unable to create article.', 400)
  return jsonOk({ data }, 201)
}
