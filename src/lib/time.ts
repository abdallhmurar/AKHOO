export function formatElapsed(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes < 1) return 'أقل من دقيقة'
  if (minutes < 60) return `${minutes} دقيقة`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} ساعة` : `${hours} ساعة و${rest} دقيقة`
}
