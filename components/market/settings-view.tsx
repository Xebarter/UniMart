'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  Camera,
  CheckCircle2,
  GraduationCap,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Shield,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { Avatar } from '@/components/market/avatar'
import { useMarket } from '@/components/market/provider'
import { PasswordInput } from '@/components/password-input'
import { api } from '@/lib/api-client'
import { loginHref } from '@/lib/auth'
import { signOutUniMart } from '@/lib/auth-session'
import { colorFromSeed, timeAgo } from '@/lib/format'
import { marketPaths } from '@/lib/market-paths'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

const BIO_MAX = 500
const PREFS_KEY = 'unimart_notification_prefs'
const PASSWORD_CLASS = 'h-11 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 pr-11 text-sm outline-none focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]'

type Section = 'account' | 'campus' | 'notifications' | 'privacy' | 'security'

type NotificationPrefs = {
  messages: boolean
  listings: boolean
  magazine: boolean
  emailDigest: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  messages: true,
  listings: true,
  magazine: true,
  emailDigest: false,
}

const NAV: { id: Section; label: string; hint: string; icon: typeof UserRound }[] = [
  { id: 'account', label: 'Account', hint: 'Photo, name, and bio', icon: UserRound },
  { id: 'campus', label: 'Campus', hint: 'University and location', icon: GraduationCap },
  { id: 'notifications', label: 'Notifications', hint: 'Messages and alerts', icon: Bell },
  { id: 'privacy', label: 'Privacy', hint: 'How campus sees you', icon: Shield },
  { id: 'security', label: 'Security', hint: 'Password and sessions', icon: Lock },
]

function loadPrefs(): NotificationPrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PREFS
  }
}

function savePrefs(prefs: NotificationPrefs) {
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

export function SettingsView() {
  const pathname = usePathname()
  const { profile, setProfile, loading, notify, notifications, markNotificationsRead, unreadNotes } = useMarket()
  const [section, setSection] = useState<Section>('account')
  const [email, setEmail] = useState('')
  const [providers, setProviders] = useState<string[]>([])

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as Section
    if (NAV.some((item) => item.id === hash)) setSection(hash)
  }, [])

  useEffect(() => {
    if (!profile) return
    api.profile()
      .then((result) => {
        setEmail(result.user.email ?? '')
        setProviders(result.user.providers ?? [])
      })
      .catch(() => undefined)
  }, [profile])

  function go(id: Section) {
    setSection(id)
    window.history.replaceState(null, '', `#${id}`)
  }

  if (loading && !profile) {
    return (
      <div className="mx-auto max-w-[1040px] px-4 py-8 sm:px-8 lg:px-10">
        <div className="h-28 animate-pulse rounded-[28px] bg-[#e7eeeb]" />
        <div className="mt-6 grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="h-64 animate-pulse rounded-2xl bg-[#eef3f0]" />
          <div className="h-80 animate-pulse rounded-[28px] bg-[#eef3f0]" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-10 sm:px-8 sm:py-16">
        <section className="relative overflow-hidden rounded-[28px] bg-[#315e55] px-6 py-14 text-center text-white sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rotate-[-18deg] rounded-[44%] border-[22px] border-[#47766b] opacity-60" />
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c7ddd6]">Settings</p>
          <h1 className="mt-3 font-display text-[1.85rem] font-bold tracking-[-0.04em] sm:text-4xl">Sign in to manage your account.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#d4e4df]">Update your campus profile, notification preferences, and security from one place.</p>
          <a href={loginHref(pathname || '/settings')} className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-[#f3c8ad] px-5 text-sm font-bold text-[#315e55] hover:bg-white">
            Sign in
          </a>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 pb-12 pt-5 sm:px-8 sm:pt-8 lg:px-10">
      <header className="relative overflow-hidden rounded-[28px] border border-[#e5eae7] bg-white px-5 py-6 shadow-[0_12px_40px_rgba(36,62,57,0.05)] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-8 -top-20 h-52 w-52 rounded-full border-[22px] border-[#eef4f1]" />
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Your space</p>
        <h1 className="mt-1 font-display text-[1.85rem] font-bold tracking-[-0.04em] text-[#243e39] sm:text-[2.15rem]">Settings</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#748780]">A quieter place to keep your UniMart account accurate, private, and ready for campus.</p>
      </header>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = section === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={`flex min-w-[168px] items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition lg:min-w-0 ${
                  active
                    ? 'border-[#315e55]/15 bg-white shadow-[0_8px_24px_rgba(36,62,57,0.06)]'
                    : 'border-transparent bg-transparent hover:bg-white/80'
                }`}
              >
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-[#315e55] text-white' : 'bg-[#eef4f1] text-[#638076]'}`}>
                  <Icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-bold ${active ? 'text-[#243e39]' : 'text-[#526861]'}`}>{item.label}</span>
                  <span className="hidden truncate text-[11px] text-[#8b9994] lg:block">{item.hint}</span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="min-w-0 space-y-5">
          {section === 'account' && <AccountSection profile={profile} email={email} setProfile={setProfile} notify={notify} />}
          {section === 'campus' && <CampusSection profile={profile} setProfile={setProfile} notify={notify} />}
          {section === 'notifications' && (
            <NotificationsSection
              notifications={notifications}
              unreadNotes={unreadNotes}
              markAllRead={markNotificationsRead}
              notify={notify}
            />
          )}
          {section === 'privacy' && <PrivacySection profile={profile} email={email} />}
          {section === 'security' && <SecuritySection email={email} providers={providers} notify={notify} />}
        </div>
      </div>
    </div>
  )
}

function Card({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#e5eae7] bg-white shadow-[0_10px_30px_rgba(36,62,57,0.04)]">
      <div className="border-b border-[#eef3f0] px-5 py-5 sm:px-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">{eyebrow}</p>
        <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.03em] text-[#243e39]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#748780]">{description}</p>
      </div>
      <div className="px-5 py-5 sm:px-7 sm:py-6">{children}</div>
      {footer && <div className="border-t border-[#eef3f0] bg-[#f8fbf9] px-5 py-4 sm:px-7">{footer}</div>}
    </section>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold text-[#526861]">
      <span className="flex items-center justify-between gap-3">
        {label}
        {hint && <span className="font-medium text-[#9aa7a2]">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

const inputClass = 'mt-2 h-11 w-full rounded-xl border border-[#e5eae7] bg-[#fbfcfb] px-3.5 text-sm font-medium text-[#243e39] outline-none placeholder:font-normal placeholder:text-[#a8b2ae] focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]'

function AccountSection({
  profile,
  email,
  setProfile,
  notify,
}: {
  profile: Profile
  email: string
  setProfile: (profile: Profile | null) => void
  notify: (message: string) => void
}) {
  const photoRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState(profile.display_name)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [busy, setBusy] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDisplayName(profile.display_name)
    setBio(profile.bio ?? '')
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

  return (
    <div className="space-y-5">
    <Card
      eyebrow="Identity"
      title="Account"
      description="This is the name and photo buyers see on your listings and messages."
      footer={(
        <div className="flex flex-wrap items-center justify-between gap-3">
          {error ? <p role="alert" className="text-sm text-[#b85a38]">{error}</p> : <p className="text-xs text-[#8b9994]">Changes apply across UniMart immediately.</p>}
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError('')
              try {
                const result = await api.updateProfile({
                  display_name: displayName,
                  university: profile.university,
                  campus: profile.campus,
                  bio,
                })
                setProfile(result.data)
                notify('Account saved')
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to save account.')
              } finally {
                setBusy(false)
              }
            }}
            className="h-10 rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white hover:bg-[#274c44] disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Save account'}
          </button>
        </div>
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <button type="button" onClick={() => photoRef.current?.click()} className="relative w-fit shrink-0">
          <span className="block rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(36,62,57,0.1)]">
            <Avatar name={displayName || profile.display_name} color={colorFromSeed(profile.id)} image={profile.avatar_url} size="xl" />
          </span>
          <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full border border-white bg-[#315e55] text-white shadow-md">
            <Camera size={14} />
          </span>
        </button>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#29463f]">{photoBusy ? 'Uploading…' : 'Profile photo'}</p>
          <p className="mt-1 text-sm leading-6 text-[#748780]">A clear face photo helps campus trust you. JPG, PNG, or WEBP, under 5MB.</p>
          <button type="button" onClick={() => photoRef.current?.click()} className="mt-2 text-xs font-bold text-[#315e55]">
            Upload a new photo
          </button>
        </div>
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

      <div className="mt-6 grid gap-4">
        <Field label="Display name">
          <input required maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={inputClass} />
        </Field>
        <Field label="Bio" hint={`${bio.length}/${BIO_MAX}`}>
          <textarea
            maxLength={BIO_MAX}
            rows={4}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="What you sell, where to find you, and how you like to deal."
            className="mt-2 w-full resize-none rounded-xl border border-[#e5eae7] bg-[#fbfcfb] p-3.5 text-sm font-medium leading-6 text-[#243e39] outline-none placeholder:font-normal placeholder:text-[#a8b2ae] focus:border-[#86aa9e] focus:ring-2 focus:ring-[#dcebe6]"
          />
        </Field>
        <div className="grid gap-3 rounded-2xl border border-[#eef3f0] bg-[#f8fbf9] p-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">Email</p>
            <p className="mt-1 truncate text-sm font-semibold text-[#29463f]">{email || 'Not available'}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">Account type</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold capitalize text-[#29463f]">
              {profile.verified && <CheckCircle2 size={14} className="text-[#4e786a]" />}
              {profile.verified ? 'Student · verified' : 'Student'}
            </p>
          </div>
        </div>
      </div>
    </Card>
    </div>
  )
}

function CampusSection({
  profile,
  setProfile,
  notify,
}: {
  profile: Profile
  setProfile: (profile: Profile | null) => void
  notify: (message: string) => void
}) {
  const [university, setUniversity] = useState(profile.university ?? '')
  const [campus, setCampus] = useState(profile.campus ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setUniversity(profile.university ?? '')
    setCampus(profile.campus ?? '')
  }, [profile])

  return (
    <Card
      eyebrow="Location"
      title="Campus"
      description="Helps buyers know where you are, and fills the location chip in the top bar."
      footer={(
        <div className="flex flex-wrap items-center justify-between gap-3">
          {error ? <p role="alert" className="text-sm text-[#b85a38]">{error}</p> : <p className="text-xs text-[#8b9994]">Use the name students actually search for.</p>}
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setError('')
              try {
                const result = await api.updateProfile({
                  display_name: profile.display_name,
                  university,
                  campus,
                  bio: profile.bio,
                })
                setProfile(result.data)
                notify('Campus details saved')
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Unable to save campus details.')
              } finally {
                setBusy(false)
              }
            }}
            className="h-10 rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white hover:bg-[#274c44] disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Save campus'}
          </button>
        </div>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="University">
          <input value={university} onChange={(event) => setUniversity(event.target.value)} placeholder="e.g. Makerere University" className={inputClass} />
        </Field>
        <Field label="Campus or area">
          <input value={campus} onChange={(event) => setCampus(event.target.value)} placeholder="e.g. Main campus, Wandegeya" className={inputClass} />
        </Field>
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#eef3f0] bg-[#f8fbf9] p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#d1734b]"><MapPin size={16} /></span>
        <p className="text-sm leading-6 text-[#5f746c]">Listings still have their own location. This is your home campus — the place UniMart assumes unless you say otherwise.</p>
      </div>
    </Card>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  hint: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#29463f]">{label}</p>
        <p className="mt-1 text-sm leading-6 text-[#748780]">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-[#315e55]' : 'bg-[#d5e0db]'}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

function NotificationsSection({
  notifications,
  unreadNotes,
  markAllRead,
  notify,
}: {
  notifications: { id: string; title: string; body: string; created_at: string; read_at: string | null }[]
  unreadNotes: number
  markAllRead: () => Promise<void>
  notify: (message: string) => void
}) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)

  useEffect(() => {
    setPrefs(loadPrefs())
  }, [])

  function update(next: NotificationPrefs) {
    setPrefs(next)
    savePrefs(next)
    notify('Notification preferences saved')
  }

  const recent = notifications.slice(0, 6)

  return (
    <div className="space-y-5">
      <Card eyebrow="Alerts" title="Notifications" description="Choose what UniMart should surface while you are on campus and in the app.">
        <div className="divide-y divide-[#eef3f0]">
          <Toggle
            checked={prefs.messages}
            onChange={(value) => update({ ...prefs, messages: value })}
            label="Messages"
            hint="New chats and replies from buyers or sellers."
          />
          <Toggle
            checked={prefs.listings}
            onChange={(value) => update({ ...prefs, listings: value })}
            label="Listing activity"
            hint="When something you saved or posted needs attention."
          />
          <Toggle
            checked={prefs.magazine}
            onChange={(value) => update({ ...prefs, magazine: value })}
            label="Campus magazine"
            hint="Stories and community notes from Explore."
          />
          <Toggle
            checked={prefs.emailDigest}
            onChange={(value) => update({ ...prefs, emailDigest: value })}
            label="Email digest"
            hint="A short weekly summary. In-app alerts still work without it."
          />
        </div>
      </Card>

      <Card
        eyebrow="Inbox"
        title="Recent alerts"
        description={unreadNotes ? `${unreadNotes} unread in your account.` : 'You are caught up.'}
        footer={(
          <div className="flex justify-end">
            <button
              type="button"
              onClick={async () => {
                await markAllRead()
                notify('Notifications marked as read')
              }}
              className="h-10 rounded-xl border border-[#dfe7e3] bg-white px-4 text-xs font-bold text-[#638076] hover:bg-[#f6f9f8]"
            >
              Mark all as read
            </button>
          </div>
        )}
      >
        {recent.length ? (
          <ul className="divide-y divide-[#eef3f0]">
            {recent.map((item) => (
              <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`mt-1 size-2 shrink-0 rounded-full ${item.read_at ? 'bg-[#d5e0db]' : 'bg-[#d1734b]'}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#29463f]">{item.title}</p>
                  <p className="mt-0.5 truncate text-[13px] text-[#748780]">{item.body}</p>
                </div>
                <span className="shrink-0 text-[11px] text-[#9aa7a2]">{timeAgo(item.created_at)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d5e4de] bg-[#f8fbf9] px-4 py-8 text-center">
            <Bell className="mx-auto text-[#d1734b]" size={20} />
            <p className="mt-3 text-sm font-bold text-[#29463f]">No alerts yet.</p>
            <p className="mt-1 text-sm text-[#748780]">Messages and listing updates will land here.</p>
          </div>
        )}
      </Card>
    </div>
  )
}

function PrivacySection({ profile, email }: { profile: Profile; email: string }) {
  return (
    <Card eyebrow="Visibility" title="Privacy" description="UniMart is a campus marketplace. People you deal with should be able to trust who you are.">
      <ul className="space-y-3">
        <PrivacyRow
          icon={<UserRound size={16} />}
          title="Public profile"
          body="Your name, photo, university, campus, and bio appear on listings you post."
          value="Visible"
        />
        <PrivacyRow
          icon={<Mail size={16} />}
          title="Email address"
          body={email ? `${email} stays private and is only used to sign you in.` : 'Your email stays private on UniMart.'}
          value="Private"
        />
        <PrivacyRow
          icon={<MessageCircle size={16} />}
          title="Messages"
          body="Only people on UniMart can message you about a listing or shop."
          value="Members"
        />
        <PrivacyRow
          icon={<ShieldCheck size={16} />}
          title="Verification"
          body={profile.verified ? 'Your student badge is shown on your profile and listings.' : 'Ask an admin if you need a verified student badge.'}
          value={profile.verified ? 'Verified' : 'Standard'}
        />
      </ul>
      <p className="mt-6 text-sm leading-6 text-[#748780]">
        Need to hide a listing instead? Manage it from{' '}
        <Link href={marketPaths.shop} className="font-bold text-[#315e55]">Shop</Link>
        , or update what campus sees on your{' '}
        <Link href={marketPaths.profile} className="font-bold text-[#315e55]">profile</Link>.
      </p>
    </Card>
  )
}

function PrivacyRow({ icon, title, body, value }: { icon: React.ReactNode; title: string; body: string; value: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-[#eef3f0] bg-[#f8fbf9] p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#315e55]">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-[#29463f]">{title}</p>
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#638076]">{value}</span>
        </div>
        <p className="mt-1 text-sm leading-6 text-[#748780]">{body}</p>
      </div>
    </li>
  )
}

function SecuritySection({
  email,
  providers,
  notify,
}: {
  email: string
  providers: string[]
  notify: (message: string) => void
}) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState<'local' | 'global' | ''>('')
  const google = providers.some((item) => item.includes('google') || item.includes('firebase'))
  const hasPassword = providers.some((item) => item === 'email') || !google

  async function updatePassword() {
    setError('')
    if (password.length < 8) {
      setError('Use at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('The passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      setPassword('')
      setConfirm('')
      notify('Password updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Card eyebrow="Access" title="Security" description="Keep this account only in your hands. A strong password still helps, even if you use Google.">
        <div className="rounded-2xl border border-[#eef3f0] bg-[#f8fbf9] p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8b9994]">Signed in as</p>
          <p className="mt-1 text-sm font-semibold text-[#29463f]">{email || 'Your UniMart account'}</p>
          <p className="mt-1 text-sm text-[#748780]">
            {google && hasPassword ? 'Google and email password' : google ? 'Google' : 'Email and password'}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label={hasPassword ? 'New password' : 'Set a password'}>
            <PasswordInput value={password} onChange={setPassword} minLength={8} autoComplete="new-password" className={`mt-2 ${PASSWORD_CLASS}`} />
          </Field>
          <Field label="Confirm password">
            <PasswordInput value={confirm} onChange={setConfirm} minLength={8} autoComplete="new-password" className={`mt-2 ${PASSWORD_CLASS}`} />
          </Field>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-[#fff5f0] px-3 py-2.5 text-sm text-[#b85a38]">{error}</p>}
        <div className="mt-5 flex justify-end">
          <button type="button" disabled={busy} onClick={() => { void updatePassword() }} className="h-10 rounded-xl bg-[#315e55] px-4 text-xs font-bold text-white hover:bg-[#274c44] disabled:opacity-60">
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </Card>

      <section className="overflow-hidden rounded-[28px] border border-[#f0d9cf] bg-white shadow-[0_10px_30px_rgba(36,62,57,0.04)]">
        <div className="px-5 py-5 sm:px-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#d1734b]">Session</p>
          <h2 className="mt-1 font-display text-xl font-bold tracking-[-0.03em] text-[#243e39]">Sign out</h2>
          <p className="mt-1 text-sm leading-6 text-[#748780]">Use this if you are on a shared computer, or if you want every device to forget this login.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={Boolean(signingOut)}
              onClick={() => {
                setSigningOut('local')
                void signOutUniMart('local')
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[#dfe7e3] px-4 text-xs font-bold text-[#638076] hover:bg-[#f6f9f8] disabled:opacity-60"
            >
              <LogOut size={14} /> {signingOut === 'local' ? 'Signing out…' : 'Sign out'}
            </button>
            <button
              type="button"
              disabled={Boolean(signingOut)}
              onClick={() => {
                setSigningOut('global')
                void signOutUniMart('global')
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#fff5f0] px-4 text-xs font-bold text-[#b85a38] hover:bg-[#ffece4] disabled:opacity-60"
            >
              {signingOut === 'global' ? 'Signing out…' : 'Sign out everywhere'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
