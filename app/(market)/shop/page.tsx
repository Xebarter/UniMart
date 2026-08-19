'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PhoneContactGate } from '@/components/market/phone-contact-gate'
import { ShopHub } from '@/components/market/shop-hub'
import { ShopSetup } from '@/components/market/shop-setup'
import { StudentNumberGate } from '@/components/market/student-number-gate'
import { useMarket } from '@/components/market/provider'
import { marketPaths } from '@/lib/market-paths'
import { hasContactPhone } from '@/lib/phone'
import { hasStudentNumber } from '@/lib/student-number'

export default function ShopPage() {
  const router = useRouter()
  const { profile, loading, requestShop, myShop, setMyShop } = useMarket()
  const [editingShop, setEditingShop] = useState(false)
  const needsStudent = Boolean(profile) && !hasStudentNumber(profile?.student_number)
  const needsPhone = Boolean(profile) && !hasContactPhone(profile?.phone_primary)
  const [studentGateOpen, setStudentGateOpen] = useState(false)
  const [phoneGateOpen, setPhoneGateOpen] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!profile) requestShop()
  }, [loading, profile, requestShop])

  useEffect(() => {
    setStudentGateOpen(needsStudent)
  }, [needsStudent])

  useEffect(() => {
    if (needsStudent) {
      setPhoneGateOpen(false)
      return
    }
    setPhoneGateOpen(needsPhone)
  }, [needsStudent, needsPhone])

  if (!profile) return null

  return (
    <div className="mx-auto w-full max-w-[1040px] px-3.5 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-8 lg:px-10">
      {editingShop || !myShop ? (
        <ShopSetup
          shop={myShop}
          embedded
          onSaved={(shop) => {
            setMyShop(shop)
            setEditingShop(false)
          }}
          onCancel={myShop ? () => setEditingShop(false) : undefined}
        />
      ) : (
        <ShopHub shop={myShop} onEditShop={() => setEditingShop(true)} onCompose={() => router.push(marketPaths.postShop)} />
      )}
      <StudentNumberGate
        open={studentGateOpen}
        onClose={() => router.push(marketPaths.home)}
        onSaved={() => setStudentGateOpen(false)}
      />
      <PhoneContactGate
        open={phoneGateOpen}
        onClose={() => router.push(marketPaths.home)}
        onSaved={() => setPhoneGateOpen(false)}
      />
    </div>
  )
}
