import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { TablePagination } from '@/components/DataTable'
import { useRequests } from './useRequests'
import type { RequestFilters } from './useRequests'
import { RequestsFiltersBar } from './RequestsFilters'
import { RequestsTable } from './RequestsTable'

const DEFAULT_FILTERS: RequestFilters = { status: 'all', serviceType: 'all', search: '' }

export function RequestsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<RequestFilters>(DEFAULT_FILTERS)
  const query = useRequests(page, filters)

  function handleFiltersChange(next: RequestFilters) {
    setFilters(next)
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('requests.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('requests.subtitle')}</p>
      </div>
      <RequestsFiltersBar filters={filters} onChange={handleFiltersChange} />
      <RequestsTable rows={query.data?.rows ?? []} isLoading={query.isPending} isError={query.isError} />
      <TablePagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
