import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { TablePagination } from '@/components/DataTable'
import { useVolunteers } from './useVolunteers'
import { VolunteersTable } from './VolunteersTable'

export function VolunteersPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const query = useVolunteers(page, search)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('volunteers.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('volunteers.subtitle')}</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder={t('volunteers.table.searchPlaceholder')}
          className="ps-9"
        />
      </div>
      <VolunteersTable rows={query.data?.rows ?? []} isLoading={query.isPending} isError={query.isError} />
      <TablePagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
