import * as React from 'react'

import { cn } from '@/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'overflow-hidden rounded-[22px] border border-[#e5eae7] bg-white text-[#29463f] shadow-[0_10px_32px_rgba(36,62,57,0.04)]',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1 border-b border-[#eef3f0] px-5 py-4 sm:px-6', className)} {...props} />
}

function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return <h3 data-slot="card-title" className={cn('font-display text-base font-bold tracking-[-0.025em] text-[#243e39]', className)} {...props} />
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p data-slot="card-description" className={cn('text-xs leading-5 text-[#8b9994]', className)} {...props} />
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('px-5 py-5 sm:px-6 sm:py-6', className)} {...props} />
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
