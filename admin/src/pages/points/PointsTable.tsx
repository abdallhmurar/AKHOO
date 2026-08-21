import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import type { PointRow } from './usePointTransactions'

export function PointsTable({ rows, isLoading, isError }: { rows: PointRow[]; isLoading: boolean; isError: boolean }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const columns: Column<PointRow>[] = [
    { key: 'volunteer', header: t('points.table.volunteer'), cell: row => row.volunteer_name || t('common.unknown') },
    { key: 'points', header: t('points.table.points'), cell: row => <span className="font-semibold text-sanad-success">+{row.points}</span> },
    { key: 'reason', header: t('points.table.reason'), cell: row => t(`points.reasons.${row.reason}`) },
    { key: 'request', header: t('points.table.request'), cell: row => (row.service_type ? t(`requests.service.${row.service_type}`) : <span className="font-mono text-xs">{row.request_id.slice(0, 8).toUpperCase()}</span>) },
    { key: 'date', header: t('points.table.date'), cell: row => new Date(row.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' }) }
  ]

  return <DataTable columns={columns} rows={rows} isLoading={isLoading} isError={isError} getRowId={row => row.id} onRowClick={row => navigate(`/requests/${row.request_id}`)} />
}
