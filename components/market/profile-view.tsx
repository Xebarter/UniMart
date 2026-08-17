'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { CheckCircle2, Plus } from 'lucide-react'
import { Avatar } from '@/components/market/avatar'
import { ListingCard } from '@/components/market/listing-card'
import { useMarket } from '@/components/market/provider'
import { api } from '@/lib/api-client'
import { loginHref } from '@/lib/auth'
import { signOutUniMart } from '@/lib/auth-session'
import { colorFromSeed } from '@/lib/format'
import type { Profile } from '@/lib/types'

export function ProfileView() {
  const pathname = usePathname()
  const { profile, myListings, savedListings, saved, toggleSaved, requestPost, setProfile } = useMarket()
  const [tab, setTab] = useState('Listings')
  const [editing, setEditing] = useState(false)
  const shown = tab === 'Saved' ? savedListings : myListings

  if (!profile) {
    return (
      <div className="mx-auto max-w-[620px] px-5 py-20 text-center">
        <h1 className="font-display text-3xl font-bold text-[#29463f]">Sign in to your campus market</h1>
        <p className="mt-3 text-sm text-[#81908b]">Save listings, message sellers, and post your own items.</p>
        <a href={loginHref(pathname || '/profile')} className="mt-6 inline-flex rounded-xl bg-[#315e55] px-4 py-2.5 text-xs font-bold text-white">Sign in</a>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[980px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="rounded-2xl border border-[#e5eae7] bg-white p-6 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={profile.display_name} color={colorFromSeed(profile.id)} image={profile.avatar_url} />
          <div>
            <h1 className="font-display text-xl font-bold text-[#29463f]">{profile.display_name}</h1>
            <p className="mt-1 text-xs text-[#8b9994]">{profile.university || 'University'}{profile.campus ? ` · ${profile.campus}` : ''}</p>
            {profile.verified && <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-[#e7f2ed] px-2 py-1 text-[10px] font-bold text-[#4e786a]"><CheckCircle2 size={12} /> Verified student</span>}
          </div>
        </div>
        <div className="mt-5 flex gap-2 sm:mt-0">
          <button onClick={() => setEditing(true)} className="rounded-xl border border-[#dfe7e3] px-4 py-2.5 text-xs font-bold text-[#638076]">Edit profile</button>
          <button onClick={() => { void signOutUniMart() }} className="rounded-xl border border-[#dfe7e3] px-4 py-2.5 text-xs font-bold text-[#638076]">Sign out</button>
        </div>
      </div>
      <div className="mt-7 flex gap-6 border-b border-[#e5eae7]">
        {['Listings', 'Saved'].map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`border-b-2 pb-3 text-xs font-bold ${tab === item ? 'border-[#d1734b] text-[#29463f]' : 'border-transparent text-[#9aa7a2]'}`}>{item}{item === 'Saved' && saved.length > 0 ? ` (${saved.length})` : ''}</button>
        ))}
      </div>
      <div className="mt-7 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-[#29463f]">{tab}</h2>
          <p className="mt-1 text-xs text-[#95a19d]">{tab === 'Listings' ? 'Your active listings and storefront.' : 'Items you are keeping an eye on.'}</p>
        </div>
        <button onClick={requestPost} className="flex items-center gap-2 rounded-xl bg-[#315e55] px-3.5 py-2.5 text-xs font-bold text-white"><Plus size={15} /> New listing</button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {shown.map((item) => (
          <ListingCard key={item.id} item={item} saved={saved.includes(item.id)} toggleSaved={toggleSaved} />
        ))}
      </div>
      {!shown.length && <p className="mt-6 text-sm text-[#81908b]">Nothing here yet.</p>}
      {editing && <EditProfile profile={profile} onClose={() => setEditing(false)} onSaved={(next) => { setProfile(next); setEditing(false) }} />}
    </div>
  )
}

function EditProfile({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: (profile: Profile) => void }) {
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [university, setUniversity] = useState(profile.university ?? '')
  const [campus, setCampus] = useState(profile.campus ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [busy, setBusy] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#243e39]/40 px-4">
      <form
        onSubmit={async (event) => {
          event.preventDefault()
          setBusy(true)
          const result = await api.updateProfile({ display_name: displayName, university, campus, bio })
          onSaved(result.data)
          setBusy(false)
        }}
        className="w-full max-w-md rounded-2xl bg-white p-6"
      >
        <h2 className="font-display text-xl font-bold">Edit profile</h2>
        <label className="mt-4 block text-xs font-bold">Name<input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#e5eae7] px-3" /></label>
        <label className="mt-4 block text-xs font-bold">University<input value={university} onChange={(event) => setUniversity(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#e5eae7] px-3" /></label>
        <label className="mt-4 block text-xs font-bold">Campus<input value={campus} onChange={(event) => setCampus(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#e5eae7] px-3" /></label>
        <label className="mt-4 block text-xs font-bold">Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-[#e5eae7] p-3" /></label>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-xs font-bold text-[#638076]">Cancel</button>
          <button disabled={busy} className="rounded-xl bg-[#315e55] px-4 py-2 text-xs font-bold text-white">{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </div>
  )
}
