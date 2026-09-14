import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { ReportStatusBadge } from '@/components/StatusBadge'
import type { ReportRow } from './useReports'

export function ReportsTable({ rows, isLoading, isError }: { rows: ReportRow[]; isLoading: boolean; isError: boolean }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const columns: Column<ReportRow>[] = [
    { key: 'reporter', header: t('reports.table.reporter'), cell: row => row.reporter_name || t('common.unknown') },
    { key: 'target', header: t('reports.table.target'), cell: row => t(`reports.targetTypes.${row.target_type}`) },
    { key: 'reason', header: t('reports.table.reason'), cell: row => <span className="line-clamp-1 max-w-xs">{row.reason}</span> },
    { key: 'status', header: t('reports.table.status'), cell: row => <ReportStatusBadge status={row.status} /> },
    { key: 'date', header: t('reports.table.date'), cell: row => new Date(row.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' }) }
  ]

  return <DataTable columns={columns} rows={rows} isLoading={isLoading} isError={isError} getRowId={row => row.id} onRowClick={row => navigate(`/reports/${row.id}`)} />
}
