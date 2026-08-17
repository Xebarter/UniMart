'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { OperatorProvider } from '@/components/admin/operator-context'
import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminTopBar } from '@/components/admin/top-bar'
import type { AdminOperator } from '@/lib/types'

export function AdminShell({ operator, children }: { operator: AdminOperator; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [menuOpen])

  return (
    <OperatorProvider operator={operator}>
      <div data-admin-shell className="min-h-svh bg-[#f3f6f5] text-[#29463f]">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(49,94,85,0.06),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(209,115,75,0.05),transparent_24%)]" />
        <div className="relative flex min-h-svh">
          <AdminSidebar />
          <div className="min-w-0 flex-1">
            <AdminTopBar onOpenMenu={() => setMenuOpen(true)} />
            <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              <div className="mx-auto max-w-[1240px]">{children}</div>
            </main>
          </div>
        </div>
        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button type="button" className="absolute inset-0 bg-[#102824]/55 backdrop-blur-[4px] drawer-overlay" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
            <div className="relative h-full w-[min(320px,88vw)] drawer-panel shadow-[24px_0_80px_rgba(8,24,20,0.45)]">
              <button type="button" onClick={() => setMenuOpen(false)} className="absolute right-3 top-5 z-10 flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md">
                <X size={18} />
              </button>
              <AdminSidebar variant="mobile" onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        ) : null}
      </div>
    </OperatorProvider>
  )
}
