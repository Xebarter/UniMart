import { colorFromSeed, initials } from '@/lib/format'

export function Avatar({
  name,
  color,
  small = false,
  image,
}: {
  name?: string | null
  color?: string
  small?: boolean
  image?: string | null
}) {
  const value = initials(name)
  const background = color || colorFromSeed(name || 'user')
  if (image) return <img src={image} alt="" className={`inline-flex shrink-0 rounded-full object-cover ${small ? 'size-7' : 'size-9'}`} />
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-[#31574e] ${small ? 'size-7 text-[10px]' : 'size-9 text-xs'}`}
      style={{ background }}
    >
      {value}
    </span>
  )
}
