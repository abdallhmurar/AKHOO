import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { colors, chartPalette } from '@/lib/theme'
import type { DashboardMetrics } from '@/types'

export function RequestsByStatusChart({ metrics, isLoading }: { metrics: DashboardMetrics | undefined; isLoading: boolean }) {
  const { t } = useTranslation()

  const data = metrics
    ? [
        { key: 'open', label: t('requests.status.open'), value: metrics.open_requests },
        { key: 'active', label: t('dashboard.stats.activeRequests'), value: metrics.active_requests },
        { key: 'awaiting', label: t('requests.status.awaiting_confirmation'), value: metrics.awaiting_confirmation_requests },
        { key: 'completedToday', label: t('dashboard.stats.completedToday'), value: metrics.completed_today },
        { key: 'cancelled', label: t('requests.status.cancelled'), value: metrics.cancelled_total }
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground">{t('dashboard.charts.statusTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: colors.muted }} axisLine={{ stroke: colors.border }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={entry.key} fill={chartPalette[index % chartPalette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
