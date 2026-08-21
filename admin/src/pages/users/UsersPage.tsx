import { useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { TablePagination } from '@/components/DataTable'
import { useUsers } from './useUsers'
import { UsersTable } from './UsersTable'

export function UsersPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const query = useUsers(page, search)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('users.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('users.subtitle')}</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder={t('users.table.searchPlaceholder')}
          className="ps-9"
        />
      </div>
      <UsersTable rows={query.data?.rows ?? []} isLoading={query.isPending} isError={query.isError} />
      <TablePagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
