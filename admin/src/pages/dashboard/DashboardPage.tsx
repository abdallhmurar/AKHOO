import { useTranslation } from 'react-i18next'
import { useDashboardMetrics, useCompletionTrend } from './useDashboardMetrics'
import { useRecentAuditLog } from './useRecentAuditLog'
import { StatsRow } from './StatsRow'
import { RequestsTrendChart } from './RequestsTrendChart'
import { RequestsByStatusChart } from './RequestsByStatusChart'
import { RecentActivityFeed } from './RecentActivityFeed'

export function DashboardPage() {
  const { t } = useTranslation()
  const metricsQuery = useDashboardMetrics()
  const trendQuery = useCompletionTrend(14)
  const auditQuery = useRecentAuditLog(10)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      <StatsRow metrics={metricsQuery.data} isLoading={metricsQuery.isPending} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RequestsTrendChart data={trendQuery.data} isLoading={trendQuery.isPending} />
        <RequestsByStatusChart metrics={metricsQuery.data} isLoading={metricsQuery.isPending} />
      </div>

      <RecentActivityFeed items={auditQuery.data} isLoading={auditQuery.isPending} />
    </div>
  )
}
