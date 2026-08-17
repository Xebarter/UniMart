export function shopCoverSrc(value?: string | null) {
  const url = value?.trim()
  if (!url) return ''
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return url
  if (url.startsWith('/storage/v1/object/public/')) return `${base}${url}`
  return `${base}/storage/v1/object/public/avatars/${url.replace(/^\/+/, '')}`
}

export function slugifyShopName(input: string) {
  const slug = input
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
  return slug || 'shop'
}

export function isListingInShop(listing: { shop_id?: string | null }, shopId: string) {
  return listing.shop_id === shopId
}
