import { dbError, jsonError, jsonOk, publicAvatarUrl, publicMediaUrl, requireUser } from '@/lib/api/http'

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.response) return auth.response
  const form = await request.formData()
  const file = form.get('file')
  const listingId = typeof form.get('listing_id') === 'string' ? String(form.get('listing_id')) : ''
  const kind = String(form.get('kind') ?? 'listing')
  if (!(file instanceof File)) return jsonError('A file is required.')
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return jsonError('Upload an image under 5MB.')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) return jsonError('Use JPG, PNG, WEBP, or GIF.')

  if (kind === 'avatar') {
    const path = `${auth.user.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await auth.supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: false })
    if (uploadError) return jsonError('Unable to upload image.')
    const avatarUrl = publicAvatarUrl(path)
    const { data, error } = await auth.supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', auth.user.id).select().single()
    if (error) return dbError(error, 'Unable to save avatar.', 400)
    return jsonOk({ data, url: avatarUrl }, 201)
  }

  if (!listingId) return jsonError('A file and listing_id are required.')
  const { data: listing } = await auth.supabase.from('listings').select('id').eq('id', listingId).eq('owner_id', auth.user.id).maybeSingle()
  if (!listing) return jsonError('Listing not found.', 404)
  const path = `${auth.user.id}/${listingId}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await auth.supabase.storage.from('listing-media').upload(path, file, { contentType: file.type, upsert: false })
  if (uploadError) return jsonError('Unable to upload image.')
  const { count } = await auth.supabase.from('listing_media').select('id', { count: 'exact', head: true }).eq('listing_id', listingId)
  const { data, error } = await auth.supabase
    .from('listing_media')
    .insert({
      listing_id: listingId,
      owner_id: auth.user.id,
      storage_path: path,
      alt_text: String(form.get('alt_text') ?? ''),
      sort_order: count ?? 0,
    })
    .select()
    .single()
  if (error) return dbError(error, 'Unable to save image metadata.', 400)
  return jsonOk({ data: { ...data, public_url: publicMediaUrl(path) } }, 201)
}
