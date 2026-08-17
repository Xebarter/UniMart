import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'min-h-28 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 py-3 text-sm font-medium text-[#243e39] outline-none placeholder:font-normal placeholder:text-[#a8b2ae] focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6] disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
