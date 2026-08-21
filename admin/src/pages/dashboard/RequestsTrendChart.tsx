import { useTranslation } from 'react-i18next'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { colors } from '@/lib/theme'

export function RequestsTrendChart({ data, isLoading }: { data: { day: string; completed_count: number }[] | undefined; isLoading: boolean }) {
  const { t, i18n } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground">{t('dashboard.charts.trendTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !data || data.length === 0 ? (
          <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">{t('dashboard.charts.noData')}</p>
        ) : (
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.forest} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={colors.forest} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                <XAxis
                  dataKey="day"
                  tickFormatter={value => new Date(value).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}
                  tick={{ fontSize: 11, fill: colors.muted }}
                  axisLine={{ stroke: colors.border }}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: colors.muted }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 12 }}
                  labelFormatter={value => new Date(value as string).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' })}
                  formatter={value => [value, t('requests.status.completed')]}
                />
                <Area type="monotone" dataKey="completed_count" name={t('requests.status.completed')} stroke={colors.forest} strokeWidth={2} fill="url(#trendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
