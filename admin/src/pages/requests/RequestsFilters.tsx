import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { RequestStatus, ServiceType } from '@/types'
import type { RequestFilters } from './useRequests'

const STATUSES: RequestStatus[] = ['open', 'accepted', 'on_the_way', 'arrived', 'awaiting_confirmation', 'completed', 'cancelled']
const SERVICES: ServiceType[] = ['battery', 'tire', 'fuel', 'locked_car', 'other']

export function RequestsFiltersBar({ filters, onChange }: { filters: RequestFilters; onChange: (filters: RequestFilters) => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          placeholder={t('requests.filters.searchPlaceholder')}
          className="ps-9"
        />
      </div>
      <Select value={filters.status} onValueChange={value => onChange({ ...filters, status: value as RequestFilters['status'] })}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder={t('requests.filters.status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('requests.filters.allStatuses')}</SelectItem>
          {STATUSES.map(status => (
            <SelectItem key={status} value={status}>
              {t(`requests.status.${status}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.serviceType} onValueChange={value => onChange({ ...filters, serviceType: value as RequestFilters['serviceType'] })}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder={t('requests.filters.serviceType')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('requests.filters.allServices')}</SelectItem>
          {SERVICES.map(service => (
            <SelectItem key={service} value={service}>
              {t(`requests.service.${service}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
