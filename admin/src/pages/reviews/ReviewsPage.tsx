import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { TablePagination } from '@/components/DataTable'
import { useReviews } from './useReviews'
import type { ReviewFilters } from './useReviews'
import { ReviewsTable } from './ReviewsTable'

const DEFAULT_FILTERS: ReviewFilters = { visibility: 'all', search: '' }

export function ReviewsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<ReviewFilters>(DEFAULT_FILTERS)
  const query = useReviews(page, filters)

  function handleChange(next: ReviewFilters) {
    setFilters(next)
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('reviews.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('reviews.subtitle')}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={filters.search} onChange={e => handleChange({ ...filters, search: e.target.value })} placeholder={t('reviews.filters.searchPlaceholder')} className="ps-9" />
        </div>
        <Select value={filters.visibility} onValueChange={v => handleChange({ ...filters, visibility: v as ReviewFilters['visibility'] })}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('requests.filters.allStatuses')}</SelectItem>
            <SelectItem value="visible">{t('reviews.table.visible')}</SelectItem>
            <SelectItem value="hidden">{t('reviews.table.hidden')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ReviewsTable rows={query.data?.rows ?? []} isLoading={query.isPending} isError={query.isError} />
      <TablePagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
