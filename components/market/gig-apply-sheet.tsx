'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { isAllowedResume } from '@/lib/gigs'
import { formatPhoneDisplay, hasContactPhone } from '@/lib/phone'
import type { Listing } from '@/lib/types'

export function GigApplySheet({
  listing,
  open,
  onClose,
  onApplied,
  onOpenThread,
}: {
  listing: Listing
  open: boolean
  onClose: () => void
  onApplied: () => void
  onOpenThread: (conversationId: string) => void
}) {
  const { profile } = useMarket()
  const [email, setEmail] = useState('')
  const [cover, setCover] = useState('')
  const [resume, setResume] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [conversationId, setConversationId] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setError('')
    setBusy(false)
    setConversationId('')
    setResume(null)
    setCover('')
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    api.profile()
      .then((result) => setEmail(result.user?.email ?? ''))
      .catch(() => setEmail(''))
    return () => {
      document.body.style.overflow = previous
    }
  }, [open, listing.id])

  if (!open || !mounted || !profile) return null

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!resume) {
      setError('Upload a resume to apply.')
      return
    }
    const invalid = isAllowedResume(resume)
    if (invalid) {
      setError(invalid)
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = await api.applyGig(listing.id, { cover_letter: cover.trim(), resume })
      if (!result.data || !result.conversation_id) throw new Error('Unable to submit your application.')
      setConversationId(result.conversation_id)
      onApplied()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your application.')
    } finally {
      setBusy(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:px-4">
      <button type="button" aria-label="Close" onClick={onClose} className="auth-overlay absolute inset-0 bg-[#0c1c19]/55 backdrop-blur-[8px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gig-apply-title"
        className="auth-sheet relative max-h-[92svh] w-full overflow-x-clip overflow-y-auto rounded-t-[28px] bg-white shadow-[0_-18px_80px_rgba(12,28,25,0.28)] sm:max-w-[520px] sm:rounded-[28px] sm:shadow-[0_28px_80px_rgba(12,28,25,0.28)]"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="relative px-6 pb-6 pt-5 sm:px-7 sm:pt-7">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#e4ebe8] sm:hidden" />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-[#e8eeeb] bg-white text-[#6e8079] transition hover:bg-[#f4f7f6]"
          >
            <X size={16} />
          </button>
          {conversationId ? (
            <div className="py-6 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#edf6f1] text-[#315e55]">
                <CheckCircle2 size={24} />
              </span>
              <h2 id="gig-apply-title" className="mt-4 font-display text-[1.55rem] font-bold tracking-[-0.04em] text-[#243e39]">
                Application sent
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#748780]">
                {profile.display_name.split(' ')[0] ? `${profile.display_name.split(' ')[0]}, your` : 'Your'} note and resume are with the poster. They can reply in Messages.
              </p>
              <button type="button" onClick={() => onOpenThread(conversationId)} className="mt-6 h-12 w-full rounded-xl bg-[#315e55] text-sm font-bold text-white transition hover:bg-[#274c44]">
                Open conversation
              </button>
              <button type="button" onClick={onClose} className="mt-2 h-11 w-full text-sm font-bold text-[#638076]">
                Stay on this gig
              </button>
            </div>
          ) : (
            <form onSubmit={(event) => void submit(event)} className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Apply</p>
                <h2 id="gig-apply-title" className="mt-1.5 pr-10 font-display text-[1.55rem] font-bold tracking-[-0.04em] text-[#243e39]">
                  {listing.title}
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-[#748780]">
                  Students only. We prefill your UniMart profile so the poster can review a complete application.
                </p>
              </div>
              <div className="grid gap-3 rounded-2xl border border-[#e8eeeb] bg-[#f8fbf9] p-4 sm:grid-cols-2">
                <Fact label="Name" value={profile.display_name} />
                <Fact label="Email" value={email || 'On your account'} />
                <Fact label="Student number" value={profile.student_number?.trim() || '—'} />
                <Fact
                  label="Phone"
                  value={hasContactPhone(profile.phone_primary) ? formatPhoneDisplay(profile.phone_primary ?? '') : '—'}
                />
                <Fact label="University" value={profile.university || 'Add in Settings'} />
                <Fact label="Campus" value={profile.campus || 'Add in Settings'} />
              </div>
              <label className="block">
                <span className="text-[13px] font-bold text-[#2e4942]">Why you for this gig</span>
                <textarea
                  required
                  minLength={40}
                  maxLength={4000}
                  value={cover}
                  onChange={(event) => setCover(event.target.value)}
                  placeholder="A few sentences on your availability, skills, and how you would complete the work."
                  className="mt-1.5 min-h-[140px] w-full rounded-2xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 py-3 text-sm leading-6 text-[#243e39] outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
                />
                <span className="mt-1 block text-[11px] text-[#8b9994]">{cover.length}/4000 · at least 40 characters</span>
              </label>
              <label className="block">
                <span className="text-[13px] font-bold text-[#2e4942]">Resume</span>
                <span className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[#c8dbd4] bg-[#fbfcfb] px-4 py-4 transition hover:border-[#86aa9e]">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf6f1] text-[#315e55]">
                    {resume ? <FileText size={18} /> : <Upload size={18} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#243e39]">{resume ? resume.name : 'PDF or Word, up to 5MB'}</span>
                    <span className="mt-0.5 block text-[12px] text-[#8b9994]">{resume ? `${Math.max(1, Math.round(resume.size / 1024))} KB` : 'Required for this application'}</span>
                  </span>
                </span>
                <input
                  required
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    setResume(file)
                    setError(file ? isAllowedResume(file) : '')
                  }}
                />
              </label>
              {error ? <p role="alert" className="text-sm text-[#c45b38]">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#315e55] text-sm font-bold text-white shadow-[0_10px_24px_rgba(49,94,85,0.18)] transition hover:bg-[#274c44] disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : null}
                {busy ? 'Sending application…' : 'Submit application'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[#29463f]">{value}</p>
    </div>
  )
}
