import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Eye, CheckCircle2, XCircle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ReportStatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { ErrorState } from '@/components/ErrorState'
import { EmptyState } from '@/components/EmptyState'
import { useIsRTL } from '@/lib/direction'
import { AUDIT_ACTION_LABEL_KEYS } from '@/lib/auditActions'
import { useReportDetail } from './useReportDetail'
import { useResolveReport } from './useResolveReport'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

type PendingAction = 'reviewing' | 'resolved' | 'dismissed' | null

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const isRTL = useIsRTL()
  const BackIcon = isRTL ? ArrowRight : ArrowLeft
  const query = useReportDetail(id)
  const resolve = useResolveReport()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [note, setNote] = useState('')
  const [messageToHide, setMessageToHide] = useState<string | null>(null)
  const client = useQueryClient()

  if (query.isPending) return <FullPageSpinner />
  if (query.isError || !query.data) return <ErrorState onRetry={() => query.refetch()} />

  const { report, reporterName, history, messages } = query.data

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
          <BackIcon className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-foreground">{t(`reports.targetTypes.${report.target_type}`)}</h1>
          <p className="text-sm text-muted-foreground">{reporterName || t('common.unknown')}</p>
        </div>
        <ReportStatusBadge status={report.status} />
      </div>

      {report.status !== 'dismissed' && report.status !== 'resolved' ? (
        <div className="flex flex-wrap gap-2">
          {report.status === 'open' ? (
            <Button size="sm" variant="outline" onClick={() => setPendingAction('reviewing')}>
              <Eye className="size-4" />
              {t('reports.detail.reviewing')}
            </Button>
          ) : null}
          <Button size="sm" onClick={() => setPendingAction('resolved')}>
            <CheckCircle2 className="size-4" />
            {t('reports.detail.resolve')}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => setPendingAction('dismissed')}>
            <XCircle className="size-4" />
            {t('reports.detail.dismiss')}
          </Button>
        </div>
      ) : null}

      {pendingAction ? (
        <ConfirmDialog
          open={!!pendingAction}
          onOpenChange={open => !open && setPendingAction(null)}
          title={pendingAction === 'resolved' ? t('reports.detail.resolveConfirmTitle') : pendingAction === 'dismissed' ? t('reports.detail.dismissConfirmTitle') : t('reports.detail.reviewing')}
          description=""
          confirmLabel={pendingAction === 'dismissed' ? t('reports.detail.dismiss') : t('reports.detail.resolve')}
          destructive={pendingAction === 'dismissed'}
          onConfirm={() => resolve.mutateAsync({ id: report.id, status: pendingAction!, note: note || undefined }).then(() => setNote(''))}
        >
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t('reports.detail.notePlaceholder')}
            rows={3}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </ConfirmDialog>
      ) : null}
      <ConfirmDialog open={!!messageToHide} onOpenChange={open => !open && setMessageToHide(null)} title={t('reports.detail.hideMessage')} description={t('reports.detail.hideHint')} confirmLabel={t('reports.detail.hideMessage')} destructive onConfirm={async () => {
        const { error } = await supabase.rpc('admin_hide_message', { p_id: messageToHide })
        if (error) throw error
        await client.invalidateQueries({ queryKey: ['report', id] })
        await client.invalidateQueries({ queryKey: ['audit-log'] })
      }} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('reports.table.reason')}</p>
                <p className="text-sm text-foreground">{report.reason}</p>
              </div>
              {report.details ? (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('offers.form.description')}</p>
                  <p className="text-sm text-foreground">{report.details}</p>
                </div>
              ) : null}
              {report.resolution_note ? (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('reports.detail.notePlaceholder')}</p>
                  <p className="text-sm text-foreground">{report.resolution_note}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-teal" />
                <p className="text-sm font-semibold text-foreground">{t('reports.detail.chatTitle')}</p>
              </div>
              <p className="text-xs text-muted-foreground">{t('reports.detail.chatHint')}</p>
              {messages.length === 0 ? (
                <EmptyState message={t('reports.detail.noMessages')} />
              ) : (
                <ul className="flex flex-col gap-2">
                  {messages.map(m => (
                    <li key={m.id} className="rounded-md border border-border p-2 text-sm">
                      {m.is_hidden ? <p>{t('reports.detail.hidden')}</p> : <Button size="sm" variant="outline" onClick={() => setMessageToHide(m.id)}>{t('reports.detail.hideMessage')}</Button>}
                      {m.media_url && m.media_type === 'image' ? <img src={m.media_url} alt={t('reports.detail.attachment')} className="max-h-64 rounded object-contain" /> : null}
                      {m.media_url && m.media_type === 'video' ? <video src={m.media_url} controls aria-label={t('reports.detail.attachment')} className="max-h-64 rounded" /> : null}
                      <p className="text-foreground">{m.body || (m.media_type === 'image' ? '📷' : m.media_type === 'video' ? '🎥' : '')}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{t('businesses.detail.tabs.history')}</p>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('users.detail.noHistory')}</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {history.map(item => (
                  <li key={item.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                    <span className="text-foreground">{t(AUDIT_ACTION_LABEL_KEYS[item.action])}</span>
                    <span className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
