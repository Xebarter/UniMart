import type { ComponentProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#edf4f0] text-[#315e55]',
        success: 'border-transparent bg-[#e7f4ec] text-[#3f7a5c]',
        warning: 'border-transparent bg-[#fff2ec] text-[#c86c48]',
        danger: 'border-transparent bg-[#fdecec] text-[#b42318]',
        muted: 'border-transparent bg-[#f1f4f2] text-[#71847c]',
        outline: 'border-[#dfe7e3] text-[#638076]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
