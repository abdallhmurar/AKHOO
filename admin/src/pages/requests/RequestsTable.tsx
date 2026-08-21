import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { RequestStatusBadge } from '@/components/StatusBadge'
import type { RequestRow } from './useRequests'

export function RequestsTable({ rows, isLoading, isError }: { rows: RequestRow[]; isLoading: boolean; isError: boolean }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const columns: Column<RequestRow>[] = [
    { key: 'id', header: t('requests.table.id'), cell: row => <span className="font-mono text-xs">{row.id.slice(0, 8).toUpperCase()}</span> },
    { key: 'requester', header: t('requests.table.requester'), cell: row => row.requester_name || t('users.table.noName') },
    { key: 'service', header: t('requests.table.service'), cell: row => t(`requests.service.${row.service_type}`) },
    { key: 'status', header: t('requests.table.status'), cell: row => <RequestStatusBadge status={row.status} /> },
    { key: 'volunteer', header: t('requests.table.volunteer'), cell: row => row.volunteer_name || <span className="text-muted-foreground">{t('requests.table.unassigned')}</span> },
    { key: 'createdAt', header: t('requests.table.createdAt'), cell: row => new Date(row.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' }) }
  ]

  return <DataTable columns={columns} rows={rows} isLoading={isLoading} isError={isError} getRowId={row => row.id} onRowClick={row => navigate(`/requests/${row.id}`)} />
}
