import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { StarRating } from '@/components/StarRating'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { TablePagination } from '@/components/DataTable'
import { useMissionRatings } from './useMissionRatings'
import type { MissionRatingRow } from './useMissionRatings'

export function MissionRatingsPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(0)
  const query = useMissionRatings(page)

  const columns: Column<MissionRatingRow>[] = [
    { key: 'helper', header: t('missionRatings.table.helper'), cell: row => row.helper_name || t('common.unknown') },
    { key: 'requester', header: t('missionRatings.table.requester'), cell: row => row.requester_name || t('common.unknown') },
    { key: 'stars', header: t('missionRatings.table.stars'), cell: row => <StarRating rating={row.stars} size="sm" /> },
    { key: 'date', header: t('missionRatings.table.date'), cell: row => new Date(row.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' }) }
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('missionRatings.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('missionRatings.subtitle')}</p>
      </div>
      <DataTable columns={columns} rows={query.data?.rows ?? []} isLoading={query.isPending} isError={query.isError} getRowId={row => row.id} />
      <TablePagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
