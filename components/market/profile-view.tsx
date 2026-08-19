'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Camera,
  CheckCircle2,
  GraduationCap,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Settings,
  Store,
  UserRound,
} from 'lucide-react'
import { Avatar } from '@/components/market/avatar'
import { ListingCard } from '@/components/market/listing-card'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { loginHref } from '@/lib/auth'
import { signOutUniMart } from '@/lib/auth-session'
import { colorFromSeed, isFeatured } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import { formatPhoneDisplay, hasContactPhone } from '@/lib/phone'
import type { FollowedProfile, Profile } from '@/lib/types'

type Tab = 'listings' | 'saved' | 'following'

const BIO_MAX = 500

function memberSince(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-UG', { month: 'long', year: 'numeric' })
}

function profileTasks(profile: Profile) {
  return [
    { id: 'photo', label: 'Add a profile photo', done: Boolean(profile.avatar_url) },
    { id: 'university', label: 'Add your university', done: Boolean(profile.university?.trim()) },
    { id: 'campus', label: 'Add your area', done: Boolean(profile.campus?.trim()) },
    { id: 'bio', label: 'Write a short bio', done: Boolean(profile.bio?.trim()) },
  ]
}

export function ProfileView() {
  const pathname = usePathname()
  const {
    profile,
    myListings,
    savedListings,
    saved,
    toggleSaved,
    requestPost,
    setProfile,
    loading,
    conversations,
    notify,
    myShop,
  } = useMarket()
  const [tab, setTab] = useState<Tab>('listings')
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState('')
  const [following, setFollowing] = useState<FollowedProfile[]>([])
  const photoRef = useRef<HTMLInputElement>(null)
  const [photoBusy, setPhotoBusy] = useState(false)

  const liveListings = useMemo(
    () => myListings.filter((item) => item.status === 'active'),
    [myListings],
  )
  const stats = useMemo(() => ({
    live: liveListings.length,
    saved: savedListings.length,
    views: myListings.reduce((sum, item) => sum + (item.view_count ?? 0), 0),
    sold: myListings.filter((item) => item.status === 'sold').length,
    featured: myListings.filter((item) => isFeatured(item)).length,
  }), [liveListings.length, myListings, savedListings.length])

  const tasks = profile ? profileTasks(profile) : []
  const completeCount = tasks.filter((item) => item.done).length
  const complete = tasks.length ? Math.round((completeCount / tasks.length) * 100) : 0

  useEffect(() => {
    if (!profile) return
    api.profile()
      .then((result) => setEmail(result.user.email ?? ''))
      .catch(() => undefined)
    api.follows()
      .then((result) => setFollowing((result.data ?? []).filter((item): item is FollowedProfile => Boolean(item))))
      .catch(() => undefined)
  }, [profile])

  async function onPickPhoto(file: File) {
    if (!file.type.startsWith('image/')) {
      notify('Use a JPG, PNG, or WEBP photo.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      notify('Keep your photo under 5MB.')
      return
    }
    setPhotoBusy(true)
    try {
      const result = await api.uploadAvatar(file)
      if (result.data) setProfile(result.data)
      notify('Profile photo updated')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update photo')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function unfollow(id: string) {
    setFollowing((current) => current.filter((item) => item.id !== id))
    try {
      await api.unfollow(id)
      notify('Unfollowed')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to unfollow')
      const result = await api.follows().catch(() => null)
      if (result?.data) setFollowing(result.data.filter((item): item is FollowedProfile => Boolean(item)))
    }
  }

  if (loading && !profile) {
    return (
      <div className="mx-auto max-w-[1040px] px-4 py-8 sm:px-8 lg:px-10">
        <div className="h-52 animate-pulse rounded-[28px] bg-[#e7eeeb]" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-[#eef3f0]" />
          ))}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-8 sm:py-16">
        <section className="relative overflow-hidden rounded-[28px] bg-[#315e55] px-6 py-14 text-center text-white sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rotate-[-18deg] rounded-[44%] border-[22px] border-[#47766b] opacity-60" />
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">Your profile</p>
          <h1 className="mt-3 font-display text-[1.85rem] font-bold tracking-[-0.04em] sm:text-4xl">Sign in to your marketplace.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#d4e4df]">Save listings, message sellers, and keep your storefront in one place.</p>
          <a href={loginHref(pathname || '/profile')} className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[#f3c8ad] px-5 text-sm font-bold text-[#315e55] hover:bg-white">
            Sign in
          </a>
        </section>
      </div>
    )
  }

  const joined = memberSince(profile.created_at)
  const phones = [profile.phone_primary, profile.phone_secondary].filter((value): value is string => hasContactPhone(value))
  const shown = tab === 'saved' ? savedListings : liveListings
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'listings', label: 'Listings', count: liveListings.length },
    { id: 'saved', label: 'Saved', count: saved.length || undefined },
    { id: 'following', label: 'Following', count: following.length || undefined },
  ]

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 pb-10 pt-5 sm:px-8 sm:pt-8 lg:px-10">
      <section className="overflow-hidden rounded-[28px] border border-[#e5eae7] bg-white shadow-[0_12px_40px_rgba(36,62,57,0.05)]">
        <div className="relative h-28 bg-[#315e55] sm:h-36">
          <div className="pointer-events-none absolute -right-8 -top-16 h-56 w-64 rotate-[-16deg] rounded-[44%] border-[22px] border-[#47766b] opacity-55" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#243e39]/25 to-transparent" />
        </div>
        <div className="px-5 pb-6 sm:px-8 sm:pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="relative -mt-12 shrink-0 sm:-mt-16">
                <span className="block rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(36,62,57,0.12)]">
                  <Avatar name={profile.display_name} color={colorFromSeed(profile.id)} image={profile.avatar_url} size="xl" />
                </span>
                <button
                  type="button"
                  aria-label="Change profile photo"
                  disabled={photoBusy}
                  onClick={() => photoRef.current?.click()}
                  className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full border border-white bg-[#315e55] text-white shadow-md hover:bg-[#274c44] disabled:opacity-60"
                >
                  <Camera size={14} />
                </button>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) void onPickPhoto(file)
                    event.target.value = ''
                  }}
                />
              </div>
              <div className="min-w-0 pb-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Your profile</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-[1.65rem] font-bold tracking-[-0.04em] text-[#243e39] sm:text-[2rem]">{profile.display_name}</h1>
                  {profile.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f2ed] px-2.5 py-1 text-[10px] font-bold text-[#4e786a]">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  )}
                </div>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#748780]">
                  <span className="inline-flex items-center gap-1.5">
                    <GraduationCap size={14} />
                    {profile.university || 'Add your university'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={14} />
                    {profile.campus || 'Add your area'}
                  </span>
                  {phones.length ? (
                    phones.map((phone) => (
                      <a key={phone} href={`tel:${phone}`} className="inline-flex items-center gap-1.5 hover:text-[#315e55]">
                        <Phone size={14} />
                        {formatPhoneDisplay(phone)}
                      </a>
                    ))
                  ) : (
                    <Link href={`${marketPaths.settings}#campus`} className="inline-flex items-center gap-1.5 hover:text-[#526861]">
                      <Phone size={14} />
                      Add a phone number
                    </Link>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEditing(true)} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#dfe7e3] bg-white px-3.5 text-xs font-bold text-[#526861] hover:bg-[#f6f9f8]">
                <Pencil size={14} /> Edit profile
              </button>
              <Link href={marketPaths.settings} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#dfe7e3] px-3.5 text-xs font-bold text-[#526861] hover:bg-[#f6f9f8]">
                <Settings size={14} /> Settings
              </Link>
              <Link href={marketPaths.shop} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#dfe7e3] px-3.5 text-xs font-bold text-[#526861] hover:bg-[#f6f9f8]">
                <Store size={14} /> {myShop ? 'Manage shop' : 'Open a shop'}
              </Link>
              <button type="button" onClick={requestPost} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#315e55] px-3.5 text-xs font-bold text-white hover:bg-[#274c44]">
                <Plus size={14} /> New listing
              </button>
            </div>
          </div>

          {profile.bio ? (
            <p className="mt-5 max-w-2xl text-sm leading-6 text-[#5f746c]">{profile.bio}</p>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="mt-5 text-sm font-medium text-[#8b9994] hover:text-[#526861]">
              Add a short bio so buyers know who they are dealing with.
            </button>
          )}

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-[#8b9994]">
            {joined && <span>Member since {joined}</span>}
            {email && <span className="truncate">{email}</span>}
            {stats.featured > 0 && <span>{stats.featured} featured listing{stats.featured === 1 ? '' : 's'}</span>}
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Live listings', value: stats.live },
          { label: 'Saved', value: stats.saved },
          { label: 'Listing views', value: stats.views },
          { label: 'Sold', value: stats.sold },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-[#e5eae7] bg-white px-4 py-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-bold text-[#29463f]">{item.value}</p>
          </div>
        ))}
      </div>

      {complete < 100 && (
        <div className="mt-5 rounded-2xl border border-[#e5eae7] bg-white p-5 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-6">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Finish your profile</p>
            <h2 className="mt-1 font-display text-lg font-bold text-[#29463f]">Buyers trust a complete profile.</h2>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eef3f0]">
              <div className="h-full rounded-full bg-[#315e55]" style={{ width: `${complete}%` }} />
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {tasks.filter((item) => !item.done).map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => (item.id === 'photo' ? photoRef.current?.click() : setEditing(true))} className="rounded-full border border-[#e5eae7] bg-[#f8fbf9] px-3 py-1.5 text-[11px] font-bold text-[#526861] hover:border-[#bfd4cc]">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-4 shrink-0 font-display text-3xl font-bold text-[#315e55] sm:mt-0">{complete}%</p>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={marketPaths.messages} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e5eae7] bg-white px-3.5 text-xs font-bold text-[#526861] hover:bg-[#f6f9f8]">
          <MessageCircle size={14} /> Messages{conversations.length ? ` (${conversations.length})` : ''}
        </Link>
        <Link href={marketPaths.shop} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#e5eae7] bg-white px-3.5 text-xs font-bold text-[#526861] hover:bg-[#f6f9f8]">
          <Store size={14} /> {myShop ? 'Manage shop' : 'Open a shop'}
        </Link>
      </div>

      <div className="mt-8 flex gap-6 border-b border-[#e5eae7]">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`border-b-2 pb-3 text-xs font-bold ${tab === item.id ? 'border-[#d1734b] text-[#29463f]' : 'border-transparent text-[#9aa7a2]'}`}
          >
            {item.label}{item.count ? ` (${item.count})` : ''}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-[#29463f]">
            {tab === 'listings' ? 'Your listings' : tab === 'saved' ? 'Saved for later' : 'People you follow'}
          </h2>
          <p className="mt-1 text-xs text-[#95a19d]">
            {tab === 'listings'
              ? myShop
                ? 'How others see you. Sold, archive, and feature live in Shop.'
                : 'Your live listings. Edit them here, or open a shop to add sold, archive, and feature.'
              : tab === 'saved'
                ? 'Listings you are keeping an eye on.'
                : 'Sellers and shops you want to keep up with.'}
          </p>
        </div>
        {tab === 'listings' && (
          <button type="button" onClick={requestPost} className="hidden items-center gap-2 rounded-xl bg-[#315e55] px-3.5 py-2.5 text-xs font-bold text-white sm:inline-flex">
            <Plus size={15} /> New listing
          </button>
        )}
        {tab === 'saved' && (
          <Link href={marketPaths.saved} className="hidden items-center gap-2 rounded-xl border border-[#e5eae7] bg-white px-3.5 py-2.5 text-xs font-bold text-[#315e55] sm:inline-flex">
            <Heart size={14} /> Open saved
          </Link>
        )}
      </div>

      {tab !== 'following' && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                saved={saved.includes(item.id)}
                toggleSaved={toggleSaved}
                hideSave={tab === 'listings'}
                hideSeller={tab === 'listings'}
                manageHref={tab === 'listings' ? marketPaths.postEdit(item.id) : undefined}
              />
            ))}
          </div>
          {!shown.length && (
            <div className="mt-6 rounded-[24px] border border-dashed border-[#d5e4de] bg-[#f7fbf9] px-6 py-12 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-[#d1734b] shadow-[0_8px_24px_rgba(49,94,85,0.08)]">
                {tab === 'saved' ? <Heart size={20} /> : <Store size={20} />}
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-[#29463f]">{tab === 'saved' ? 'Nothing saved yet.' : 'No live listings yet.'}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#748780]">
                {tab === 'saved'
                  ? 'Tap the heart on a listing to keep it here.'
                  : 'Put something up for sale. A clear photo and a fair price usually get the first message.'}
              </p>
              {tab === 'listings' && (
                <button type="button" onClick={requestPost} className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44]">
                  <Plus size={16} /> Create a listing
                </button>
              )}
              {tab === 'saved' && (
                <Link href={marketPaths.home} className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#315e55] px-5 text-sm font-bold text-white hover:bg-[#274c44]">
                  Browse listings
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'following' && (
        following.length ? (
          <ul className="mt-5 divide-y divide-[#eef3f0] overflow-hidden rounded-2xl border border-[#e5eae7] bg-white">
            {following.map((person) => (
              <li key={person.id} className="flex items-center gap-3 px-4 py-3.5">
                {person.shop ? (
                  <Link href={marketPaths.shopPublic(person.shop.slug)} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={person.display_name} color={colorFromSeed(person.id)} image={person.avatar_url} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#29463f]">{person.shop.name}</span>
                      <span className="block truncate text-[12px] text-[#8b9994]">{person.display_name}</span>
                    </span>
                  </Link>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={person.display_name} color={colorFromSeed(person.id)} image={person.avatar_url} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#29463f]">{person.display_name}</span>
                      <span className="block truncate text-[12px] text-[#8b9994]">{person.university || person.campus || 'Member'}</span>
                    </span>
                  </div>
                )}
                {person.verified && <CheckCircle2 size={16} className="shrink-0 text-[#4e786a]" />}
                <button type="button" onClick={() => { void unfollow(person.id) }} className="rounded-xl border border-[#dfe7e3] px-3 py-1.5 text-[11px] font-bold text-[#638076] hover:bg-[#f6f9f8]">
                  Unfollow
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-6 rounded-[24px] border border-dashed border-[#d5e4de] bg-[#f7fbf9] px-6 py-12 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white text-[#d1734b] shadow-[0_8px_24px_rgba(49,94,85,0.08)]">
              <UserRound size={20} />
            </span>
            <h3 className="mt-4 font-display text-xl font-bold text-[#29463f]">You are not following any shops yet.</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#748780]">Follow a shop from its page and find it here later.</p>
          </div>
        )
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#e5eae7] pt-6">
        <p className="text-xs text-[#8b9994]">
          Signed in{email ? ` as ${email}` : ''}.
          {profile.student_number?.trim() ? ` Student number ${profile.student_number.trim()}.` : ''}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={marketPaths.settings} className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe7e3] px-3.5 py-2 text-xs font-bold text-[#638076] hover:bg-[#f6f9f8]">
            <Settings size={14} /> Account settings
          </Link>
          <button type="button" onClick={() => { void signOutUniMart() }} className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe7e3] px-3.5 py-2 text-xs font-bold text-[#638076] hover:bg-[#f6f9f8]">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      {editing && (
        <EditProfile
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={(next) => {
            setProfile(next)
            setEditing(false)
            notify('Profile saved')
          }}
          onPhoto={(file) => onPickPhoto(file)}
          photoBusy={photoBusy}
        />
      )}
    </div>
  )
}

function EditProfile({
  profile,
  onClose,
  onSaved,
  onPhoto,
  photoBusy,
}: {
  profile: Profile
  onClose: () => void
  onSaved: (profile: Profile) => void
  onPhoto: (file: File) => void
  photoBusy: boolean
}) {
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [university, setUniversity] = useState(profile.university ?? '')
  const [campus, setCampus] = useState(profile.campus ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:px-4">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[#0c1c19]/45 backdrop-blur-[6px]" />
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          setBusy(true)
          setError('')
          try {
            const result = await api.updateProfile({ display_name: displayName, university, campus, bio })
            onSaved(result.data)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to save profile.')
            setBusy(false)
          }
        }}
        className="relative w-full max-w-lg overflow-hidden rounded-t-[28px] bg-white p-6 shadow-[0_-18px_80px_rgba(12,28,25,0.2)] sm:rounded-[28px] sm:p-7"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Account</p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.03em] text-[#243e39]">Edit profile</h2>
        <p className="mt-1 text-sm text-[#748780]">This is what buyers see on your listings.</p>

        <div className="mt-5 flex items-center gap-4">
          <button type="button" onClick={() => inputRef.current?.click()} className="relative shrink-0">
            <Avatar name={displayName || profile.display_name} color={colorFromSeed(profile.id)} image={profile.avatar_url} size="lg" />
            <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-white bg-[#315e55] text-white">
              <Camera size={12} />
            </span>
          </button>
          <div>
            <p className="text-sm font-bold text-[#29463f]">{photoBusy ? 'Uploading…' : 'Profile photo'}</p>
            <button type="button" onClick={() => inputRef.current?.click()} className="mt-1 text-xs font-bold text-[#315e55]">
              Upload a new photo
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onPhoto(file)
              event.target.value = ''
            }}
          />
        </div>

        <label className="mt-5 block text-xs font-bold text-[#526861]">
          Display name
          <input required maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 text-sm font-medium outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]" />
        </label>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-bold text-[#526861]">
            University
            <input value={university} onChange={(event) => setUniversity(event.target.value)} placeholder="e.g. Makerere University" className="mt-2 h-11 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 text-sm outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]" />
          </label>
          <label className="block text-xs font-bold text-[#526861]">
            Area
            <input value={campus} onChange={(event) => setCampus(event.target.value)} placeholder="e.g. Wandegeya, Kikoni" className="mt-2 h-11 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 text-sm outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]" />
          </label>
        </div>
        <label className="mt-4 block text-xs font-bold text-[#526861]">
          <span className="flex items-center justify-between">
            Bio
            <span className="font-medium text-[#9aa7a2]">{bio.length}/{BIO_MAX}</span>
          </span>
          <textarea
            maxLength={BIO_MAX}
            rows={4}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="What you sell, where to find you, and how you like to deal."
            className="mt-2 w-full resize-none rounded-xl border border-[#e5eae7] bg-[#fbfcfb] p-3.5 text-sm leading-6 outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
          />
        </label>
        {error && <p role="alert" className="mt-4 rounded-xl bg-[#fff5f0] px-3 py-2.5 text-sm text-[#b85a38]">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-xl px-4 text-xs font-bold text-[#638076]">Cancel</button>
          <button disabled={busy} className="h-10 rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white disabled:opacity-60">{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  )
}
