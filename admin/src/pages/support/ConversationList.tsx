import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { cn } from '@/lib/cn'
import type { SupportStatus } from '@/types'
import type { ConversationRow } from './useSupport'
import { formatListStamp } from './format'

type Filter = 'all' | SupportStatus
const FILTERS: Filter[] = ['all', 'open', 'waiting_user', 'resolved']

const DOT: Record<SupportStatus, string> = {
  open: 'bg-sanad-danger',
  waiting_user: 'bg-sanad-info',
  resolved: 'bg-sanad-success'
}

export function ConversationList({ rows, loading, selectedId, onSelect }: { rows: ConversationRow[]; loading: boolean; selectedId: string | undefined; onSelect: (id: string) => void }) {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

  const counts = useMemo(() => {
    const result: Record<Filter, number> = { all: rows.length, open: 0, waiting_user: 0, resolved: 0 }
    for (const row of rows) result[row.status] += 1
    return result
  }, [rows])

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return rows.filter(row => (filter === 'all' || row.status === filter) && (!needle || (row.name ?? '').toLowerCase().includes(needle)))
  }, [rows, filter, search])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('support.search')} className="ps-9" aria-label={t('support.search')} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map(key => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                filter === key ? 'border-teal bg-teal text-white' : 'border-border text-muted-foreground hover:bg-secondary'
              )}
            >
              {t(`support.filters.${key}`)} <span className="opacity-75">{counts[key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col gap-2 p-3">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState message={t('support.emptyList')} />
        ) : visible.length === 0 ? (
          <EmptyState message={t('support.emptyFiltered')} />
        ) : (
          <ul>
            {visible.map(row => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onSelect(row.id)}
                  aria-current={row.id === selectedId ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-border px-3 py-3 text-start transition-colors hover:bg-secondary/60',
                    row.id === selectedId && 'bg-secondary'
                  )}
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarImage src={row.avatar_url ?? undefined} />
                    <AvatarFallback>{(row.name?.trim()?.[0] ?? '?').toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('truncate text-sm text-foreground', row.status === 'open' ? 'font-bold' : 'font-medium')}>{row.name || t('support.customer.noName')}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">{formatListStamp(row.last_message_at, i18n.language)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="flex-1 truncate text-xs text-muted-foreground">
                        {row.last_sender === 'admin' ? <span className="text-teal">{t('support.you')}: </span> : null}
                        {row.last_message_preview ? row.last_message_preview : <span className="inline-flex items-center gap-1"><Camera className="size-3" />{t('support.photo')}</span>}
                      </p>
                      <span className={cn('size-2 shrink-0 rounded-full', DOT[row.status])} title={t(`support.status.${row.status}`)} />
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
