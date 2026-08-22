import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { OfferStatus } from '@/types'
import type { OfferFilters } from './useOffers'

const STATUSES: OfferStatus[] = ['draft', 'pending_review', 'approved', 'rejected', 'paused', 'expired']

export function OffersFiltersBar({ filters, onChange }: { filters: OfferFilters; onChange: (filters: OfferFilters) => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={filters.search} onChange={e => onChange({ ...filters, search: e.target.value })} placeholder={t('offers.filters.searchPlaceholder')} className="ps-9" />
      </div>
      <Select value={filters.status} onValueChange={value => onChange({ ...filters, status: value as OfferFilters['status'] })}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder={t('requests.filters.status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('requests.filters.allStatuses')}</SelectItem>
          {STATUSES.map(status => (
            <SelectItem key={status} value={status}>
              {t(`offers.status.${status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
