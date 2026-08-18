'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { navItems } from '@/components/market/sidebar'
import { useMarket } from '@/components/market/provider'
import { viewFromPath, type MarketView } from '@/lib/market-paths'

const SWIPE_TABS = new Set<MarketView>(['home', 'explore', 'post', 'profile'])
const MIN_SWIPE_PX = 72
const MAX_VERTICAL_RATIO = 0.75

function shouldIgnoreTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return true
  if (target.closest('[data-no-tab-swipe]')) return true
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return true
  if (document.querySelector('[role="combobox"][aria-expanded="true"]')) return true

  let el: Element | null = target
  while (el) {
    if (el instanceof HTMLElement) {
      const { overflowX } = getComputedStyle(el)
      if ((overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'overlay') && el.scrollWidth > el.clientWidth + 1) {
        return true
      }
    }
    el = el.parentElement
  }
  return false
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
}

export function MobileTabSwipe({
  children,
  disabled = false,
}: {
  children: ReactNode
  disabled?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { profile, requestPost } = useMarket()
  const touchRef = useRef<{ x: number; y: number; tracking: boolean } | null>(null)

  const view = viewFromPath(pathname)
  const enabled = !disabled && SWIPE_TABS.has(view)

  useEffect(() => {
    if (!enabled) return

    function onTouchStart(event: TouchEvent) {
      if (!isMobileViewport()) return
      const touch = event.touches[0]
      if (!touch || shouldIgnoreTarget(event.target)) {
        touchRef.current = null
        return
      }
      touchRef.current = { x: touch.clientX, y: touch.clientY, tracking: true }
    }

    function onTouchMove(event: TouchEvent) {
      const state = touchRef.current
      if (!state?.tracking) return
      const touch = event.touches[0]
      if (!touch) return
      const dx = touch.clientX - state.x
      const dy = touch.clientY - state.y
      if (Math.abs(dy) > Math.abs(dx) * (1 / MAX_VERTICAL_RATIO)) {
        state.tracking = false
      }
    }

    function onTouchEnd(event: TouchEvent) {
      const state = touchRef.current
      touchRef.current = null
      if (!state?.tracking) return
      const touch = event.changedTouches[0]
      if (!touch) return

      const dx = touch.clientX - state.x
      const dy = touch.clientY - state.y
      if (Math.abs(dx) < MIN_SWIPE_PX) return
      if (Math.abs(dy) > Math.abs(dx) * MAX_VERTICAL_RATIO) return

      const index = navItems.findIndex((item) => item.id === view)
      if (index < 0) return

      const direction = dx > 0 ? 'next' : 'prev'
      const nextIndex = direction === 'next' ? index + 1 : index - 1
      if (nextIndex < 0 || nextIndex >= navItems.length) return

      const target = navItems[nextIndex]
      if (target.intent === 'post' && !profile) {
        requestPost()
        return
      }
      router.push(target.href)
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [enabled, profile, requestPost, router, view])

  return <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
}
