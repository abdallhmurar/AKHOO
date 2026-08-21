import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { BooleanBadge } from '@/components/StatusBadge'
import { ActivityStar } from './ActivityStar'
import type { VolunteerRow } from './useVolunteers'

export function VolunteersTable({ rows, isLoading, isError }: { rows: VolunteerRow[]; isLoading: boolean; isError: boolean }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const columns: Column<VolunteerRow>[] = [
    { key: 'name', header: t('volunteers.table.name'), cell: row => row.full_name || <span className="text-muted-foreground">{t('users.table.noName')}</span> },
    { key: 'activityLevel', header: t('volunteers.table.activityLevel'), cell: row => <ActivityStar completedCount={row.completed_count} /> },
    { key: 'completedAssists', header: t('volunteers.table.completedAssists'), cell: row => row.completed_count },
    { key: 'points', header: t('volunteers.table.points'), cell: row => row.points },
    { key: 'availability', header: t('volunteers.table.availability'), cell: row => <BooleanBadge value={row.is_available} trueLabel={t('volunteers.table.available')} falseLabel={t('volunteers.table.unavailable')} /> },
    { key: 'verified', header: t('volunteers.table.verified'), cell: row => <BooleanBadge value={row.is_verified} trueLabel={t('volunteers.table.verified')} falseLabel={t('volunteers.table.unverified')} /> }
  ]

  return <DataTable columns={columns} rows={rows} isLoading={isLoading} isError={isError} getRowId={row => row.user_id} onRowClick={row => navigate(`/volunteers/${row.user_id}`)} />
}
