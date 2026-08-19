'use client'

import { ChevronDown } from 'lucide-react'
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, nationalDigits } from '@/lib/phone'

export function ContactPhoneInput({
  id,
  iso,
  national,
  onIsoChange,
  onNationalChange,
  autoFocus,
}: {
  id: string
  iso: string
  national: string
  onIsoChange: (iso: string) => void
  onNationalChange: (national: string) => void
  autoFocus?: boolean
}) {
  return (
    <div className="flex h-12 items-stretch overflow-hidden rounded-xl border border-[#e4e9e6] bg-[#fbfcfb] focus-within:border-[#7fa59a] focus-within:ring-2 focus-within:ring-[#dcebe6]">
      <div className="relative w-[6.75rem] shrink-0">
        <select
          aria-label="Country code"
          value={iso || DEFAULT_PHONE_COUNTRY}
          onChange={(event) => onIsoChange(event.target.value)}
          className="h-full w-full cursor-pointer appearance-none bg-transparent py-0 pl-3 pr-7 text-[13px] font-bold text-[#243e39] outline-none"
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
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        autoFocus={autoFocus}
        placeholder="0700 000000"
        value={national}
        onChange={(event) => onNationalChange(nationalDigits(event.target.value))}
        className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[15px] text-[#243e39] outline-none placeholder:text-[#b0bbb6]"
      />
    </div>
  )
}
