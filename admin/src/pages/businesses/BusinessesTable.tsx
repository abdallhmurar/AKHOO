import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { BooleanBadge } from '@/components/StatusBadge'
import { BUSINESS_CATEGORY_LABEL_KEYS } from '@/lib/categories'
import type { Business } from '@/types'

export function BusinessesTable({ rows, isLoading, isError }: { rows: Business[]; isLoading: boolean; isError: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const columns: Column<Business>[] = [
    { key: 'logo', header: '', cell: row => (row.logo_url ? <img src={row.logo_url} alt="" className="size-9 rounded-md object-cover" /> : <div className="size-9 rounded-md bg-secondary" />), className: 'w-12' },
    { key: 'name', header: t('businesses.table.name'), cell: row => row.name },
    { key: 'category', header: t('businesses.table.category'), cell: row => t(BUSINESS_CATEGORY_LABEL_KEYS[row.category]) },
    { key: 'phone', header: t('businesses.table.phone'), cell: row => <span dir="ltr">{row.phone || '—'}</span> },
    { key: 'status', header: t('businesses.table.status'), cell: row => <BooleanBadge value={row.is_active} trueLabel={t('businesses.table.active')} falseLabel={t('businesses.table.inactive')} /> }
  ]

  return <DataTable columns={columns} rows={rows} isLoading={isLoading} isError={isError} getRowId={row => row.id} onRowClick={row => navigate(`/businesses/${row.id}`)} />
}
