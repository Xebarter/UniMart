export const marketPaths = {
  home: '/',
  explore: '/explore',
  post: '/post',
  postNew: '/post/new',
  postEdit: (id: string) => `/post/${id}`,
  profile: '/profile',
  messages: '/messages',
  conversation: (id: string) => `/messages/${id}`,
  listing: (id: string) => `/listings/${id}`,
} as const

export type MarketView = 'home' | 'explore' | 'post' | 'profile' | 'messages' | 'listing'

export function viewFromPath(pathname: string): MarketView {
  if (pathname.startsWith('/explore')) return 'explore'
  if (pathname.startsWith('/post')) return 'post'
  if (pathname.startsWith('/profile')) return 'profile'
  if (pathname.startsWith('/messages')) return 'messages'
  if (pathname.startsWith('/listings/')) return 'listing'
  return 'home'
}
