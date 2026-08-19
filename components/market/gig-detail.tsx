'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Flag,
  GraduationCap,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Share2,
  Shield,
  Sparkles,
  X,
} from 'lucide-react'
import { ListingPhoto } from '@/components/listing-photo'
import { Avatar } from '@/components/market/avatar'
import { GigApplySheet } from '@/components/market/gig-apply-sheet'
import { ListingCard } from '@/components/market/listing-card'
import { ListingShareSheet, ListingShareTrigger } from '@/components/market/listing-share'
import { PhoneContactGate } from '@/components/market/phone-contact-gate'
import { StudentNumberGate } from '@/components/market/student-number-gate'
import { FeaturePayButtons, useFeatureCheckout } from '@/components/market/use-feature-checkout'
import { useFeaturePrices } from '@/components/market/use-feature-prices'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { loginHref } from '@/lib/auth'
import { colorFromSeed, formatUGX, isFeatured, listingPhotos, timeAgo } from '@/lib/format'
import { hasStudentNumber } from '@/lib/student-number'
import { marketPaths } from '@/lib/market-paths'
import { formatPhoneDisplay, hasContactPhone } from '@/lib/phone'
import type { GigApplication, Listing } from '@/lib/types'

export function GigDetail({ listing }: { listing: Listing }) {
  const router = useRouter()
  const { profile, saved, toggleSaved, notify, refresh, listings } = useMarket()
  const [payOpen, setPayOpen] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)
  const [studentGate, setStudentGate] = useState(false)
  const [phoneGate, setPhoneGate] = useState(false)
  const [pendingAction, setPendingAction] = useState<'apply' | 'message' | 'call' | 'feature' | null>(null)
  const checkout = useFeatureCheckout({
    listingId: listing.id,
    onPaid: () => {
      notify('Featured for 7 days.')
      setPayOpen(false)
      void refresh()
    },
    onNeedPhone: () => {
      setPendingAction('feature')
      setPhoneGate(true)
    },
  })
  const [photoIndex, setPhotoIndex] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)
  const [applications, setApplications] = useState<GigApplication[]>([])
  const [mine, setMine] = useState<GigApplication | null>(null)
  const { amountFor, durationDays } = useFeaturePrices(payOpen)
  const featurePrice = amountFor(listing.category)
  const isOwner = profile?.id === listing.owner_id
  const isStudent = hasStudentNumber(profile?.student_number)
  const isSaved = saved.includes(listing.id)
  const featured = isFeatured(listing)
  const photos = useMemo(() => listingPhotos(listing), [listing])
  const activePhoto = photos[Math.min(photoIndex, photos.length - 1)] ?? photos[0]
  const poster = listing.profiles?.display_name ?? 'Poster'
  const unavailable = listing.status === 'sold' || listing.status === 'archived' || listing.status === 'removed'
  const [contactPhones, setContactPhones] = useState<string[]>([])
  const canContact = Boolean(profile) && isStudent
  const related = useMemo(
    () => listings.filter((item) => item.id !== listing.id && item.category === 'Gigs' && item.status === 'active').slice(0, 4),
    [listing.id, listings],
  )

  useEffect(() => {
    setPhotoIndex(0)
    setContactPhones(
      [listing.profiles?.phone_primary, listing.profiles?.phone_secondary].filter((value): value is string => hasContactPhone(value)),
    )
  }, [listing])

  useEffect(() => {
    if (!profile) {
      setApplications([])
      setMine(null)
      return
    }
    api.gigApplications(listing.id)
      .then((result) => {
        setApplications(result.data)
        setMine(result.mine)
      })
      .catch(() => {
        setApplications([])
        setMine(null)
      })
  }, [listing.id, profile])

  function requireStudent(action: 'apply' | 'message' | 'call') {
    if (!profile) {
      window.location.href = loginHref(marketPaths.listing(listing.id))
      return false
    }
    if (!isStudent) {
      setPendingAction(action)
      setStudentGate(true)
      return false
    }
    if (action === 'apply' && !hasContactPhone(profile.phone_primary)) {
      setPendingAction(action)
      setPhoneGate(true)
      return false
    }
    return true
  }

  useEffect(() => {
    if (!isStudent || isOwner) return
    api.listing(listing.id)
      .then((result) => {
        setContactPhones(
          [result.data.profiles?.phone_primary, result.data.profiles?.phone_secondary].filter(
            (value): value is string => hasContactPhone(value),
          ),
        )
      })
      .catch(() => undefined)
  }, [isOwner, isStudent, listing.id])

  useEffect(() => {
    if (!pendingAction) return
    if (!profile) return
    if (!hasStudentNumber(profile.student_number)) return
    if (pendingAction === 'apply' && !hasContactPhone(profile.phone_primary)) {
      setPhoneGate(true)
      return
    }
    const action = pendingAction
    setPendingAction(null)
    if (action === 'apply') setApplyOpen(true)
    if (action === 'message') void startMessage()
  }, [pendingAction, profile])

  async function startMessage() {
    if (unavailable) return
    const result = await api.startConversation({ recipient_id: listing.owner_id, listing_id: listing.id })
    await refresh()
    router.push(marketPaths.conversation(result.data.id))
  }

  async function messagePoster() {
    if (!requireStudent('message')) return
    await startMessage()
  }

  async function reportListing() {
    if (!profile) {
      window.location.href = loginHref(marketPaths.listing(listing.id))
      return
    }
    await api.report({ listing_id: listing.id, reason: 'Suspicious listing' })
    notify('Report submitted. Our team will review it.')
  }

  async function openResume(application: GigApplication) {
    try {
      const result = await api.gigResumeUrl(listing.id, application.id)
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to open this resume.')
    }
  }

  function shiftPhoto(delta: number) {
    setPhotoIndex((current) => (current + delta + photos.length) % photos.length)
  }

  const statusCopy = listing.status === 'sold'
    ? 'This gig is closed.'
    : listing.status === 'archived' || listing.status === 'removed'
      ? 'This gig is no longer available.'
      : listing.status === 'pending'
        ? 'This gig is waiting for review.'
        : null

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-8 sm:py-8 lg:px-10 lg:pb-12">
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#8b9994] sm:mb-7">
        <Link href={marketPaths.home} className="inline-flex items-center gap-1.5 text-[#638076] transition hover:text-[#315e55]">
          <ArrowLeft size={14} /> Marketplace
        </Link>
        <span className="text-[#c5d0cb]">/</span>
        <span>Gigs</span>
        <span className="text-[#c5d0cb]">/</span>
        <span className="max-w-[16rem] truncate text-[#526861]">{listing.title}</span>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] lg:gap-8">
        <div className="min-w-0">
          {photos.length > 0 && (
            <div className="overflow-hidden rounded-[24px] border border-[#e5eae7] bg-white shadow-[0_12px_40px_rgba(36,62,57,0.06)] sm:rounded-[28px]">
              <div className="relative">
                <ListingPhoto src={activePhoto} listing={listing} alt={listing.title} className="aspect-[16/9] w-full sm:aspect-[2/1]" />
                <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 sm:p-4">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-white/92 px-2.5 py-1 text-[10px] font-bold text-[#52635e] shadow-sm backdrop-blur-sm">Gig</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#315e55] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                      <GraduationCap size={11} /> Students only
                    </span>
                    {featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#d1734b] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                        <Sparkles size={11} /> Featured
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <ListingShareTrigger listing={listing} onClick={() => setShareOpen(true)} className="size-10 border-white/70 bg-white/92 text-[#8b9994] shadow-sm backdrop-blur-sm hover:text-[#315e55]" />
                    <button
                      type="button"
                      aria-label={isSaved ? 'Remove from saved' : 'Save gig'}
                      onClick={() => void toggleSaved(listing.id, listing)}
                      className={`flex size-10 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition ${isSaved ? 'border-[#f0c7b3] bg-[#fff5f0] text-[#d1734b]' : 'border-white/70 bg-white/92 text-[#8b9994] hover:text-[#d1734b]'}`}
                    >
                      <Heart size={16} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
                {photos.length > 1 && (
                  <>
                    <button type="button" aria-label="Previous photo" onClick={() => shiftPhoto(-1)} className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#315e55] shadow-sm backdrop-blur-sm transition hover:bg-white">
                      <ChevronLeft size={18} />
                    </button>
                    <button type="button" aria-label="Next photo" onClick={() => shiftPhoto(1)} className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#315e55] shadow-sm backdrop-blur-sm transition hover:bg-white">
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          <section className={`${photos.length ? 'mt-5 sm:mt-6' : ''} rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_8px_24px_rgba(36,62,57,0.04)] sm:rounded-[28px] sm:p-7`}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Gig</p>
              {!photos.length ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#edf6f1] px-2.5 py-1 text-[10px] font-bold text-[#315e55]">
                  <GraduationCap size={11} /> Students only
                </span>
              ) : null}
            </div>
            <h1 className="mt-2 font-display text-[1.85rem] font-bold leading-tight tracking-[-0.045em] text-[#243e39] sm:text-[2.15rem]">{listing.title}</h1>
            <p className="mt-3 font-display text-2xl font-bold tracking-[-0.03em] text-[#d1734b]">
              {formatUGX(Number(listing.price), listing.currency)}
              <span className="ml-1.5 text-sm font-semibold tracking-normal text-[#9aa7a2]">Pay</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip icon={<MapPin size={12} />}>{listing.location || 'Uganda'}</Chip>
              <Chip icon={<Eye size={12} />}>{listing.view_count ?? 0} view{(listing.view_count ?? 0) === 1 ? '' : 's'}</Chip>
              <Chip icon={<Briefcase size={12} />}>{timeAgo(listing.created_at)}</Chip>
            </div>
            <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">About this gig</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#5f746c]">
              {listing.description?.trim() || 'The poster has not added a description yet.'}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <MetaRow label="How to apply" value="Submit your profile, a short note, and a resume. The poster reviews applications in Messages." />
              <MetaRow label="Who can apply" value="Signed-in students with a student number on UniMart." />
            </div>
          </section>

          {isOwner && (
            <section className="mt-5 rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_8px_24px_rgba(36,62,57,0.04)] sm:mt-6 sm:rounded-[28px] sm:p-7">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Applicants</p>
                  <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.03em] text-[#29463f]">
                    {applications.length ? `${applications.length} application${applications.length === 1 ? '' : 's'}` : 'No applications yet'}
                  </h2>
                </div>
              </div>
              {applications.length ? (
                <ul className="mt-5 space-y-2">
                  {applications.map((application) => (
                    <li key={application.id} className="flex items-start gap-3 rounded-2xl border border-[#eef3f0] bg-[#f8fbf9] px-3.5 py-3">
                      <Avatar name={application.profiles?.display_name || application.name} color={colorFromSeed(application.applicant_id)} image={application.profiles?.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#243e39]">{application.profiles?.display_name || application.name}</p>
                        <p className="mt-0.5 truncate text-[12px] text-[#748780]">
                          {[application.university || application.profiles?.university, application.campus || application.profiles?.campus].filter(Boolean).join(' · ') || 'Student'}
                          {' · '}
                          {timeAgo(application.created_at)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {application.conversation_id ? (
                            <Link href={marketPaths.conversation(application.conversation_id)} className="inline-flex h-8 items-center rounded-lg bg-[#315e55] px-3 text-[11px] font-bold text-white">
                              Open conversation
                            </Link>
                          ) : null}
                          <button type="button" onClick={() => void openResume(application)} className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#dfe7e3] px-3 text-[11px] font-bold text-[#315e55]">
                            <FileText size={12} /> Resume
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm leading-6 text-[#748780]">Applications will appear here and in Messages when a student applies.</p>
              )}
            </section>
          )}
        </div>

        <aside className="min-w-0 lg:sticky lg:top-24">
          <div className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_12px_40px_rgba(36,62,57,0.06)] sm:rounded-[28px] sm:p-6">
            {statusCopy && (
              <p className="mb-4 rounded-2xl bg-[#f4f7f6] px-3.5 py-2.5 text-xs font-semibold text-[#526861]">{statusCopy}</p>
            )}
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Apply</p>
            <h2 className="mt-2 font-display text-xl font-bold tracking-[-0.03em] text-[#243e39]">Students only</h2>
            <p className="mt-2 text-sm leading-6 text-[#748780]">
              Sign in with your student number to apply, message the poster, or view their phone number.
            </p>
            <div className="mt-5 space-y-2">
              {isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={() => { checkout.reset(); setPayOpen(true) }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d1734b] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#c26640]"
                  >
                    <Sparkles size={16} /> {featured ? 'Boost again' : 'Feature this gig'}
                  </button>
                  <Link href={marketPaths.postEdit(listing.id)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe7e3] px-4 py-3 text-sm font-bold text-[#315e55] transition hover:border-[#b8d1c9] hover:bg-[#f7fbf9]">
                    <Pencil size={15} /> Edit gig
                  </Link>
                </>
              ) : mine?.conversation_id ? (
                <Link href={marketPaths.conversation(mine.conversation_id)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#315e55] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#294f47]">
                  <MessageCircle size={16} /> View application
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={unavailable}
                  onClick={() => {
                    if (!requireStudent('apply')) return
                    setApplyOpen(true)
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#315e55] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#294f47] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Briefcase size={16} /> Apply for this gig
                </button>
              )}
              {!isOwner && (
                <>
                  <button
                    type="button"
                    disabled={unavailable}
                    onClick={() => { void messagePoster() }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe7e3] px-4 py-3 text-sm font-bold text-[#315e55] transition hover:border-[#b8d1c9] hover:bg-[#f7fbf9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {canContact ? <MessageCircle size={16} /> : <Lock size={16} />} Message poster
                  </button>
                  {canContact && contactPhones.length ? (
                    <div className="space-y-2">
                      {contactPhones.map((phone) => (
                        <div key={phone} className="flex items-center gap-2 rounded-xl border border-[#dfe7e3] bg-[#f7fbf9] px-3 py-2">
                          <p className="min-w-0 flex-1 truncate text-sm font-bold text-[#29463f]">{formatPhoneDisplay(phone)}</p>
                          <a href={`tel:${phone}`} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#315e55] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#294f47]">
                            <Phone size={13} /> Call
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : !canContact ? (
                    <button
                      type="button"
                      onClick={() => { requireStudent('call') }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#dfe7e3] px-4 py-3 text-sm font-bold text-[#638076]"
                    >
                      <Lock size={15} /> Call — students only
                    </button>
                  ) : null}
                </>
              )}
            </div>
            <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-[#8b9994]">
              <Shield size={12} className="mt-0.5 shrink-0 text-[#d1734b]" />
              Confirm the work, pay, and location in writing. UniMart hosts the listing — it does not employ applicants.
            </p>
          </div>

          <div className="mt-4 rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_8px_24px_rgba(36,62,57,0.04)] sm:rounded-[28px] sm:p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Posted by</p>
            <div className="mt-3 flex items-start gap-3">
              <Avatar name={poster} color={colorFromSeed(listing.owner_id)} image={listing.profiles?.avatar_url} size="lg" />
              <div className="min-w-0 pt-0.5">
                <p className="flex items-center gap-1.5 font-display text-lg font-bold tracking-[-0.03em] text-[#243e39]">
                  <span className="truncate">{poster}</span>
                  {listing.profiles?.verified && <BadgeCheck size={16} className="shrink-0 text-[#4e786a]" />}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#748780]">
                  {[listing.profiles?.university, listing.profiles?.campus].filter(Boolean).join(' · ') || 'UniMart member'}
                </p>
              </div>
            </div>
          </div>

          {!isOwner && (
            <button type="button" onClick={() => { void reportListing() }} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-[#8b9994] transition hover:text-[#9a4f32]">
              <Flag size={12} /> Report this gig
            </button>
          )}
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-10 sm:mt-12">
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">More gigs</p>
            <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.03em] text-[#29463f]">Open nearby</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {related.map((item) => (
              <ListingCard key={item.id} item={item} saved={saved.includes(item.id)} toggleSaved={toggleSaved} />
            ))}
          </div>
        </section>
      )}

      <ListingShareSheet listing={listing} open={shareOpen} onClose={() => setShareOpen(false)} />
      <StudentNumberGate
        open={studentGate}
        onClose={() => { setStudentGate(false); setPendingAction(null) }}
        onSaved={() => {
          setStudentGate(false)
        }}
      />
      <PhoneContactGate
        open={phoneGate}
        onClose={() => { setPhoneGate(false); setPendingAction(null) }}
        onSaved={() => {
          const action = pendingAction
          setPhoneGate(false)
          setPendingAction(null)
          if (action === 'apply') setApplyOpen(true)
          if (action === 'feature') void checkout.pay('mobile_money')
        }}
      />
      <GigApplySheet
        listing={listing}
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        onApplied={() => {
          api.gigApplications(listing.id)
            .then((result) => {
              setApplications(result.data)
              setMine(result.mine)
            })
            .catch(() => undefined)
          notify('Application sent. The poster will see it in Messages.')
        }}
        onOpenThread={(conversationId) => {
          setApplyOpen(false)
          router.push(marketPaths.conversation(conversationId))
        }}
      />

      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button type="button" aria-label="Close" onClick={() => { checkout.reset(); setPayOpen(false) }} className="absolute inset-0 bg-[#0c1c19]/50 backdrop-blur-[6px]" />
          <div className="relative w-full max-w-md rounded-t-[28px] border border-[#e5eae7] bg-white p-6 shadow-[0_24px_80px_rgba(8,24,20,0.28)] sm:rounded-[28px] sm:p-7">
            <button type="button" aria-label="Close checkout" onClick={() => { checkout.reset(); setPayOpen(false) }} className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-[#e5eae7] text-[#687b75] transition hover:bg-[#f7fbf9]">
              <X size={16} />
            </button>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#d1734b]">Feature gig</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-[#243e39]">Get more eyes on this post</h2>
            <p className="mt-2 text-sm leading-6 text-[#71827b]">Featured gigs appear first in search. Mobile money is collected directly on your phone. Cards use DPO.</p>
            {featurePrice != null && (
              <p className="mt-3 font-display text-xl font-bold tracking-[-0.03em] text-[#243e39]">
                {formatUGX(featurePrice)}
                <span className="ml-1.5 text-sm font-semibold text-[#8b9994]">· {durationDays} days</span>
              </p>
            )}
            <FeaturePayButtons checkout={checkout} />
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#e5eae7] bg-[#f7fbf9] px-2.5 py-1 text-[11px] font-semibold text-[#5f746c]">
      {icon}
      {children}
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f7fbf9] px-4 py-3">
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b9994]">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-6 text-[#29463f]">{value}</dd>
    </div>
  )
}
