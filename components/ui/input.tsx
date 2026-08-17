import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-10 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 text-sm font-medium text-[#243e39] outline-none placeholder:font-normal placeholder:text-[#a8b2ae] focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6] disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
