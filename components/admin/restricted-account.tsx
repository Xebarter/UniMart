'use client'

import { BrandLogo } from '@/components/brand-logo'
import { signOutUniMart } from '@/lib/auth-session'

export function RestrictedAccount({ status }: { status: 'suspended' | 'banned' }) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-16">
      <div className="w-full rounded-3xl border border-[#e5eae7] bg-white p-8 text-center shadow-[0_18px_50px_rgba(36,62,57,0.08)]">
        <BrandLogo size={48} className="justify-center" />
        <h1 className="mt-5 font-display text-2xl font-bold text-[#243e39]">
          {status === 'banned' ? 'This account is banned' : 'This account is suspended'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#748780]">
          {status === 'banned'
            ? 'UniMart operations has restricted this account. You can still sign out, but posting, messaging, and checkout are blocked.'
            : 'Your account is temporarily restricted. You cannot post, message, or check out until an administrator reinstates access.'}
        </p>
        <button
          type="button"
          onClick={() => { void signOutUniMart() }}
          className="mt-6 inline-flex rounded-xl bg-[#315e55] px-4 py-2.5 text-sm font-bold text-white"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
