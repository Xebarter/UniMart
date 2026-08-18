export const marketPaths = {
  home: '/',
  explore: '/explore',
  article: (slug: string) => `/explore/${slug}`,
  post: '/post',
  postNew: '/post/new',
  postEdit: (id: string) => `/post/${id}`,
  postShop: '/post?tab=shop',
  shop: '/shop',
  shopPublic: (slug: string) => `/shops/${slug}`,
  profile: '/profile',
  settings: '/settings',
  messages: '/messages',
  conversation: (id: string) => `/messages/${id}`,
  listing: (id: string) => `/listings/${id}`,
} as const

export type MarketView = 'home' | 'explore' | 'post' | 'profile' | 'settings' | 'messages' | 'listing' | 'shop'

export function viewFromPath(pathname: string): MarketView {
  if (pathname.startsWith('/explore')) return 'explore'
  if (pathname.startsWith('/shops/')) return 'listing'
  if (pathname === '/shop' || pathname.startsWith('/shop/')) return 'shop'
  if (pathname.startsWith('/post')) return 'post'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/profile')) return 'profile'
  if (pathname.startsWith('/messages')) return 'messages'
  if (pathname.startsWith('/listings/')) return 'listing'
  return 'home'
}
