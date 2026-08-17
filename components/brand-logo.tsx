type BrandLogoProps = {
  size?: number
  className?: string
  showWordmark?: boolean
  wordmarkClassName?: string
}

export function BrandLogo({ size = 36, className = '', showWordmark = false, wordmarkClassName = '' }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src="/apple-touch-icon.png"
        alt={showWordmark ? '' : 'UniMart'}
        width={size}
        height={size}
        className="shrink-0 rounded-[22%]"
      />
      {showWordmark && (
        <span className={`font-display font-bold tracking-[-0.04em] text-[#243e39] ${wordmarkClassName}`}>
          Uni<span className="text-[#d1734b]">Mart</span>
        </span>
      )}
    </span>
  )
}
