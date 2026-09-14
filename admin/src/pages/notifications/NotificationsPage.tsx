import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Bell } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, TablePagination } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import type { BroadcastNotification, NotificationAudience } from '@/types'
import { useNotifications } from './useNotifications'
import { useSendNotification } from './useSendNotification'

function ComposeCard() {
  const { t } = useTranslation()
  const send = useSendNotification()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<NotificationAudience>('all')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await send.mutateAsync({ title, body, audience })
      toast.success(t('notifications.compose.sent'))
      setTitle('')
      setBody('')
    } catch {
      // useSendNotification's onError already toasts the message
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-teal" />
          <h2 className="text-sm font-semibold text-foreground">{t('notifications.compose.title')}</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="notif-title">{t('notifications.compose.titleField')}</Label>
            <Input id="notif-title" required value={title} onChange={e => setTitle(e.target.value)} maxLength={80} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notif-body">{t('notifications.compose.bodyField')}</Label>
            <textarea
              id="notif-body"
              required
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={3}
              maxLength={200}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-2 sm:w-64">
            <Label>{t('notifications.compose.audience')}</Label>
            <Select value={audience} onValueChange={v => setAudience(v as NotificationAudience)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('notifications.compose.audienceAll')}</SelectItem>
                <SelectItem value="volunteers">{t('notifications.compose.audienceVolunteers')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button type="submit" disabled={send.isPending || !title.trim() || !body.trim()}>
              {t('notifications.compose.send')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function NotificationsPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(0)
  const query = useNotifications(page)

  const columns: Column<BroadcastNotification>[] = [
    { key: 'title', header: t('notifications.table.title'), cell: row => row.title },
    { key: 'audience', header: t('notifications.table.audience'), cell: row => (row.target_audience === 'all' ? t('notifications.compose.audienceAll') : t('notifications.compose.audienceVolunteers')) },
    { key: 'sentCount', header: t('notifications.table.sentCount'), cell: row => row.sent_count },
    { key: 'date', header: t('notifications.table.date'), cell: row => (row.sent_at ? new Date(row.sent_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }) : '—') }
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('notifications.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('notifications.subtitle')}</p>
      </div>
      <ComposeCard />
      <DataTable columns={columns} rows={query.data?.rows ?? []} isLoading={query.isPending} isError={query.isError} getRowId={row => row.id} />
      <TablePagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
