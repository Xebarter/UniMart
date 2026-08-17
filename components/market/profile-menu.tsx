'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, LogIn, LogOut, Settings, UserRound } from 'lucide-react'
import { Avatar } from '@/components/market/avatar'
import { useMarket } from '@/components/market/provider'
import { getSafeNextPath, loginHref } from '@/lib/auth'
import { signOutUniMart } from '@/lib/auth-session'
import { colorFromSeed } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'

function MenuLink({
  href,
  icon: Icon,
  label,
  hint,
  onNavigate,
}: {
  href: string
  icon: typeof UserRound
  label: string
  hint?: string
  onNavigate: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f4f8f6]"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#eef4f1] text-[#4f6f66]">
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#29463f]">{label}</span>
        {hint ? <span className="block truncate text-[11px] text-[#8c9995]">{hint}</span> : null}
      </span>
    </Link>
  )
}

export function ProfileMenu() {
  const pathname = usePathname()
  const { profile } = useMarket()
  const [open, setOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function close() {
    setOpen(false)
  }

  async function handleSignOut() {
    setSigningOut(true)
    close()
    await signOutUniMart()
  }

  const loginUrl = loginHref(pathname || '/')
  const signUpUrl = `/auth/sign-up?next=${encodeURIComponent(getSafeNextPath(pathname || '/'))}`

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={profile ? 'Account menu' : 'Sign in menu'}
        onClick={() => setOpen((value) => !value)}
        className={`flex items-center gap-2 rounded-xl border px-1 py-1 transition ${
          open
            ? 'border-[#c8dbd4] bg-[#f4f8f6] shadow-[0_8px_24px_rgba(36,62,57,0.08)]'
            : 'border-transparent hover:border-[#e4e9e6] hover:bg-white'
        }`}
      >
        {profile ? (
          <>
            <Avatar name={profile.display_name} color={colorFromSeed(profile.id)} image={profile.avatar_url} />
            <span className="hidden text-left lg:block">
              <span className="block max-w-[120px] truncate text-xs font-bold text-[#2e4942]">{profile.display_name}</span>
              <span className="block text-[10px] text-[#91a09b]">{profile.verified ? 'Verified student' : 'Student'}</span>
            </span>
          </>
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full border border-[#e4e9e6] bg-[#f4f7f6] text-[#687b75]">
            <UserRound size={18} strokeWidth={1.9} />
          </span>
        )}
        <ChevronDown size={14} className={`hidden text-[#9aa7a2] transition sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="profile-menu-panel absolute right-0 top-[calc(100%+10px)] z-50 w-[min(292px,calc(100vw-1.5rem))] overflow-hidden rounded-[22px] border border-[#e5eae7] bg-white shadow-[0_22px_60px_rgba(36,62,57,0.16)]"
        >
          {profile ? (
            <>
              <div className="border-b border-[#eef3f0] bg-gradient-to-br from-[#f7fbf9] via-white to-[#fff9f5] px-4 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={profile.display_name} color={colorFromSeed(profile.id)} image={profile.avatar_url} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-bold tracking-[-0.02em] text-[#243e39]">{profile.display_name}</p>
                    <p className="mt-0.5 truncate text-xs text-[#7d9189]">
                      {[profile.campus, profile.university].filter(Boolean).join(' · ') || 'Campus member'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-1.5">
                <MenuLink href={marketPaths.profile} icon={UserRound} label="View profile" onNavigate={close} />
                <MenuLink href={marketPaths.settings} icon={Settings} label="Settings" hint="Account and privacy" onNavigate={close} />
              </div>
              <div className="border-t border-[#eef3f0] p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  disabled={signingOut}
                  onClick={() => { void handleSignOut() }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#fff5f2] disabled:opacity-60"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[#fff0ea] text-[#c86c48]">
                    <LogOut size={16} strokeWidth={1.9} />
                  </span>
                  <span className="text-sm font-semibold text-[#b85a38]">{signingOut ? 'Signing out…' : 'Log out'}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="border-b border-[#eef3f0] bg-gradient-to-br from-[#315e55] to-[#244840] px-4 py-5 text-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">Your account</p>
                <p className="mt-2 font-display text-lg font-bold tracking-[-0.03em]">Sign in to buy, sell, and save listings.</p>
              </div>
              <div className="space-y-1.5 p-3">
                <Link
                  href={loginUrl}
                  onClick={close}
                  role="menuitem"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#315e55] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#294f48]"
                >
                  <LogIn size={16} strokeWidth={1.9} />
                  Log in
                </Link>
                <Link
                  href={signUpUrl}
                  onClick={close}
                  role="menuitem"
                  className="flex w-full items-center justify-center rounded-xl border border-[#e5eae7] px-4 py-2.5 text-sm font-semibold text-[#4f6f66] transition hover:bg-[#f7faf9]"
                >
                  Create account
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
