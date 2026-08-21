import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/EmptyState'
import { AUDIT_ACTION_LABEL_KEYS } from '@/lib/auditActions'
import type { AuditLogWithAdminName } from './useRecentAuditLog'

export function RecentActivityFeed({ items, isLoading }: { items: AuditLogWithAdminName[] | undefined; isLoading: boolean }) {
  const { t, i18n } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground">{t('dashboard.recentActivity.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : !items || items.length === 0 ? (
          <EmptyState message={t('dashboard.recentActivity.empty')} />
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map(item => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-foreground">
                  <span className="font-medium">{item.admin_name ?? t('common.unknown')}</span>{' '}
                  {t(AUDIT_ACTION_LABEL_KEYS[item.action])}{' '}
                  <span className="text-muted-foreground">{item.target_label}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' })}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
