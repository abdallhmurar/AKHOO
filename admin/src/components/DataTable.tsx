import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useIsRTL } from '@/lib/direction'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'

// A plain <table>-based data table, not TanStack Table - Round 1 needs
// none of its client-side sorting/filtering/grouping features (every list
// page does filtering/pagination server-side, see lib/pagination.ts), so a
// typed columns prop + shadcn's Table primitives covers this without
// pulling in a table library whose current major version's API this app
// hasn't otherwise needed to learn.
export type Column<T> = {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  isError,
  onRowClick,
  getRowId,
  skeletonRows = 6
}: {
  columns: Column<T>[]
  rows: T[]
  isLoading: boolean
  isError: boolean
  onRowClick?: (row: T) => void
  getRowId: (row: T) => string
  skeletonRows?: number
}) {
  const { t } = useTranslation()

  if (isError) return <ErrorState />

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
              <TableHead key={col.key} className={col.className}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map(col => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows.map(row => (
                <TableRow key={getRowId(row)} onClick={() => onRowClick?.(row)} className={onRowClick ? 'cursor-pointer' : undefined}>
                  {columns.map(col => (
                    <TableCell key={col.key} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>
      {!isLoading && rows.length === 0 ? <EmptyState message={t('common.noResults')} /> : null}
    </div>
  )
}

export function TablePagination({ page, pageSize, total, onPageChange }: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const PrevIcon = isRTL ? ArrowRight : ArrowLeft
  const NextIcon = isRTL ? ArrowLeft : ArrowRight

  if (total === 0) return null

  return (
    <div className="flex items-center justify-between gap-2 py-3">
      <p className="text-sm text-muted-foreground">
        {t('common.page')} {page + 1} {t('common.of')} {pageCount}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          <PrevIcon className="size-4" />
          {t('common.previous')}
        </Button>
        <Button variant="outline" size="sm" disabled={page + 1 >= pageCount} onClick={() => onPageChange(page + 1)}>
          {t('common.next')}
          <NextIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
