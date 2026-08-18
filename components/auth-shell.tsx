'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandLogo } from '@/components/brand-logo'
import { marketPaths } from '@/lib/market-paths'

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <main data-auth-shell className="relative flex min-h-svh items-center justify-center overflow-x-clip bg-[#f4f8f6] px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(209,115,75,0.13),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(49,94,85,0.16),transparent_46%)]" />
      <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-[44%] border-[28px] border-[#315e55]/10" />
      <div className="relative w-full max-w-[440px]">
        <Link href={marketPaths.home} className="mb-7 flex justify-center">
          <BrandLogo showWordmark size={38} wordmarkClassName="text-[1.4rem]" />
        </Link>
        <div className="rounded-[28px] border border-[#e5eae7] bg-white p-6 shadow-[0_28px_80px_rgba(36,62,57,0.12)] sm:p-8">
          {eyebrow ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d1734b]">{eyebrow}</p>
          ) : null}
          <h1 className="mt-2 font-display text-[1.85rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2rem]">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#748780]">{description}</p>
          <div className="mt-7">{children}</div>
          <p className="mt-6 text-center text-[11px] leading-5 text-[#8b9994]">
            By continuing you agree to UniMart’s{' '}
            <Link href="/terms" className="font-semibold text-[#638076] hover:text-[#315e55]">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-semibold text-[#638076] hover:text-[#315e55]">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
        <p className="mt-5 text-center text-sm text-[#8b9994]">{footer}</p>
      </div>
    </main>
  )
}
