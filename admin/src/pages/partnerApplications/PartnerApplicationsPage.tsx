import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DataTable, TablePagination } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import {
  PARTNER_APPLICATION_STATUSES, PARTNER_CATEGORY_KEYS, usePartnerApplications, useSetPartnerApplication
} from './usePartnerApplications'
import type { PartnerApplication, PartnerApplicationFilters, PartnerApplicationStatus } from './usePartnerApplications'

function StatusSelect({ row }: { row: PartnerApplication }) {
  const { t } = useTranslation()
  const save = useSetPartnerApplication()
  return (
    <Select value={row.status} disabled={save.isPending} onValueChange={status => save.mutate({ id: row.id, status: status as PartnerApplicationStatus, note: row.note })}>
      <SelectTrigger className="w-40" aria-label={t('partnerApplications.table.status')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PARTNER_APPLICATION_STATUSES.map(status => <SelectItem key={status} value={status}>{t(`partnerApplications.status.${status}`)}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function PartnerApplicationsPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState<PartnerApplicationFilters>({ status: 'all' })
  const query = usePartnerApplications(page, filters)

  const columns: Column<PartnerApplication>[] = [
    { key: 'date', header: t('partnerApplications.table.date'), cell: row => new Date(row.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' }) },
    { key: 'business', header: t('partnerApplications.table.business'), cell: row => <div className="flex flex-col"><span className="font-semibold">{row.business_name}</span><span className="text-xs text-muted-foreground">{row.city}</span></div> },
    { key: 'category', header: t('partnerApplications.table.category'), cell: row => t(`partnerApplications.categories.${PARTNER_CATEGORY_KEYS[row.category] ?? 'other'}`) },
    { key: 'phone', header: t('partnerApplications.table.phone'), cell: row => <a href={`tel:${row.phone}`} dir="ltr" className="underline">{row.phone}</a> },
    { key: 'offer', header: t('partnerApplications.table.offer'), cell: row => <span className="line-clamp-2 max-w-xs">{row.offer || '—'}</span> },
    { key: 'source', header: t('partnerApplications.table.source'), cell: row => t(`partnerApplications.sources.${row.source}`) },
    { key: 'status', header: t('partnerApplications.table.status'), cell: row => <StatusSelect row={row} /> }
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('partnerApplications.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('partnerApplications.subtitle')}</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={filters.status} onValueChange={status => { setFilters({ status: status as PartnerApplicationFilters['status'] }); setPage(0) }}>
          <SelectTrigger className="w-full sm:w-48" aria-label={t('partnerApplications.table.status')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('requests.filters.allStatuses')}</SelectItem>
            {PARTNER_APPLICATION_STATUSES.map(status => <SelectItem key={status} value={status}>{t(`partnerApplications.status.${status}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable columns={columns} rows={query.data?.rows ?? []} isLoading={query.isPending} isError={query.isError} getRowId={row => row.id} />
      <TablePagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
