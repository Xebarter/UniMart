'use client'

import { useEffect } from 'react'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'default',
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  tone?: 'default' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-[#142e2a]/40 auth-overlay" onClick={onClose} aria-label="Close" />
      <div role="dialog" className="auth-sheet relative w-full max-w-md rounded-3xl border border-[#e5eae7] bg-white p-6 shadow-[0_24px_80px_rgba(36,62,57,0.22)]">
        <h2 className="font-display text-lg font-bold text-[#243e39]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#748780]">{description}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-[#dfe7e3] px-4 py-2 text-sm font-bold text-[#638076] hover:bg-[#f1f6f3]">
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60 ${tone === 'danger' ? 'bg-[#b42318] hover:bg-[#9b1c14]' : 'bg-[#315e55] hover:bg-[#294f48]'}`}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
