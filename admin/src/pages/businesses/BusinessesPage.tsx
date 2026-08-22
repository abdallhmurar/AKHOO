import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { TablePagination } from '@/components/DataTable'
import { useBusinesses } from './useBusinesses'
import type { BusinessFilters } from './useBusinesses'
import { BusinessesFiltersBar } from './BusinessesFilters'
import { BusinessesTable } from './BusinessesTable'

const DEFAULT_FILTERS: BusinessFilters = { category: 'all', active: 'all', search: '' }

export function BusinessesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<BusinessFilters>(DEFAULT_FILTERS)
  const query = useBusinesses(page, filters)

  function handleFiltersChange(next: BusinessFilters) {
    setFilters(next)
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{t('businesses.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('businesses.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/businesses/new')}>
          <Plus className="size-4" />
          {t('businesses.create')}
        </Button>
      </div>
      <BusinessesFiltersBar filters={filters} onChange={handleFiltersChange} />
      <BusinessesTable rows={query.data?.rows ?? []} isLoading={query.isPending} isError={query.isError} />
      <TablePagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
