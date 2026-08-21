import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { BooleanBadge } from '@/components/StatusBadge'
import type { Profile } from '@/types'

export function UsersTable({ rows, isLoading, isError }: { rows: Profile[]; isLoading: boolean; isError: boolean }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const columns: Column<Profile>[] = [
    { key: 'name', header: t('users.table.name'), cell: row => row.full_name || <span className="text-muted-foreground">{t('users.table.noName')}</span> },
    { key: 'phone', header: t('users.table.phone'), cell: row => <span dir="ltr">{row.phone || t('users.table.noPhone')}</span> },
    { key: 'joined', header: t('users.table.joined'), cell: row => new Date(row.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' }) },
    { key: 'status', header: t('users.table.status'), cell: row => <BooleanBadge value={row.is_banned} trueLabel={t('users.table.banned')} falseLabel={t('users.table.active')} invertTone /> }
  ]

  return <DataTable columns={columns} rows={rows} isLoading={isLoading} isError={isError} getRowId={row => row.id} onRowClick={row => navigate(`/users/${row.id}`)} />
}
