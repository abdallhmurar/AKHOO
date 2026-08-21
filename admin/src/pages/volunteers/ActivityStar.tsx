import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getVolunteerActivityLevel, ACTIVITY_LEVEL_COLORS } from '@/lib/activityLevel'

export function ActivityStar({ completedCount }: { completedCount: number }) {
  const { t } = useTranslation()
  const level = getVolunteerActivityLevel(completedCount)

  if (level === 'none') {
    return <span className="text-xs text-muted-foreground">{t('volunteers.activityLevel.none')}</span>
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium" style={{ color: ACTIVITY_LEVEL_COLORS[level] }}>
      <Star className="size-4 fill-current" />
      {t(`volunteers.activityLevel.${level}`)}
    </span>
  )
}
