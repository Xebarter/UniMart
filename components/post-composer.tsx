'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Home,
  ImagePlus,
  MapPin,
  Package,
  Sparkles,
  Tag,
  X,
} from 'lucide-react'
import { ListingPhoto } from '@/components/listing-photo'
import { api } from '@/lib/api-client'
import { formatUGX, listingImage, parsePrice, rentPeriodSuffix } from '@/lib/format'
import type { Listing, ListingCategory, Profile, RentPeriod } from '@/lib/types'

const MAX_PHOTOS = 6
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const TITLE_MAX = 80
const DESCRIPTION_MAX = 600
const FIELD =
  'w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] text-base outline-none transition focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6] sm:text-sm'

const STEPS = ['Type', 'Photos', 'Details'] as const

const CATEGORIES: { id: ListingCategory; label: string; hint: string; icon: typeof Package }[] = [
  { id: 'Products', label: 'Product', hint: 'Something they can pick up', icon: Package },
  { id: 'Services', label: 'Service', hint: 'A skill you can offer', icon: BriefcaseBusiness },
  { id: 'Rentals', label: 'Rental', hint: 'A room, kit, or gear', icon: Home },
  { id: 'Gigs', label: 'Gig', hint: 'Short work, fair pay', icon: Tag },
]

const CONDITIONS = [
  { id: 'new', label: 'New' },
  { id: 'like new', label: 'Like new' },
  { id: 'good', label: 'Good' },
  { id: 'fair', label: 'Fair' },
]

const RENT_PERIOD_OPTIONS: { id: RentPeriod; label: string }[] = [
  { id: 'day', label: 'Per day' },
  { id: 'week', label: 'Per week' },
  { id: 'month', label: 'Per month' },
]

function placeholders(type: ListingCategory) {
  if (type === 'Services') {
    return {
      title: 'e.g. Graduation photography',
      price: 'Starting from',
      location: 'Studio or neighborhood',
      description: 'What you do, how long it takes, and who it is for.',
    }
  }
  if (type === 'Rentals') {
    return {
      title: 'e.g. Single room near main gate',
      price: 'Price',
      location: 'Hall, hostel, or area',
      description: 'Space, amenities, and who it suits best.',
    }
  }
  if (type === 'Gigs') {
    return {
      title: 'e.g. Need a poster for orientation',
      price: 'Budget',
      location: 'On-site or remote',
      description: 'The brief, deadline, and what done looks like.',
    }
  }
  return {
    title: 'e.g. MacBook Air M1',
    price: 'Price',
    location: 'Pickup area or neighborhood',
    description: 'Condition, what is included, and why it is a good buy.',
  }
}

function isDesktop() {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
}

function Avatar({ name, image }: { name: string; image?: string | null }) {
  if (image) return <img src={image} alt="" className="size-7 shrink-0 rounded-full object-cover" />
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const value = `${parts[0]?.[0] ?? 'U'}${parts[1]?.[0] ?? ''}`.toUpperCase()
  return (
    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#d9e6e2] text-[10px] font-semibold text-[#31574e]">
      {value}
    </span>
  )
}

function PreviewCard({
  type,
  title,
  amount,
  location,
  cover,
  existingPhotos,
  profile,
  rentPeriod,
}: {
  type: ListingCategory
  title: string
  amount: number
  location: string
  cover?: string
  existingPhotos: Listing['listing_media']
  profile: Profile
  rentPeriod: RentPeriod
}) {
  const suffix = type === 'Rentals' ? rentPeriodSuffix(rentPeriod) : null
  return (
    <article className="overflow-hidden rounded-2xl border border-[#eef3f0] bg-white">
      <div className="relative">
        <ListingPhoto src={cover} listing={{ category: type, listing_media: existingPhotos }} alt={title} className="aspect-[4/3] w-full" />
        <span className="absolute left-3 top-3 z-[2] rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#52635e]">{type}</span>
      </div>
      <div className="p-3.5">
        <h3 className="truncate text-sm font-bold text-[#29463f]">{title.trim() || 'Your title'}</h3>
        <p className="mt-1 truncate text-[13px] font-bold text-[#d1734b]">
          {Number.isFinite(amount) && amount > 0 ? formatUGX(amount) : 'UGX —'}
          {suffix && <span className="font-semibold text-[#9aa7a2]"> {suffix}</span>}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8c9995]">
          <MapPin size={12} />
          <span className="truncate">{location.trim() || 'Pickup location'}</span>
        </div>
        <div className="mt-3 flex items-center gap-2 border-t border-[#eff2f0] pt-3">
          <Avatar name={profile.display_name} image={profile.avatar_url} />
          <span className="truncate text-[11px] font-medium text-[#788883]">{profile.display_name}</span>
        </div>
      </div>
    </article>
  )
}

export function PostComposer({
  profile,
  listing,
  onBack,
  onCreated,
  onSeeLive,
  openShopHref,
  shopLiveNote,
  shopId,
  embedded = false,
}: {
  profile: Profile
  listing?: Listing
  onBack: () => void
  onCreated: (listing: Listing) => Promise<void>
  onSeeLive: (listing: Listing) => void
  openShopHref?: string
  shopLiveNote?: string
  shopId?: string
  embedded?: boolean
}) {
  const editing = Boolean(listing)
  const existingPhotos = useMemo(
    () => [...(listing?.listing_media ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [listing],
  )
  const remainingSlots = Math.max(0, MAX_PHOTOS - existingPhotos.length)
  const inputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(0)
  const [type, setType] = useState<ListingCategory>(listing?.category ?? 'Products')
  const [title, setTitle] = useState(listing?.title ?? '')
  const [price, setPrice] = useState(listing ? String(Math.round(Number(listing.price) || 0)) : '')
  const [location, setLocation] = useState(listing?.location || profile.campus || profile.university || '')
  const [description, setDescription] = useState(listing?.description ?? '')
  const [condition, setCondition] = useState(listing?.condition || 'good')
  const [rentPeriod, setRentPeriod] = useState<RentPeriod>(listing?.rent_period ?? 'month')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [published, setPublished] = useState<Listing | null>(null)
  const copy = placeholders(type)
  const amount = parsePrice(price)
  const emptyPhotos = !existingPhotos.length && !files.length

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  )

  useEffect(() => {
    return () => previews.forEach((item) => URL.revokeObjectURL(item.url))
  }, [previews])

  useEffect(() => {
    if (isDesktop()) return
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  function addFiles(list: FileList | File[]) {
    const incoming = Array.from(list)
    const next = [...files]
    let message = ''
    for (const file of incoming) {
      if (next.length >= remainingSlots) {
        message = `You can add up to ${MAX_PHOTOS} photos.`
        break
      }
      if (!file.type.startsWith('image/')) {
        message = 'Use JPG, PNG, or WEBP photos.'
        continue
      }
      if (file.size > MAX_PHOTO_BYTES) {
        message = 'Each photo needs to be under 5MB.'
        continue
      }
      next.push(file)
    }
    setFiles(next)
    setError(message)
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, item) => item !== index))
  }

  function makeCover(index: number) {
    setFiles((current) => {
      if (index <= 0) return current
      const next = [...current]
      const [picked] = next.splice(index, 1)
      return [picked, ...next]
    })
  }

  async function saveListing() {
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    const trimmedLocation = location.trim()
    if (trimmedTitle.length < 4) {
      setError('Give it a title people can scan in a second.')
      setStep(2)
      return
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Add a price so people know what to expect.')
      setStep(2)
      return
    }
    if (!trimmedLocation) {
      setError('Add a pickup point or area.')
      setStep(2)
      return
    }
    if (trimmedDescription.length < 20) {
      setError('A short description helps people decide faster.')
      setStep(2)
      return
    }

    setBusy(true)
    setError('')
    setStatus(editing ? 'Saving your listing…' : 'Publishing your listing…')
    try {
      const saved = listing
        ? await api.updateListing(listing.id, {
            title: trimmedTitle,
            description: trimmedDescription,
            category: type,
            price: amount,
            location: trimmedLocation,
            condition: type === 'Products' ? condition : 'good',
            rent_period: type === 'Rentals' ? rentPeriod : null,
          })
        : await api.createListing({
            title: trimmedTitle,
            description: trimmedDescription,
            category: type,
            price: amount,
            location: trimmedLocation,
            condition: type === 'Products' ? condition : 'good',
            rent_period: type === 'Rentals' ? rentPeriod : null,
            ...(shopId ? { shop_id: shopId } : {}),
          })
      for (const [index, file] of files.entries()) {
        setStatus(`Adding photos ${index + 1} of ${files.length}…`)
        await api.uploadMedia(saved.data.id, file)
      }
      const fresh = files.length
        ? await api.listing(saved.data.id).catch(() => saved)
        : saved
      setPublished(fresh.data)
      await onCreated(fresh.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : editing ? 'Unable to save listing.' : 'Unable to publish listing.')
    } finally {
      setBusy(false)
      setStatus('')
    }
  }

  function onFormSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isDesktop() && step < 2) {
      setStep((current) => current + 1)
      return
    }
    void saveListing()
  }

  function reset() {
    setPublished(null)
    setStep(0)
    setTitle('')
    setPrice('')
    setDescription('')
    setFiles([])
    setError('')
    setCondition('good')
    setRentPeriod('month')
    setLocation(profile.campus || profile.university || '')
  }

  const preview = (
    <PreviewCard
      type={type}
      title={title}
      amount={amount}
      location={location}
      cover={previews[0]?.url}
      existingPhotos={existingPhotos}
      profile={profile}
      rentPeriod={rentPeriod}
    />
  )

  if (published) {
    const image = listingImage(published)
    const cover = image.startsWith('http') ? image : previews[0]?.url
    return (
      <div className="mx-auto flex max-w-[560px] flex-col items-center px-1 pb-28 pt-8 text-center sm:px-8 sm:pb-20 sm:py-20">
        <div className="post-success-mark flex size-[72px] items-center justify-center rounded-full bg-[#e7f3ee] text-[#2f5b52] shadow-[0_12px_40px_rgba(49,94,85,0.12)]">
          <CheckCircle2 size={34} />
        </div>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">{editing ? 'Saved' : 'Live on UniMart'}</p>
        <h1 className="mt-2 font-display text-[1.65rem] font-bold tracking-[-0.04em] text-[#243e39] sm:text-4xl">{editing ? 'Your listing is updated.' : 'Your listing is up.'}</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#748780]">{editing ? 'Buyers will see the latest details.' : 'People nearby can find it now. A clear photo and a fair price usually get the first message.'}</p>
        <article className="mt-8 w-full overflow-hidden rounded-2xl border border-[#e5eae7] bg-white text-left shadow-[0_10px_30px_rgba(36,62,57,0.06)]">
          <ListingPhoto listing={published} src={cover} alt={published.title} className="aspect-[4/3] w-full" />
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">{published.category}</p>
            <h2 className="mt-1 truncate font-display text-lg font-bold text-[#29463f]">{published.title}</h2>
            <p className="mt-1 text-sm font-bold text-[#d1734b]">
              {formatUGX(Number(published.price), published.currency)}
              {published.category === 'Rentals' && rentPeriodSuffix(published.rent_period) && (
                <span className="font-semibold text-[#9aa7a2]"> {rentPeriodSuffix(published.rent_period)}</span>
              )}
            </p>
            <p className="mt-2 flex items-center gap-1 text-[12px] text-[#8c9995]"><MapPin size={12} />{published.location}</p>
          </div>
        </article>
        <div className="mt-7 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <button onClick={() => onSeeLive(published)} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44] sm:h-11">
            See it live <ArrowUpRight size={16} />
          </button>
          {!editing && (
            <button onClick={reset} className="inline-flex h-12 items-center justify-center rounded-xl border border-[#dfe7e3] px-5 text-sm font-bold text-[#5f746c] hover:bg-[#f6f9f8] sm:h-11">
              Post another
            </button>
          )}
        </div>
        {shopLiveNote && !editing && (
          <p className="mt-4 text-xs font-medium text-[#638076]">{shopLiveNote}</p>
        )}
        {openShopHref && !editing && (
          <Link href={openShopHref} className="mt-4 text-xs font-bold text-[#315e55] hover:underline">
            Open a shop so people can follow you.
          </Link>
        )}
        <button onClick={onBack} className="mt-3 text-xs font-bold text-[#8b9994] hover:text-[#526861]">Back</button>
      </div>
    )
  }

  return (
    <div className={embedded ? '' : 'mx-auto w-full max-w-[1100px] px-3 pb-8 pt-5 sm:px-8 sm:pt-8 lg:px-10'}>
      <div className="max-w-xl">
        {!embedded && (
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8b9994] hover:text-[#526861]">
            <ChevronLeft size={14} /> Back
          </button>
        )}
        {!embedded && (
          <>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">{editing ? 'Edit listing' : 'New listing'}</p>
            <h1 className="mt-2 font-display text-[1.85rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.35rem]">{editing ? 'Update the details buyers see.' : 'Make it easy to say yes.'}</h1>
          </>
        )}
        <p className={`text-[13px] leading-6 text-[#748780] sm:text-sm ${embedded ? 'hidden sm:block' : 'mt-2'}`}>
          {editing
            ? 'Save changes, then head back. You can add more photos here.'
            : embedded
              ? 'A strong photo, a clear price, and where to find you. People can find it on the marketplace.'
              : 'A strong photo, a clear price, and where to find you. That is usually enough.'}
        </p>
        {shopLiveNote && !editing && embedded && (
          <p className="mt-2 hidden text-xs font-medium text-[#638076] sm:block">{shopLiveNote}</p>
        )}
      </div>

      <div className="mt-4 lg:hidden">
        <div className="flex items-center justify-between text-[11px] font-bold text-[#638076]">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span className="text-[#29463f]">{STEPS[step]}</span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              onClick={() => setStep(index)}
              className={`h-1.5 flex-1 rounded-full transition ${index <= step ? 'bg-[#315e55]' : 'bg-[#dce8e3]'}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-5 grid items-start gap-6 sm:mt-7 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={onFormSubmit} className="min-w-0">
          <div className={step === 0 ? 'block' : 'hidden lg:block'}>
            <p className="mb-3 text-xs font-bold text-[#526861] lg:hidden">What are you posting?</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
              {CATEGORIES.map(({ id, label, hint, icon: Icon }) => {
                const active = type === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setType(id)
                      if (!isDesktop() && step === 0) setStep(1)
                    }}
                    className={`min-h-[108px] rounded-2xl border p-3.5 text-left transition sm:min-h-0 sm:p-4 ${
                      active
                        ? 'border-[#8bb4a7] bg-[#eaf3ef] shadow-[0_8px_24px_rgba(49,94,85,0.08)]'
                        : 'border-[#e5eae7] bg-white hover:border-[#bfd4cc]'
                    }`}
                  >
                    <span className={`mb-2.5 flex size-8 items-center justify-center rounded-xl sm:mb-4 sm:size-9 ${active ? 'bg-white text-[#d1734b]' : 'bg-[#f4f8f6] text-[#d1734b]'}`}>
                      <Icon size={18} />
                    </span>
                    <span className="block text-[13px] font-bold text-[#29463f]">{label}</span>
                    <span className="mt-1 block text-[11px] leading-4 text-[#7d9089]">{hint}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className={`${step === 0 ? 'hidden lg:block' : 'block'} mt-4 rounded-[20px] border border-[#e5eae7] bg-white p-3.5 shadow-[0_8px_30px_rgba(36,62,57,0.04)] sm:mt-5 sm:rounded-[24px] sm:p-6`}>
              <div
                className={step === 1 ? 'block' : 'hidden lg:block'}
              >
              <div
                onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
                onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragging(false)
                  if (event.dataTransfer.files.length) addFiles(event.dataTransfer.files)
                }}
                className={`rounded-2xl border border-dashed p-3 transition sm:p-4 ${dragging ? 'border-[#8bb4a7] bg-[#eaf3ef]' : 'border-[#d5e4de] bg-[#f7fbf9]'}`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#2e4942]">Photos</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-[#7d9089]">{existingPhotos.length ? 'Existing photos stay. Add more if you have them.' : 'First photo becomes the cover.'} Up to {MAX_PHOTOS}.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={!remainingSlots}
                    className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[#d7e4df] bg-white px-3 text-[11px] font-bold text-[#526861] disabled:opacity-50 sm:h-9"
                  >
                    <ImagePlus size={14} /> Add
                  </button>
                </div>
                <div className={`grid gap-2 ${emptyPhotos ? 'grid-cols-1 sm:grid-cols-6' : 'grid-cols-3 sm:grid-cols-6'}`}>
                  {existingPhotos.map((item, index) => (
                    <div key={item.id} className="relative aspect-square overflow-hidden rounded-xl bg-[#dce4ee]">
                      <ListingPhoto listing={{ category: type, listing_media: [item] }} alt="" className="size-full" />
                      {index === 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-[#315e55]">Cover</span>
                      )}
                    </div>
                  ))}
                  {previews.map((item, index) => (
                    <div key={item.url} className="group relative aspect-square overflow-hidden rounded-xl bg-[#dce4ee]">
                      <img src={item.url} alt="" className="size-full object-cover object-center" />
                      {!existingPhotos.length && index === 0 && (
                        <span className="absolute left-1.5 top-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-[#315e55]">Cover</span>
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/55 to-transparent p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                        {!existingPhotos.length && index > 0 && (
                          <button type="button" onClick={() => makeCover(index)} className="rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-[#315e55]">Cover</button>
                        )}
                        <button type="button" aria-label="Remove photo" onClick={() => removeFile(index)} className="ml-auto flex size-7 items-center justify-center rounded-md bg-white/90 text-[#5f746c] sm:size-6">
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {files.length < remainingSlots && (
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#c9dbd4] bg-white text-[#7d9089] transition hover:border-[#8bb4a7] hover:text-[#315e55] ${
                        emptyPhotos ? 'min-h-[168px] sm:min-h-0 sm:aspect-square' : 'aspect-square'
                      }`}
                    >
                      <ImagePlus size={emptyPhotos ? 28 : 18} />
                      <span className="text-[11px] font-bold sm:text-[10px]">{emptyPhotos ? 'Add photos' : 'Photo'}</span>
                      {emptyPhotos && <span className="px-6 text-center text-[11px] leading-4 text-[#9aa7a2] sm:hidden">From your camera roll. First one is the cover.</span>}
                    </button>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files?.length) addFiles(event.target.files)
                    event.target.value = ''
                  }}
                />
              </div>
              </div>

              <div className={step === 2 ? 'block' : 'hidden lg:block'}>
              <div className="mb-5 lg:hidden">{preview}</div>

              <label className="mt-0 block lg:mt-5">
                <span className="flex items-center justify-between text-xs font-bold text-[#526861]">
                  Title
                  <span className="font-medium text-[#9aa7a2]">{title.length}/{TITLE_MAX}</span>
                </span>
                <input
                  required
                  maxLength={TITLE_MAX}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={copy.title}
                  autoComplete="off"
                  enterKeyHint="next"
                  className={`mt-2 h-12 px-3.5 ${FIELD}`}
                />
              </label>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-bold text-[#526861]">{copy.price}</span>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#91a39c]">UGX</span>
                    <input
                      required
                      inputMode="numeric"
                      value={price}
                      onChange={(event) => setPrice(event.target.value.replace(/[^\d]/g, ''))}
                      placeholder="0"
                      enterKeyHint="next"
                      className={`h-12 pl-[52px] pr-3 ${FIELD}`}
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-[#7d9089]">
                    {Number.isFinite(amount) && amount > 0
                      ? `${formatUGX(amount)}${type === 'Rentals' && rentPeriodSuffix(rentPeriod) ? ` ${rentPeriodSuffix(rentPeriod)}` : ''}`
                      : 'Shown exactly as buyers will see it.'}
                  </p>
                </label>
                {type === 'Rentals' ? (
                  <label className="block">
                    <span className="text-xs font-bold text-[#526861]">Period</span>
                    <div className="relative mt-2">
                      <CalendarClock size={15} className="pointer-events-none absolute left-3.5 top-1/2 z-[1] -translate-y-1/2 text-[#91a39c]" />
                      <select
                        value={rentPeriod}
                        onChange={(event) => setRentPeriod(event.target.value as RentPeriod)}
                        className={`h-12 cursor-pointer appearance-none pl-9 pr-10 ${FIELD}`}
                      >
                        {RENT_PERIOD_OPTIONS.map((item) => (
                          <option key={item.id} value={item.id}>{item.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#91a39c]" />
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#7d9089]">How often this rate is charged.</p>
                  </label>
                ) : (
                  <label className="block">
                    <span className="text-xs font-bold text-[#526861]">Location</span>
                    <div className="relative mt-2">
                      <MapPin size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a39c]" />
                      <input
                        required
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder={copy.location}
                        autoComplete="off"
                        enterKeyHint="next"
                        className={`h-12 pl-9 pr-3 ${FIELD}`}
                      />
                    </div>
                  </label>
                )}
              </div>
              {type === 'Rentals' && (
                <label className="mt-5 block">
                  <span className="text-xs font-bold text-[#526861]">Location</span>
                  <div className="relative mt-2">
                    <MapPin size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a39c]" />
                    <input
                      required
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      placeholder={copy.location}
                      autoComplete="off"
                      enterKeyHint="next"
                      className={`h-12 pl-9 pr-3 ${FIELD}`}
                    />
                  </div>
                </label>
              )}

              {type === 'Products' && (
                <div className="mt-5">
                  <p className="text-xs font-bold text-[#526861]">Condition</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {CONDITIONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCondition(item.id)}
                        className={`h-11 rounded-full px-2 text-[11px] font-bold transition sm:h-auto sm:px-3.5 sm:py-2 sm:text-xs ${
                          condition === item.id ? 'bg-[#315e55] text-white' : 'border border-[#e5eae7] bg-[#fbfcfb] text-[#6e8079] hover:border-[#bfd4cc]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="mt-5 block">
                <span className="flex items-center justify-between text-xs font-bold text-[#526861]">
                  Description
                  <span className="font-medium text-[#9aa7a2]">{description.length}/{DESCRIPTION_MAX}</span>
                </span>
                <textarea
                  required
                  rows={5}
                  maxLength={DESCRIPTION_MAX}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={copy.description}
                  className={`mt-2 resize-none p-3.5 leading-6 ${FIELD}`}
                />
              </label>

              {error && <p role="alert" className="mt-4 rounded-xl bg-[#fff5f0] px-3 py-2.5 text-sm text-[#b85a38]">{error}</p>}

              <div className="mt-6 hidden lg:block">
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#315e55] text-sm font-bold text-white shadow-[0_10px_24px_rgba(49,94,85,0.18)] transition hover:bg-[#274c44] disabled:opacity-60"
                >
                  {busy ? status || (editing ? 'Saving…' : 'Publishing…') : editing ? 'Save changes' : 'Publish listing'}
                  {!busy && <ArrowUpRight size={16} />}
                </button>
                {busy && (
                  <p className="mt-2 text-center text-[11px] font-medium text-[#7d9089]">{status}</p>
                )}
              </div>
            </div>
          </div>

          {error && step !== 2 && (
            <p role="alert" className="mt-4 rounded-xl bg-[#fff5f0] px-3 py-2.5 text-sm text-[#b85a38] lg:hidden">{error}</p>
          )}

          <div className="h-24 lg:hidden" />
          <div className="fixed inset-x-0 z-20 border-t border-[#eef3f0] bg-white/95 px-3.5 py-3 backdrop-blur lg:hidden" style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="mx-auto flex max-w-[1040px] gap-2">
              <button
                type="button"
                onClick={() => (step > 0 ? setStep(step - 1) : onBack())}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-xl border border-[#dfe7e3] text-sm font-bold text-[#5f746c]"
              >
                Back
              </button>
              {step < 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  className="inline-flex h-12 flex-[1.35] items-center justify-center rounded-xl bg-[#315e55] text-sm font-bold text-white shadow-[0_10px_24px_rgba(49,94,85,0.18)]"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex h-12 flex-[1.35] items-center justify-center gap-2 rounded-xl bg-[#315e55] text-sm font-bold text-white shadow-[0_10px_24px_rgba(49,94,85,0.18)] disabled:opacity-60"
                >
                  {busy ? status || (editing ? 'Saving…' : 'Publishing…') : editing ? 'Save' : 'Publish'}
                  {!busy && <ArrowUpRight size={16} />}
                </button>
              )}
            </div>
            {busy && <p className="mt-2 text-center text-[11px] font-medium text-[#7d9089]">{status}</p>}
          </div>
        </form>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <div className="rounded-[24px] border border-[#e5eae7] bg-white p-4 shadow-[0_8px_30px_rgba(36,62,57,0.04)]">
            <div className="mb-3 flex items-center gap-2 text-[#d1734b]">
              <Sparkles size={15} />
              <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Live preview</p>
            </div>
            {preview}
            <p className="mt-4 text-[12px] leading-5 text-[#7d9089]">This is how it appears in the marketplace. Cover photo first, then the details that close the deal.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
