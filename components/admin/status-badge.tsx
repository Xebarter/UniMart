import { Badge } from '@/components/ui/badge'

const MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'muted' | 'outline' }> = {
  active: { label: 'Active', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  draft: { label: 'Draft', variant: 'muted' },
  unavailable: { label: 'Unavailable', variant: 'muted' },
  sold: { label: 'Sold', variant: 'default' },
  archived: { label: 'Archived', variant: 'muted' },
  removed: { label: 'Removed', variant: 'danger' },
  disabled: { label: 'Disabled', variant: 'danger' },
  published: { label: 'Published', variant: 'success' },
  open: { label: 'Open', variant: 'warning' },
  reviewing: { label: 'Reviewing', variant: 'default' },
  resolved: { label: 'Resolved', variant: 'success' },
  dismissed: { label: 'Dismissed', variant: 'muted' },
  paid: { label: 'Paid', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
  cancelled: { label: 'Cancelled', variant: 'muted' },
  expired: { label: 'Expired', variant: 'muted' },
  student: { label: 'Student', variant: 'muted' },
  moderator: { label: 'Moderator', variant: 'default' },
  admin: { label: 'Admin', variant: 'warning' },
  verified: { label: 'Verified', variant: 'success' },
  unverified: { label: 'Unverified', variant: 'outline' },
  suspended: { label: 'Suspended', variant: 'warning' },
  banned: { label: 'Banned', variant: 'danger' },
  closed: { label: 'Closed', variant: 'danger' },
  new: { label: 'New', variant: 'warning' },
  shortlisted: { label: 'Shortlisted', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  hired: { label: 'Hired', variant: 'success' },
  replied: { label: 'Replied', variant: 'success' },
  subscribed: { label: 'Subscribed', variant: 'success' },
  unsubscribed: { label: 'Unsubscribed', variant: 'muted' },
}

export function StatusBadge({ value }: { value?: string | null }) {
  const key = (value ?? '').toLowerCase()
  const mapped = MAP[key]
  if (!mapped) {
    return <Badge variant="outline">{value || '—'}</Badge>
  }
  return <Badge variant={mapped.variant}>{mapped.label}</Badge>
}
