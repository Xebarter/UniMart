import { Store } from 'lucide-react'
import { shopCoverSrc } from '@/lib/shop'
import type { Shop } from '@/lib/types'

export function ShopCover({
  shop,
  className = '',
  alt,
}: {
  shop: Pick<Shop, 'name' | 'cover_url'>
  className?: string
  alt?: string
}) {
  const src = shopCoverSrc(shop.cover_url)
  if (!src) {
    return (
      <div className={`relative overflow-hidden bg-[#315e55] ${className}`}>
        <div className="pointer-events-none absolute -right-6 -top-10 h-40 w-48 rotate-[-16deg] rounded-[44%] border-[18px] border-[#47766b] opacity-55" />
        <Store size={22} className="absolute bottom-3 left-3 text-white/70" />
      </div>
    )
  }

  return (
    <div className={`overflow-hidden bg-[#ecefed] ${className}`}>
      <img src={src} alt={alt ?? `${shop.name} cover`} referrerPolicy="no-referrer" className="size-full object-cover object-center" />
    </div>
  )
}
