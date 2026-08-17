import { colorFromSeed, initials } from '@/lib/format'

const SIZE = {
  sm: 'size-7 text-[10px]',
  md: 'size-9 text-xs',
  lg: 'size-16 text-lg',
  xl: 'size-[88px] text-2xl sm:size-24 sm:text-3xl',
} as const

export function Avatar({
  name,
  color,
  small = false,
  size,
  image,
  className = '',
}: {
  name?: string | null
  color?: string
  small?: boolean
  size?: keyof typeof SIZE
  image?: string | null
  className?: string
}) {
  const value = initials(name)
  const background = color || colorFromSeed(name || 'user')
  const box = `${SIZE[size ?? (small ? 'sm' : 'md')]} ${className}`
  if (image) return <img src={image} alt="" referrerPolicy="no-referrer" className={`inline-flex shrink-0 rounded-full object-cover ${box}`} />
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-[#31574e] ${box}`}
      style={{ background }}
    >
      {value}
    </span>
  )
}
