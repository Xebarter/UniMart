import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/admin/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

export type DataColumn<T> = {
  key: string
  header: string
  className?: string
  render: (row: T) => ReactNode
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  emptyTitle = 'Nothing to show yet',
  emptyDescription,
  page,
  pageSize,
  total,
  onPageChange,
  rowHref,
}: {
  columns: DataColumn<T>[]
  rows: T[]
  loading?: boolean
  emptyTitle?: string
  emptyDescription?: string
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  rowHref?: (row: T) => string
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#e2e9e5] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-[#edf1ef] bg-[#f8fbf9] text-[10px] uppercase tracking-[0.12em] text-[#8b9994]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 font-bold ${column.className ?? ''}`}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <tr key={index} className="border-b border-[#f3f6f4]">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              ))
            ) : rows.map((row) => {
              const href = rowHref?.(row)
              return (
                <tr key={row.id} className="border-b border-[#f3f6f4] text-[#526861] last:border-0 hover:bg-[#f8fbf9]">
                  {columns.map((column, columnIndex) => (
                    <td key={column.key} className={`px-4 py-3 ${column.className ?? ''}`}>
                      {href && columnIndex === 0 ? (
                        <Link href={href} className="font-semibold text-[#315e55] hover:underline">{column.render(row)}</Link>
                      ) : column.render(row)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!loading && !rows.length ? <EmptyState title={emptyTitle} description={emptyDescription} /> : null}
      <div className="flex items-center justify-between border-t border-[#edf1ef] px-4 py-3 text-xs text-[#8b9994]">
        <p>Showing {from}–{to} of {total.toLocaleString()}</p>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-[#dfe7e3] p-1.5 disabled:opacity-40">
            <ChevronLeft size={14} />
          </button>
          <span className="font-bold text-[#526861]">{page} / {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-[#dfe7e3] p-1.5 disabled:opacity-40">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
