'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
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
import { formatUGX, listingImage, parsePrice } from '@/lib/format'
import type { Listing, ListingCategory, Profile } from '@/lib/types'

const MAX_PHOTOS = 6
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const TITLE_MAX = 80
const DESCRIPTION_MAX = 600

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

function placeholders(type: ListingCategory) {
  if (type === 'Services') {
    return {
      title: 'e.g. Graduation photography',
      price: 'Starting from',
      location: 'Campus or studio',
      description: 'What you do, how long it takes, and who it is for.',
    }
  }
  if (type === 'Rentals') {
    return {
      title: 'e.g. Single room near main gate',
      price: 'Per month',
      location: 'Hall, hostel, or area',
      description: 'Space, amenities, and who it suits best.',
    }
  }
  if (type === 'Gigs') {
    return {
      title: 'e.g. Need a poster for orientation',
      price: 'Budget',
      location: 'Campus or remote',
      description: 'The brief, deadline, and what done looks like.',
    }
  }
  return {
    title: 'e.g. MacBook Air M1',
    price: 'Price',
    location: 'Campus or neighborhood',
    description: 'Condition, what is included, and why it is a good buy.',
  }
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

export function PostComposer({
  profile,
  listing,
  onBack,
  onCreated,
  onSeeLive,
}: {
  profile: Profile
  listing?: Listing
  onBack: () => void
  onCreated: (listing: Listing) => Promise<void>
  onSeeLive: (listing: Listing) => void
}) {
  const editing = Boolean(listing)
  const existingPhotos = useMemo(
    () => [...(listing?.listing_media ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [listing],
  )
  const remainingSlots = Math.max(0, MAX_PHOTOS - existingPhotos.length)
  const inputRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState<ListingCategory>(listing?.category ?? 'Products')
  const [title, setTitle] = useState(listing?.title ?? '')
  const [price, setPrice] = useState(listing ? String(Math.round(Number(listing.price) || 0)) : '')
  const [location, setLocation] = useState(listing?.location || profile.campus || profile.university || '')
  const [description, setDescription] = useState(listing?.description ?? '')
  const [condition, setCondition] = useState(listing?.condition || 'good')
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [published, setPublished] = useState<Listing | null>(null)
  const copy = placeholders(type)
  const amount = parsePrice(price)

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  )

  useEffect(() => {
    return () => previews.forEach((item) => URL.revokeObjectURL(item.url))
  }, [previews])

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

  async function submit(event: FormEvent) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    const trimmedLocation = location.trim()
    if (trimmedTitle.length < 4) {
      setError('Give it a title people can scan in a second.')
      return
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Add a price so people know what to expect.')
      return
    }
    if (!trimmedLocation) {
      setError('Add a pickup point or campus area.')
      return
    }
    if (trimmedDescription.length < 20) {
      setError('A short description helps people decide faster.')
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
          })
        : await api.createListing({
            title: trimmedTitle,
            description: trimmedDescription,
            category: type,
            price: amount,
            location: trimmedLocation,
            condition: type === 'Products' ? condition : 'good',
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

  function reset() {
    setPublished(null)
    setTitle('')
    setPrice('')
    setDescription('')
    setFiles([])
    setError('')
    setCondition('good')
    setLocation(profile.campus || profile.university || '')
  }

  if (published) {
    const image = listingImage(published)
    const cover = image.startsWith('http') ? image : previews[0]?.url
    return (
      <div className="mx-auto flex max-w-[560px] flex-col items-center px-4 py-14 text-center sm:px-8 sm:py-20">
        <div className="post-success-mark flex size-[72px] items-center justify-center rounded-full bg-[#e7f3ee] text-[#2f5b52] shadow-[0_12px_40px_rgba(49,94,85,0.12)]">
          <CheckCircle2 size={34} />
        </div>
        <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">{editing ? 'Saved' : 'Live on UniMart'}</p>
        <h1 className="mt-2 font-display text-[1.85rem] font-bold tracking-[-0.04em] text-[#243e39] sm:text-4xl">{editing ? 'Your listing is updated.' : 'Your listing is up.'}</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#748780]">{editing ? 'Campus will see the latest details. You can keep managing it from your shop.' : 'Campus can find it now. A clear photo and a fair price usually get the first message.'}</p>
        <article className="mt-8 w-full overflow-hidden rounded-2xl border border-[#e5eae7] bg-white text-left shadow-[0_10px_30px_rgba(36,62,57,0.06)]">
          <ListingPhoto listing={published} src={cover} alt={published.title} className="aspect-[4/3] w-full" />
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">{published.category}</p>
            <h2 className="mt-1 truncate font-display text-lg font-bold text-[#29463f]">{published.title}</h2>
            <p className="mt-1 text-sm font-bold text-[#d1734b]">{formatUGX(Number(published.price), published.currency)}</p>
            <p className="mt-2 flex items-center gap-1 text-[12px] text-[#8c9995]"><MapPin size={12} />{published.location}</p>
          </div>
        </article>
        <div className="mt-7 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
          <button onClick={() => onSeeLive(published)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44]">
            See it live <ArrowUpRight size={16} />
          </button>
          {!editing && (
            <button onClick={reset} className="inline-flex h-11 items-center justify-center rounded-xl border border-[#dfe7e3] px-5 text-sm font-bold text-[#5f746c] hover:bg-[#f6f9f8]">
              Post another
            </button>
          )}
        </div>
        <button onClick={onBack} className="mt-3 text-xs font-bold text-[#8b9994] hover:text-[#526861]">Back to shop</button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-3 pb-8 pt-5 sm:px-8 sm:pt-8 lg:px-10">
      <div className="max-w-xl">
        <button type="button" onClick={onBack} className="text-[11px] font-bold text-[#8b9994] hover:text-[#526861]">Back to shop</button>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">{editing ? 'Edit listing' : 'New listing'}</p>
        <h1 className="mt-2 font-display text-[1.85rem] font-bold tracking-[-0.045em] text-[#243e39] sm:text-[2.35rem]">{editing ? 'Update the details buyers see.' : 'Make it easy to say yes.'}</h1>
        <p className="mt-2 text-sm leading-6 text-[#748780]">{editing ? 'Save changes, then head back to your shop. You can add more photos here.' : 'A strong photo, a clear price, and where to find you. That is usually enough.'}</p>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={submit} className="min-w-0">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {CATEGORIES.map(({ id, label, hint, icon: Icon }) => {
              const active = type === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setType(id)}
                  className={`rounded-2xl border p-3.5 text-left transition sm:p-4 ${
                    active
                      ? 'border-[#8bb4a7] bg-[#eaf3ef] shadow-[0_8px_24px_rgba(49,94,85,0.08)]'
                      : 'border-[#e5eae7] bg-white hover:border-[#bfd4cc]'
                  }`}
                >
                  <span className={`mb-4 flex size-9 items-center justify-center rounded-xl ${active ? 'bg-white text-[#d1734b]' : 'bg-[#f4f8f6] text-[#d1734b]'}`}>
                    <Icon size={18} />
                  </span>
                  <span className="block text-[13px] font-bold text-[#29463f]">{label}</span>
                  <span className="mt-1 hidden text-[11px] leading-4 text-[#7d9089] sm:block">{hint}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-5 rounded-[24px] border border-[#e5eae7] bg-white p-4 shadow-[0_8px_30px_rgba(36,62,57,0.04)] sm:p-6">
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
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#2e4942]">Photos</p>
                  <p className="mt-0.5 text-[11px] text-[#7d9089]">{existingPhotos.length ? 'Existing photos stay. Add more if you have them.' : 'First photo becomes the cover.'} Up to {MAX_PHOTOS}.</p>
                </div>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={!remainingSlots}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#d7e4df] bg-white px-3 text-[11px] font-bold text-[#526861] disabled:opacity-50"
                >
                  <ImagePlus size={14} /> Add
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
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
                      <button type="button" aria-label="Remove photo" onClick={() => removeFile(index)} className="ml-auto flex size-6 items-center justify-center rounded-md bg-white/90 text-[#5f746c]">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {files.length < remainingSlots && (
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#c9dbd4] bg-white text-[#7d9089] transition hover:border-[#8bb4a7] hover:text-[#315e55]"
                  >
                    <ImagePlus size={18} />
                    <span className="text-[10px] font-bold">Photo</span>
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

            <label className="mt-5 block">
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
                className="mt-2 h-12 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 text-sm outline-none transition focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
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
                    className="h-12 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] pl-[52px] pr-3 text-sm outline-none transition focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-[#7d9089]">{Number.isFinite(amount) && amount > 0 ? formatUGX(amount) : 'Shown exactly as buyers will see it.'}</p>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-[#526861]">Location</span>
                <div className="relative mt-2">
                  <MapPin size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#91a39c]" />
                  <input
                    required
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder={copy.location}
                    className="h-12 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] pl-9 pr-3 text-sm outline-none transition focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
                  />
                </div>
              </label>
            </div>

            {type === 'Products' && (
              <div className="mt-5">
                <p className="text-xs font-bold text-[#526861]">Condition</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CONDITIONS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCondition(item.id)}
                      className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
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
                className="mt-2 w-full resize-none rounded-xl border border-[#e5eae7] bg-[#fbfcfb] p-3.5 text-sm leading-6 outline-none transition focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
              />
            </label>

            {error && <p role="alert" className="mt-4 rounded-xl bg-[#fff5f0] px-3 py-2.5 text-sm text-[#b85a38]">{error}</p>}

            <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom,0px))] z-20 mt-6 -mx-4 border-t border-[#eef3f0] bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
              <button
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
        </form>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <div className="rounded-[24px] border border-[#e5eae7] bg-white p-4 shadow-[0_8px_30px_rgba(36,62,57,0.04)]">
            <div className="mb-3 flex items-center gap-2 text-[#d1734b]">
              <Sparkles size={15} />
              <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Live preview</p>
            </div>
            <article className="overflow-hidden rounded-2xl border border-[#eef3f0]">
              <div className="relative">
                <ListingPhoto src={previews[0]?.url} listing={{ category: type, listing_media: existingPhotos }} alt={title} className="aspect-[4/3] w-full" />
                <span className="absolute left-3 top-3 z-[2] rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#52635e]">{type}</span>
              </div>
              <div className="p-3.5">
                <h3 className="truncate text-sm font-bold text-[#29463f]">{title.trim() || 'Your title'}</h3>
                <p className="mt-1 text-[13px] font-bold text-[#d1734b]">{Number.isFinite(amount) && amount > 0 ? formatUGX(amount) : 'UGX —'}</p>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8c9995]">
                  <MapPin size={12} />
                  <span className="truncate">{location.trim() || 'Campus location'}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 border-t border-[#eff2f0] pt-3">
                  <Avatar name={profile.display_name} image={profile.avatar_url} />
                  <span className="truncate text-[11px] font-medium text-[#788883]">{profile.display_name}</span>
                </div>
              </div>
            </article>
            <p className="mt-4 text-[12px] leading-5 text-[#7d9089]">This is how it appears in the marketplace. Cover photo first, then the details that close the deal.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
