import { Users, ClipboardList, Zap, Clock, CheckCircle2, CalendarCheck, HeartHandshake, Trophy, Award } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { StatCard } from '@/components/StatCard'
import type { DashboardMetrics } from '@/types'

export function StatsRow({ metrics, isLoading }: { metrics: DashboardMetrics | undefined; isLoading: boolean }) {
  const { t } = useTranslation()

  const cards = [
    { key: 'totalUsers', icon: Users, value: metrics?.total_users, tone: 'default' },
    { key: 'openRequests', icon: ClipboardList, value: metrics?.open_requests, tone: 'default' },
    { key: 'activeRequests', icon: Zap, value: metrics?.active_requests, tone: 'default' },
    { key: 'awaitingConfirmation', icon: Clock, value: metrics?.awaiting_confirmation_requests, tone: 'default' },
    { key: 'completedToday', icon: CheckCircle2, value: metrics?.completed_today, tone: 'default' },
    { key: 'completedThisWeek', icon: CalendarCheck, value: metrics?.completed_this_week, tone: 'default' },
    { key: 'activeVolunteers', icon: HeartHandshake, value: metrics?.active_volunteers, tone: 'default' },
    { key: 'totalConfirmedAssists', icon: Trophy, value: metrics?.total_confirmed_assists, tone: 'gold' },
    { key: 'totalPointsAwarded', icon: Award, value: metrics?.total_points_awarded, tone: 'gold' }
  ] as const

  return (
    <div data-testid="stats-grid" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map(card => (
        <StatCard key={card.key} label={t(`dashboard.stats.${card.key}`)} value={card.value ?? 0} icon={card.icon} isLoading={isLoading} tone={card.tone} />
      ))}
    </div>
  )
}
