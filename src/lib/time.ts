import type { TFunction } from 'i18next'

export function formatElapsed(ms: number, t: TFunction) {
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes < 1) return t('activeRequest.elapsed.lessThanMinute')
  if (minutes < 60) return t('activeRequest.elapsed.minutes', { count: minutes })
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0
    ? t('activeRequest.elapsed.hours', { count: hours })
    : t('activeRequest.elapsed.hoursAndMinutes', { hours, minutes: rest })
}
