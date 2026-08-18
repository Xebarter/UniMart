import type { Metadata } from 'next'
import { PressView } from '@/components/market/press-view'

export const metadata: Metadata = {
  title: 'Press & Media — UniMart',
  description: 'Press contact, company boilerplate, and media guidance for UniMart, the campus marketplace nearby.',
}

export default function PressPage() {
  return <PressView />
}
