import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { TablePagination } from '@/components/DataTable'
import { useOffers } from './useOffers'
import type { OfferFilters } from './useOffers'
import { OffersFiltersBar } from './OffersFilters'
import { OffersTable } from './OffersTable'

const DEFAULT_FILTERS: OfferFilters = { status: 'all', businessId: 'all', search: '' }

export function OffersPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<OfferFilters>(DEFAULT_FILTERS)
  const query = useOffers(page, filters)

  function handleFiltersChange(next: OfferFilters) {
    setFilters(next)
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{t('offers.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('offers.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/offers/new')}>
          <Plus className="size-4" />
          {t('offers.create')}
        </Button>
      </div>
      <OffersFiltersBar filters={filters} onChange={handleFiltersChange} />
      <OffersTable rows={query.data?.rows ?? []} isLoading={query.isPending} isError={query.isError} />
      <TablePagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
