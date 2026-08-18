'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, ChevronDown, Loader2 } from 'lucide-react'
import { getSafeNextPath } from '@/lib/auth'
import {
  PHONE_SEND_BUTTON_ID,
  clearPhoneAuth,
  confirmPhoneCode,
  ensurePhoneVerifier,
  phoneAuthMessage,
  sendPhoneCode,
} from '@/lib/phone-auth-client'
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  isValidE164,
  maskPhone,
  nationalDigits,
  toE164,
} from '@/lib/phone'

export function PhoneAuthForm({
  onError,
  onSuccess,
  sendLabel = 'Send code',
}: {
  onError: (message: string) => void
  onSuccess?: () => void | Promise<void>
  sendLabel?: string
}) {
  const sendBtnRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const [iso, setIso] = useState<string>(DEFAULT_PHONE_COUNTRY)
  const [national, setNational] = useState('')
  const [code, setCode] = useState('')
  const [e164, setE164] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const country = PHONE_COUNTRIES.find((item) => item.iso === iso) ?? PHONE_COUNTRIES[0]

  useEffect(() => {
    inputRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldown])

  useEffect(() => {
    const button = sendBtnRef.current
    if (!button) return
    void ensurePhoneVerifier(button).catch((error) => onErrorRef.current(phoneAuthMessage(error)))
    return () => clearPhoneAuth()
  }, [])

  async function finish() {
    if (onSuccess) {
      await onSuccess()
      return
    }
    const next = getSafeNextPath(new URLSearchParams(window.location.search).get('next'))
    window.location.replace(next)
  }

  async function send(event?: FormEvent) {
    event?.preventDefault()
    const number = toE164(country.dial, national)
    if (!isValidE164(number)) {
      onError('Enter a valid mobile number.')
      inputRef.current?.focus()
      return
    }
    setLoading(true)
    onError('')
    try {
      await sendPhoneCode(number)
      setE164(number)
      setStep('code')
      setCode('')
      setCooldown(60)
    } catch (error) {
      onError(phoneAuthMessage(error))
    } finally {
      setLoading(false)
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    onError('')
    try {
      await confirmPhoneCode(code)
      await finish()
    } catch (error) {
      setLoading(false)
      onError(phoneAuthMessage(error))
    }
  }

  return (
    <div className="relative">
      <form onSubmit={(event) => void send(event)} className={step === 'phone' ? 'space-y-4' : undefined}>
        {step === 'phone' ? (
          <div>
            <label htmlFor="unimart-phone" className="text-[13px] font-bold text-[#2e4942]">
              Phone number
            </label>
            <div className="mt-1.5 flex h-12 items-stretch overflow-hidden rounded-2xl border border-[#e5eae7] bg-[#fbfcfb] focus-within:border-[#7fa59a] focus-within:ring-2 focus-within:ring-[#dcebe6]">
              <div className="relative w-[6.75rem] shrink-0">
                <select
                  aria-label="Country code"
                  value={iso}
                  disabled={loading}
                  onChange={(event) => setIso(event.target.value)}
                  className="h-full w-full cursor-pointer appearance-none bg-transparent py-0 pl-3 pr-7 text-[13px] font-bold text-[#243e39] outline-none disabled:opacity-60"
                >
                  {PHONE_COUNTRIES.map((item) => (
                    <option key={item.iso} value={item.iso}>
                      {item.iso} +{item.dial}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8b9994]" />
              </div>
              <span className="my-2.5 w-px shrink-0 bg-[#e5eae7]" />
              <input
                id="unimart-phone"
                ref={inputRef}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                autoFocus
                placeholder="0700 000000"
                disabled={loading}
                value={national}
                onChange={(event) => setNational(nationalDigits(event.target.value))}
                className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[15px] text-[#243e39] outline-none placeholder:text-[#b0bbb6] disabled:opacity-60"
              />
            </div>
            <p className="mt-2 text-[12px] leading-5 text-[#8b9994]">
              We’ll text a 6-digit code. Standard SMS rates may apply.
            </p>
          </div>
        ) : null}
        <button
          id={PHONE_SEND_BUTTON_ID}
          ref={sendBtnRef}
          type="submit"
          tabIndex={step === 'phone' ? 0 : -1}
          aria-hidden={step !== 'phone'}
          disabled={loading || nationalDigits(national).length < 7}
          className={
            step === 'phone'
              ? 'relative inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#315e55] text-sm font-bold text-white transition hover:bg-[#274c44] disabled:opacity-50'
              : 'pointer-events-none absolute left-0 top-0 h-px w-px opacity-0'
          }
        >
          <Loader2 size={16} className={`absolute animate-spin ${loading ? 'opacity-100' : 'opacity-0'}`} />
          <span className={loading ? 'opacity-0' : ''}>{loading ? 'Sending code…' : sendLabel}</span>
        </button>
      </form>
      {step === 'code' ? (
        <form onSubmit={(event) => void verify(event)} className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setStep('phone')
              setCode('')
              onError('')
            }}
            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#638076]"
          >
            <ArrowLeft size={14} />
            {maskPhone(e164)}
          </button>
          <div>
            <label htmlFor="unimart-otp" className="text-[13px] font-bold text-[#2e4942]">
              6-digit code
            </label>
            <input
              id="unimart-otp"
              ref={inputRef}
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              className="mt-1.5 h-14 w-full rounded-2xl border border-[#e5eae7] bg-[#fbfcfb] px-4 text-center text-[1.65rem] font-bold tracking-[0.4em] text-[#243e39] outline-none focus:border-[#7fa59a] focus:ring-2 focus:ring-[#dcebe6]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="relative inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#315e55] text-sm font-bold text-white transition hover:bg-[#274c44] disabled:opacity-50"
          >
            <Loader2 size={16} className={`absolute animate-spin ${loading ? 'opacity-100' : 'opacity-0'}`} />
            <span className={loading ? 'opacity-0' : ''}>Verify and continue</span>
          </button>
          <button
            type="button"
            disabled={loading || cooldown > 0}
            onClick={() => void send()}
            className="w-full text-center text-[12px] font-bold text-[#315e55] disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </form>
      ) : null}
    </div>
  )
}
