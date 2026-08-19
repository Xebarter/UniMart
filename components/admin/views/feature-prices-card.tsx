'use client'

import { useEffect, useState } from 'react'
import { CreditCard, Smartphone } from 'lucide-react'
import { useOperator } from '@/components/admin/operator-context'
import { AdminButton } from '@/components/admin/filter-bar'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api-client'
import { formatUGX } from '@/lib/format'
import { LISTING_CATEGORIES, type FeaturePriceMap, type ListingCategory } from '@/lib/types'

const emptyAmounts = (): FeaturePriceMap => ({
  Products: 15000,
  Services: 15000,
  Rentals: 15000,
  Gigs: 15000,
})

export function FeaturePricesCard() {
  const operator = useOperator()
  const [amounts, setAmounts] = useState<FeaturePriceMap>(emptyAmounts())
  const [durationDays, setDurationDays] = useState(7)
  const [canEdit, setCanEdit] = useState(operator.canManageRoles)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  useEffect(() => {
    let cancelled = false
    api.adminFeaturePrices()
      .then((result) => {
        if (cancelled) return
        setAmounts(result.amounts)
        setDurationDays(result.duration_days)
        setCanEdit(result.can_edit)
        setError(result.missing ? 'Run scripts/021_feature-prices.sql in Supabase to persist these amounts.' : '')
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load feature prices.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  function setAmount(category: ListingCategory, value: string) {
    const digits = value.replace(/[^\d]/g, '')
    setSaved('')
    setAmounts((current) => ({ ...current, [category]: digits ? Number(digits) : 0 }))
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaved('')
    try {
      const result = await api.updateFeaturePrices(amounts)
      setAmounts(result.amounts)
      setDurationDays(result.duration_days)
      setSaved('Feature prices saved. The next checkout uses these amounts.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save feature prices.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-[24px] border border-[#e5eae7] bg-white p-5 shadow-[0_10px_32px_rgba(36,62,57,0.04)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d1734b]">Feature prices</p>
          <h2 className="mt-1 font-display text-lg font-bold tracking-[-0.03em] text-[#243e39]">Listing boosts by type</h2>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-[#71827b]">
            Amount charged to feature a listing for {durationDays} days. Mobile money is collected with Paytota; cards with DPO. Changes apply to the next checkout.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5eae7] bg-[#f8fbf9] px-2.5 py-1 text-[11px] font-bold text-[#526861]">
            <Smartphone size={12} className="text-[#d1734b]" /> Paytota
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5eae7] bg-[#f8fbf9] px-2.5 py-1 text-[11px] font-bold text-[#526861]">
            <CreditCard size={12} className="text-[#d1734b]" /> DPO
          </span>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {LISTING_CATEGORIES.map((category) => (
            <Skeleton key={category} className="h-[88px] rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {LISTING_CATEGORIES.map((category) => (
            <label key={category} className="rounded-2xl border border-[#e5eae7] bg-[#f8fbf9] px-3.5 py-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b9994]">{category}</span>
              <span className="mt-2 flex items-center gap-2">
                <span className="text-xs font-bold text-[#638076]">UGX</span>
                <Input
                  type="text"
                  inputMode="numeric"
                  disabled={!canEdit}
                  value={amounts[category] ? String(amounts[category]) : ''}
                  onChange={(event) => setAmount(category, event.target.value)}
                  className="h-10 bg-white font-display text-base font-bold tracking-[-0.03em]"
                  aria-label={`${category} feature price in UGX`}
                />
              </span>
              <span className="mt-1.5 block text-[11px] text-[#8b9994]">{formatUGX(amounts[category] || 0)}</span>
            </label>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {!canEdit ? (
          <p className="text-[11px] font-medium text-[#8b9994]">Only full admins can change feature prices.</p>
        ) : (
          <p className="text-[11px] font-medium text-[#8b9994]">{saved || 'Amounts are in UGX and must be greater than 0.'}</p>
        )}
        {canEdit ? (
          <AdminButton onClick={() => { void save() }} variant="primary" disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save prices'}
          </AdminButton>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-[#9a4f32]">{error}</p> : null}
    </div>
  )
}
