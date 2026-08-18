import type { Metadata } from 'next'
import { CareersView } from '@/components/market/careers-view'

export const metadata: Metadata = {
  title: 'Careers — UniMart',
  description: 'Open roles at UniMart. Help build a local marketplace for people nearby.',
}

export default function CareersPage() {
  return <CareersView />
}
