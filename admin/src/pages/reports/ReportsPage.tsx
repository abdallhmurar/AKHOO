import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { TablePagination } from '@/components/DataTable'
import { useReports } from './useReports'
import type { ReportFilters } from './useReports'
import { ReportsTable } from './ReportsTable'

const DEFAULT_FILTERS: ReportFilters = { status: 'all', search: '' }

export function ReportsPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS)
  const query = useReports(page, filters)

  function handleChange(next: ReportFilters) {
    setFilters(next)
    setPage(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('reports.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('reports.subtitle')}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={filters.search} onChange={e => handleChange({ ...filters, search: e.target.value })} placeholder={t('reports.filters.searchPlaceholder')} className="ps-9" />
        </div>
        <Select value={filters.status} onValueChange={v => handleChange({ ...filters, status: v as ReportFilters['status'] })}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('requests.filters.allStatuses')}</SelectItem>
            <SelectItem value="open">{t('reports.status.open')}</SelectItem>
            <SelectItem value="reviewing">{t('reports.status.reviewing')}</SelectItem>
            <SelectItem value="resolved">{t('reports.status.resolved')}</SelectItem>
            <SelectItem value="dismissed">{t('reports.status.dismissed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ReportsTable rows={query.data?.rows ?? []} isLoading={query.isPending} isError={query.isError} />
      <TablePagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
