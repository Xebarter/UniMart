'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { ContactPhoneInput } from '@/components/market/contact-phone-input'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  hasContactPhone,
  isValidE164,
  splitE164,
  toE164,
} from '@/lib/phone'

function countryDial(iso: string) {
  return PHONE_COUNTRIES.find((item) => item.iso === iso)?.dial ?? PHONE_COUNTRIES[0].dial
}

function fromProfile(value?: string | null) {
  if (!hasContactPhone(value)) return { iso: DEFAULT_PHONE_COUNTRY, national: '' }
  return splitE164(value!)
}

export function PhoneContactGate({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved?: () => void
}) {
  const { profile, setProfile } = useMarket()
  const primarySeed = fromProfile(profile?.phone_primary)
  const secondarySeed = fromProfile(profile?.phone_secondary)
  const [iso, setIso] = useState(primarySeed.iso)
  const [national, setNational] = useState(primarySeed.national)
  const [secondOpen, setSecondOpen] = useState(Boolean(secondarySeed.national))
  const [secondIso, setSecondIso] = useState(secondarySeed.iso)
  const [secondNational, setSecondNational] = useState(secondarySeed.national)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const nextPrimary = fromProfile(profile?.phone_primary)
    const nextSecondary = fromProfile(profile?.phone_secondary)
    setIso(nextPrimary.iso)
    setNational(nextPrimary.national)
    setSecondIso(nextSecondary.iso)
    setSecondNational(nextSecondary.national)
    setSecondOpen(Boolean(nextSecondary.national))
    setError('')
    setBusy(false)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open, profile?.phone_primary, profile?.phone_secondary])

  if (!open || !mounted || !profile) return null

  async function save() {
    if (!profile) return
    const primary = toE164(countryDial(iso), national)
    if (!isValidE164(primary)) {
      setError('Enter a valid phone number.')
      return
    }
    let secondary: string | null = null
    if (secondOpen && secondNational.trim()) {
      secondary = toE164(countryDial(secondIso), secondNational)
      if (!isValidE164(secondary)) {
        setError('Enter a valid second phone number.')
        return
      }
      if (secondary === primary) {
        setError('Use two different numbers.')
        return
      }
    }
    setBusy(true)
    setError('')
    try {
      const result = await api.updateProfile({
        display_name: profile.display_name,
        university: profile.university,
        campus: profile.campus,
        bio: profile.bio,
        phone_primary: primary,
        phone_secondary: secondary,
      })
      setProfile(result.data)
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save phone number.')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:px-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="auth-overlay absolute inset-0 bg-[#0c1c19]/55 backdrop-blur-[8px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-contact-title"
        className="auth-sheet relative w-full overflow-x-clip overflow-y-auto rounded-t-[28px] bg-white shadow-[0_-18px_80px_rgba(12,28,25,0.28)] sm:max-w-[400px] sm:rounded-[28px] sm:shadow-[0_28px_80px_rgba(12,28,25,0.28)]"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="relative px-6 pb-6 pt-5 sm:px-7 sm:pt-7">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#e4ebe8] sm:hidden" />
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#f3c8ad]/35 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 top-10 h-28 w-28 rounded-full bg-[#315e55]/10 blur-2xl" />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-[#e8eeeb] bg-white text-[#6e8079] transition hover:bg-[#f4f7f6]"
          >
            <X size={16} />
          </button>
          <h2 id="phone-contact-title" className="pr-10 font-display text-[1.55rem] font-bold tracking-[-0.04em] text-[#243e39]">
            Phone number
          </h2>
          <p className="mt-1.5 text-sm leading-6 text-[#748780]">Buyers can call you.</p>
          <div className="mt-5">
            <ContactPhoneInput
              id="contact-phone-primary"
              iso={iso}
              national={national}
              onIsoChange={setIso}
              onNationalChange={setNational}
              autoFocus
            />
          </div>
          {secondOpen ? (
            <div className="mt-3">
              <ContactPhoneInput
                id="contact-phone-secondary"
                iso={secondIso}
                national={secondNational}
                onIsoChange={setSecondIso}
                onNationalChange={setSecondNational}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSecondOpen(true)}
              className="mt-3 text-[13px] font-bold text-[#315e55]"
            >
              Add another number
            </button>
          )}
          {error && <p role="alert" className="mt-3 text-sm text-[#c45b38]">{error}</p>}
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="mt-5 h-12 w-full rounded-xl bg-[#315e55] text-sm font-bold text-white shadow-[0_10px_24px_rgba(49,94,85,0.18)] transition hover:bg-[#274c44] disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
