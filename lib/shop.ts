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
