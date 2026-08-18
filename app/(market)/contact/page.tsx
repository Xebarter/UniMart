import type { Metadata } from 'next'
import { ContactView } from '@/components/market/contact-view'

export const metadata: Metadata = {
  title: 'Contact — UniMart',
  description: 'Reach UniMart for support, safety, press, legal, and partnership questions.',
}

export default function ContactPage() {
  return <ContactView />
}
