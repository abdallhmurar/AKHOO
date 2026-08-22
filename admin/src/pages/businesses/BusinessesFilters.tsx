import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABEL_KEYS } from '@/lib/categories'
import type { BusinessFilters } from './useBusinesses'

export function BusinessesFiltersBar({ filters, onChange }: { filters: BusinessFilters; onChange: (filters: BusinessFilters) => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={filters.search} onChange={e => onChange({ ...filters, search: e.target.value })} placeholder={t('businesses.filters.searchPlaceholder')} className="ps-9" />
      </div>
      <Select value={filters.category} onValueChange={value => onChange({ ...filters, category: value as BusinessFilters['category'] })}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder={t('businesses.filters.category')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('businesses.filters.allCategories')}</SelectItem>
          {BUSINESS_CATEGORIES.map(cat => (
            <SelectItem key={cat} value={cat}>
              {t(BUSINESS_CATEGORY_LABEL_KEYS[cat])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.active} onValueChange={value => onChange({ ...filters, active: value as BusinessFilters['active'] })}>
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder={t('businesses.table.status')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('businesses.filters.allStatuses')}</SelectItem>
          <SelectItem value="active">{t('businesses.table.active')}</SelectItem>
          <SelectItem value="inactive">{t('businesses.table.inactive')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
