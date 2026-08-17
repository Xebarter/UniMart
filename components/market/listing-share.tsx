'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, Link2, Mail, MessageCircle, Share2, X } from 'lucide-react'
import { ListingPhoto } from '@/components/listing-photo'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { formatUGX, rentPeriodSuffix } from '@/lib/format'
import { listingAbsoluteUrl, listingShareText, listingShareTitle } from '@/lib/listing-share'
import { cn } from '@/lib/utils'
import type { Listing } from '@/lib/types'

function payload(listing: Listing) {
  return {
    url: listingAbsoluteUrl(listing.id),
    title: listingShareTitle(listing),
    text: listingShareText(listing),
  }
}

function trackShare(listingId: string, channel: string) {
  void api.track('listing_share', { channel }, listingId)
}

export function ListingShareButton({
  listing,
  compact = false,
  className = '',
}: {
  listing: Listing
  compact?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ListingShareTrigger
        listing={listing}
        compact={compact}
        className={className}
        onClick={() => setOpen(true)}
      />
      <ListingShareSheet listing={listing} open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function ListingShareTrigger({
  listing,
  compact = false,
  className = '',
  onClick,
}: {
  listing: Listing
  compact?: boolean
  className?: string
  onClick: () => void
}) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    onClick()
  }

  return (
    <button
      type="button"
      aria-label={`Share ${listing.title}`}
      onClick={handleClick}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full border transition',
        compact
          ? 'size-7 border-white/80 bg-white/95 text-[#7a8c86] shadow-[0_4px_12px_rgba(36,62,57,0.12)] hover:text-[#315e55]'
          : 'size-8 border-white/80 bg-white/95 text-[#7a8c86] shadow-[0_4px_12px_rgba(36,62,57,0.12)] hover:text-[#315e55]',
        className,
      )}
    >
      <Share2 size={compact ? 13 : 15} strokeWidth={2.2} />
    </button>
  )
}

export function ListingShareSheet({
  listing,
  open,
  onClose,
}: {
  listing: Listing
  open: boolean
  onClose: () => void
}) {
  const { notify } = useMarket()
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [mounted, setMounted] = useState(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const { url, title, text } = payload(listing)
  const price = formatUGX(Number(listing.price), listing.currency)
  const period = listing.category === 'Rentals' ? rentPeriodSuffix(listing.rent_period) : ''
  const displayUrl = url.replace(/^https?:\/\//, '')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    if (!open) {
      setCopied(false)
      return
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!open || !mounted) return null

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      trackShare(listing.id, 'copy')
      notify('Link copied')
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      notify('Unable to copy link')
    }
  }

  async function shareNative() {
    try {
      await navigator.share({ title, text, url })
      trackShare(listing.id, 'native')
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      await copyLink()
    }
  }

  function openChannel(channel: string, href: string) {
    trackShare(listing.id, channel)
    if (href.startsWith('sms:') || href.startsWith('mailto:')) {
      window.location.href = href
      return
    }
    window.open(href, '_blank', 'noopener,noreferrer')
  }

  const encodedMessage = encodeURIComponent(`${text}\n${url}`)
  const smsHref = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    ? `sms:&body=${encodedMessage}`
    : `sms:?body=${encodedMessage}`

  const channels = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      onClick: () => openChannel('whatsapp', `https://api.whatsapp.com/send?text=${encodedMessage}`),
      icon: <WhatsAppIcon />,
      tone: 'bg-[#e8f8ee] text-[#128C7E]',
    },
    {
      id: 'sms',
      label: 'Messages',
      onClick: () => openChannel('sms', smsHref),
      icon: <MessageCircle size={18} />,
      tone: 'bg-[#edf4f0] text-[#315e55]',
    },
    {
      id: 'telegram',
      label: 'Telegram',
      onClick: () => openChannel('telegram', `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`),
      icon: <TelegramIcon />,
      tone: 'bg-[#e8f4fc] text-[#229ED9]',
    },
    {
      id: 'email',
      label: 'Email',
      onClick: () => openChannel('email', `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`),
      icon: <Mail size={18} />,
      tone: 'bg-[#fff5f0] text-[#d1734b]',
    },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:px-4">
      <button type="button" aria-label="Close share" onClick={onClose} className="auth-overlay absolute inset-0 bg-[#0c1c19]/55 backdrop-blur-[8px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-share-title"
        className="auth-sheet relative w-full overflow-hidden rounded-t-[28px] bg-white shadow-[0_-18px_80px_rgba(12,28,25,0.28)] sm:max-w-[420px] sm:rounded-[28px] sm:shadow-[0_28px_80px_rgba(12,28,25,0.28)]"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="relative px-5 pb-5 pt-4 sm:px-6 sm:pt-6">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#e4ebe8] sm:hidden" />
          <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-[#f3c8ad]/30 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 top-8 h-28 w-28 rounded-full bg-[#315e55]/10 blur-2xl" />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-[#e8eeeb] bg-white text-[#6e8079] transition hover:bg-[#f4f7f6]"
          >
            <X size={16} />
          </button>

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d1734b]">Share listing</p>
          <h2 id="listing-share-title" className="mt-1.5 max-w-[16rem] font-display text-xl font-bold tracking-[-0.04em] text-[#243e39]">
            Send this to a friend
          </h2>

          <div className="relative mt-4 flex items-center gap-3 rounded-2xl border border-[#e8eeeb] bg-[#f8fbf9] p-2.5">
            <ListingPhoto listing={listing} alt="" className="size-16 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#243e39]">{listing.title}</p>
              <p className="mt-0.5 truncate text-xs font-bold text-[#d1734b]">
                {price}
                {period ? <span className="font-semibold text-[#9aa7a2]"> {period}</span> : null}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-medium text-[#8b9994]">{listing.location || 'Uganda'} · UniMart</p>
            </div>
          </div>

          {canNativeShare ? (
            <button
              type="button"
              onClick={() => { void shareNative() }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#315e55] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#294f47]"
            >
              <Share2 size={16} /> Share via apps
            </button>
          ) : null}

          <div className="mt-4 grid grid-cols-4 gap-2">
            {channels.map((channel) => (
              <button
                key={channel.id}
                type="button"
                onClick={channel.onClick}
                className="group flex flex-col items-center gap-2 rounded-2xl px-1 py-2 transition hover:bg-[#f7fbf9]"
              >
                <span className={`flex size-12 items-center justify-center rounded-2xl ${channel.tone} transition group-hover:scale-[1.04]`}>
                  {channel.icon}
                </span>
                <span className="text-[10px] font-bold text-[#5f746c]">{channel.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-[#e5eae7] bg-white p-1.5 pl-3.5">
            <Link2 size={14} className="shrink-0 text-[#8b9994]" />
            <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#526861]">{displayUrl}</p>
            <button
              type="button"
              onClick={() => { void copyLink() }}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition ${
                copied ? 'bg-[#edf6f1] text-[#3d7a62]' : 'bg-[#315e55] text-white hover:bg-[#294f47]'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px] fill-current">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.38-1.41a10.1 10.1 0 0 0 4.66 1.12h.01c5.46 0 9.89-4.4 9.89-9.84C21.94 6.4 17.5 2 12.04 2Zm5.76 14.12c-.24.68-1.4 1.26-1.94 1.34-.5.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.6-2.89-1.25-4.77-4.16-4.92-4.35-.14-.2-1.18-1.57-1.18-3 0-1.42.74-2.12 1-2.41.24-.27.64-.4.86-.4h.62c.2 0 .46-.02.72.55.26.58.88 2.02.96 2.17.08.14.13.32.02.51-.1.2-.16.32-.31.5-.16.17-.33.38-.47.51-.16.14-.32.3-.14.58.18.27.8 1.32 1.72 2.14 1.18 1.05 2.14 1.38 2.45 1.54.3.15.48.13.66-.08.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.27.1 1.72.81 2.01.96.3.14.5.22.57.34.08.13.08.73-.16 1.41Z" />
    </svg>
  )
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px] fill-current">
      <path d="M21.5 4.4 18.4 20c-.24 1.06-.86 1.32-1.74.82l-4.82-3.55-2.32 2.24c-.26.26-.47.47-.97.47l.35-4.9 8.92-8.06c.39-.35-.08-.54-.6-.2L6.4 13.18l-4.75-1.48c-1.03-.32-1.05-1.03.22-1.53L20.2 3.7c.86-.32 1.61.2 1.3.7Z" />
    </svg>
  )
}
