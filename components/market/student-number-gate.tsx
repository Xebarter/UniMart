'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GraduationCap, X } from 'lucide-react'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import {
  normalizeStudentNumber,
  STUDENT_NUMBER_TAKEN,
  validateStudentNumber,
} from '@/lib/student-number'

const FIELD =
  'mt-1.5 h-12 w-full rounded-xl border border-[#e4e9e6] bg-[#fbfcfb] px-3.5 text-base outline-none transition focus:border-[#7fa59a] focus:ring-2 focus:ring-[#dcebe6] sm:text-sm'

export function StudentNumberGate({
  open,
  context = 'listing',
  onClose,
  onSaved,
}: {
  open: boolean
  context?: 'listing' | 'shop'
  onClose: () => void
  onSaved?: () => void
}) {
  const { profile, setProfile } = useMarket()
  const [value, setValue] = useState(profile?.student_number ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setError('')
    setBusy(false)
    setValue(profile?.student_number ?? '')
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    const focus = window.setTimeout(() => inputRef.current?.focus(), 180)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(focus)
    }
  }, [open, profile?.student_number])

  if (!open || !mounted || !profile) return null

  const copy = context === 'shop'
    ? {
        title: 'Confirm you are a student',
        body: 'Shops on UniMart are for university students. Enter your student number once — we save it to your profile.',
        hint: 'Use the number on your student ID.',
      }
    : {
        title: 'Confirm you are a student',
        body: 'Products, services, and rentals are for university students. Enter your student number once — we save it to your profile.',
        hint: 'Gigs stay open to everyone. Close this and choose Gig if that is what you are posting.',
      }

  async function save() {
    if (!profile) return
    const normalized = normalizeStudentNumber(value)
    const invalid = validateStudentNumber(normalized)
    if (invalid) {
      setError(invalid)
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await api.updateProfile({
        display_name: profile.display_name,
        university: profile.university,
        campus: profile.campus,
        bio: profile.bio,
        student_number: normalized,
      })
      setProfile(result.data)
      onSaved?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save student number.'
      setError(message.includes('already in use') ? STUDENT_NUMBER_TAKEN : message)
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
        aria-labelledby="student-number-title"
        className="auth-sheet relative w-full overflow-x-clip overflow-y-auto rounded-t-[28px] bg-white shadow-[0_-18px_80px_rgba(12,28,25,0.28)] sm:max-w-[420px] sm:rounded-[28px] sm:shadow-[0_28px_80px_rgba(12,28,25,0.28)]"
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
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d1734b]">Students only</p>
          <h2 id="student-number-title" className="mt-2 max-w-[18rem] font-display text-[1.65rem] font-bold tracking-[-0.04em] text-[#243e39]">
            {copy.title}
          </h2>
          <p className="mt-2 max-w-[22rem] text-sm leading-6 text-[#748780]">{copy.body}</p>
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-[#e8eeeb] bg-[#f8fbf9] px-3.5 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#d1734b] shadow-[0_6px_16px_rgba(49,94,85,0.08)]">
              <GraduationCap size={18} />
            </span>
            <p className="text-[13px] leading-5 text-[#5f746c]">Saved once on your profile. You will not be asked again.</p>
          </div>
          <label className="mt-5 block text-[13px] font-semibold text-[#2e4942]">
            Student number
            <input
              ref={inputRef}
              autoComplete="off"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void save()
                }
              }}
              placeholder="e.g. 21/U/12345/PS"
              className={FIELD}
            />
          </label>
          <p className="mt-2 text-[12px] leading-5 text-[#8b9994]">{copy.hint}</p>
          {error && <p role="alert" className="mt-4 text-sm text-[#c45b38]">{error}</p>}
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
