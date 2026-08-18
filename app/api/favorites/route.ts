import { dbError, jsonError, jsonOk, parseJson, requireUser } from '@/lib/api/http'
import { createNotification } from '@/lib/notifications'

async function userOr401() {
  return requireUser()
}

export async function GET() {
  const auth = await userOr401()
  if (auth.response) return auth.response
  const { data, error } = await auth.supabase.from('favorites').select('listing_id, listings(*, listing_media(*), profiles:owner_id(id, display_name, avatar_url, verified))').eq('user_id', auth.user.id).order('created_at', { ascending: false })
  if (error) return dbError(error, 'Unable to load favorites.')
  return jsonOk({ data: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await userOr401()
  if (auth.response) return auth.response
  const body = await parseJson<{ listing_id?: string }>(request)
  if (!body?.listing_id) return jsonError('listing_id is required.')
  const [{ data: existing }, { data: listing }, { data: actor }] = await Promise.all([
    auth.supabase.from('favorites').select('listing_id').eq('user_id', auth.user.id).eq('listing_id', body.listing_id).maybeSingle(),
    auth.supabase.from('listings').select('id, owner_id, title').eq('id', body.listing_id).maybeSingle(),
    auth.supabase.from('profiles').select('display_name').eq('id', auth.user.id).maybeSingle(),
  ])
  const { error } = await auth.supabase.from('favorites').upsert({ user_id: auth.user.id, listing_id: body.listing_id })
  if (error) return dbError(error, 'Unable to save listing.', 400)
  if (!existing && listing?.owner_id && listing.owner_id !== auth.user.id) {
    await createNotification(auth.supabase, {
      user_id: listing.owner_id,
      type: 'favorite',
      title: `${actor?.display_name || 'Someone'} saved your listing`,
      body: listing.title,
      listing_id: listing.id,
      actor_id: auth.user.id,
      path: `/listings/${listing.id}`,
      metadata: { listing_title: listing.title },
    }).catch((notificationError) => console.error('[unimart:favorites:notify]', notificationError))
  }
  return jsonOk({ saved: true })
}

export async function DELETE(request: Request) {
  const auth = await userOr401()
  if (auth.response) return auth.response
  const body = await parseJson<{ listing_id?: string }>(request)
  if (!body?.listing_id) return jsonError('listing_id is required.')
  const { error } = await auth.supabase.from('favorites').delete().eq('user_id', auth.user.id).eq('listing_id', body.listing_id)
  if (error) return dbError(error, 'Unable to remove saved listing.', 400)
  return jsonOk({ saved: false })
}
