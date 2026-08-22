import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'

export function StarRating({ rating, reviewCount, size = 'md' }: { rating: number | null; reviewCount?: number; size?: 'sm' | 'md' }) {
  const { t } = useTranslation()
  const iconSize = size === 'sm' ? 'size-3.5' : 'size-4'

  if (rating == null) {
    return <span className="text-xs text-muted-foreground">{t('businesses.detail.noReviews')}</span>
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star className={cn(iconSize, 'fill-sanad-sand text-sanad-sand')} />
      <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
      {reviewCount != null ? <span className="text-muted-foreground">({reviewCount})</span> : null}
    </span>
  )
}
