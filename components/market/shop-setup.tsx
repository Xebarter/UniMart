'use client'

import { FormEvent, useMemo, useRef, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { slugifyShopName } from '@/lib/shop'
import { hasStudentNumber } from '@/lib/student-number'
import type { Shop } from '@/lib/types'

export function ShopSetup({
  shop,
  onSaved,
  onCancel,
  embedded = false,
}: {
  shop?: Shop | null
  onSaved: (shop: Shop) => void
  onCancel?: () => void
  embedded?: boolean
}) {
  const { profile, notify } = useMarket()
  const [name, setName] = useState(shop?.name || (profile ? `${profile.display_name}'s shop` : ''))
  const [bio, setBio] = useState(shop?.bio ?? '')
  const [coverUrl, setCoverUrl] = useState(shop?.cover_url ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const slug = useMemo(() => slugifyShopName(name), [name])
  const editing = Boolean(shop)

  async function onCover(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Use a JPG, PNG, or WEBP cover.')
      return
    }
    try {
      const result = await api.uploadShopCover(file)
      if (result.url) setCoverUrl(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload cover.')
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!editing && !hasStudentNumber(profile?.student_number)) {
      setError('Enter your student number first.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const result = editing
        ? await api.updateShop({ name, bio, cover_url: coverUrl, slug })
        : await api.createShop({ name, bio, cover_url: coverUrl, slug })
      onSaved(result.data)
      notify(editing ? 'Shop updated' : 'Your shop is open')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save shop.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={embedded ? 'max-w-[640px]' : 'mx-auto w-full max-w-[640px] px-4 pb-10 pt-6 sm:px-8 sm:pt-10'}>
      {!embedded && (
        <>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">{editing ? 'Edit' : 'Shop'}</p>
          <h1 className="mt-2 font-display text-[1.85rem] font-bold tracking-[-0.045em] text-[#243e39]">
            {editing ? shop?.name : 'Open a shop'}
          </h1>
        </>
      )}

      {embedded && (
        <div className="mb-4 sm:mb-5">
          <h2 className="font-display text-[1.4rem] font-bold tracking-[-0.04em] text-[#243e39] sm:text-[1.75rem]">
            {editing ? 'Edit shop' : 'Open a shop'}
          </h2>
          {!editing && (
            <p className="mt-1.5 text-[13px] leading-6 text-[#748780]">Optional. Listings stay on the marketplace until you add them here.</p>
          )}
        </div>
      )}

      <form onSubmit={submit} className={`${embedded ? 'mt-0' : 'mt-7 '}rounded-[20px] border border-[#e5eae7] bg-white p-4 sm:rounded-[24px] sm:p-6`}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="relative block w-full overflow-hidden rounded-2xl border border-dashed border-[#d5e4de] bg-[#f7fbf9]"
        >
          {coverUrl ? (
            <img src={coverUrl} alt="" referrerPolicy="no-referrer" className="aspect-[2/1] w-full object-cover sm:aspect-[16/7]" />
          ) : (
            <span className="flex aspect-[2/1] flex-col items-center justify-center gap-2 text-[#7d9089] sm:aspect-[16/7]">
              <ImagePlus size={22} />
              <span className="text-xs font-bold">Cover</span>
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void onCover(file)
            event.target.value = ''
          }}
        />

        <label className="mt-5 block text-xs font-bold text-[#526861]">
          Shop name
          <input
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 h-12 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 text-sm outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
          />
        </label>
        <p className="mt-2 text-[11px] text-[#8b9994]">unimart.app/shops/{slug || 'your-shop'}</p>
        <label className="mt-5 block text-xs font-bold text-[#526861]">
          About
          <textarea
            rows={4}
            maxLength={400}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="What you sell"
            className="mt-2 w-full resize-none rounded-xl border border-[#e5eae7] bg-[#fbfcfb] p-3.5 text-sm leading-6 outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
          />
        </label>
        {error && <p role="alert" className="mt-4 rounded-xl bg-[#fff5f0] px-3 py-2.5 text-sm text-[#b85a38]">{error}</p>}
        <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom,0px))] z-20 mt-5 -mx-4 border-t border-[#eef3f0] bg-white/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mt-6 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
          <div className="flex flex-col gap-2">
            <button disabled={busy} className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#315e55] text-sm font-bold text-white hover:bg-[#274c44] disabled:opacity-60">
              {busy ? 'Saving…' : editing ? 'Save shop' : 'Open shop'}
            </button>
            {onCancel && (
              <button type="button" onClick={onCancel} className="h-11 text-sm font-bold text-[#638076]">
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
