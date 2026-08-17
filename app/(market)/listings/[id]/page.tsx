import type { Metadata } from 'next'
import { ListingPageClient } from '@/components/market/listing-page-client'
import {
  fetchListing,
  listingOpenGraphImageUrl,
  listingShareDescription,
  listingShareTitle,
  listingShareUrl,
} from '@/lib/listing-share'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const listing = await fetchListing(id)

  if (!listing) {
    return {
      title: 'Listing not found',
      description: 'This UniMart listing is no longer available.',
    }
  }

  const title = listingShareTitle(listing)
  const description = listingShareDescription(listing)
  const url = listingShareUrl(id)
  const ogImage = listingOpenGraphImageUrl(id)

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: listing.title,
      description,
      url,
      siteName: 'UniMart',
      type: 'website',
      locale: 'en_UG',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: listing.title,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: listing.title,
      description,
      images: [ogImage],
    },
  }
}

export default async function ListingPage({ params }: PageProps) {
  const { id } = await params
  const listing = await fetchListing(id)
  return <ListingPageClient initialListing={listing} />
}
