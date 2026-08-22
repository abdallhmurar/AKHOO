import { useTranslation } from 'react-i18next'
import { ImageOff, Tag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { OfferDiscountType } from '@/types'

// Uses ONLY the data currently entered in the form - no invented business
// information, no fake discount badge (a percentage badge only renders if
// the admin actually chose discount_type='percentage'). Purpose: let the
// admin catch bad/inconsistent information before it's ever submitted for
// approval, per the brief's section 10/11.
export function OfferPreviewCard({
  title,
  description,
  businessName,
  imageUrl,
  discountType,
  discountValue,
  originalPrice,
  offerPrice,
  validUntil
}: {
  title: string
  description: string
  businessName: string | null
  imageUrl: string | null
  discountType: OfferDiscountType
  discountValue: number | null
  originalPrice: number | null
  offerPrice: number | null
  validUntil: string | null
}) {
  const { t } = useTranslation()

  return (
    <Card className="overflow-hidden">
      <div className="flex h-32 items-center justify-center bg-secondary">
        {imageUrl ? <img src={imageUrl} alt="" className="size-full object-cover" /> : <ImageOff className="size-8 text-muted-foreground" />}
      </div>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{businessName || t('offers.preview.businessPlaceholder')}</p>
            <p className="font-semibold text-foreground">{title || t('offers.preview.titlePlaceholder')}</p>
          </div>
          {discountType === 'percentage' && discountValue ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sanad-danger px-2 py-0.5 text-xs font-bold text-white">
              <Tag className="size-3" />
              -{discountValue}%
            </span>
          ) : null}
        </div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        {originalPrice != null && offerPrice != null ? (
          <div className="flex items-baseline gap-2" dir="ltr">
            <span className="text-sm text-muted-foreground line-through">{originalPrice}</span>
            <span className="text-lg font-bold text-sanad-forest">{offerPrice}</span>
          </div>
        ) : discountType === 'free_benefit' ? (
          <span className="text-sm font-semibold text-sanad-forest">{t('offers.preview.freeBenefit')}</span>
        ) : discountType === 'fixed' && discountValue ? (
          <span className="text-sm font-semibold text-sanad-forest" dir="ltr">
            -{discountValue}
          </span>
        ) : null}
        {validUntil ? <p className="text-xs text-muted-foreground">{t('offers.preview.validUntil', { date: new Date(validUntil).toLocaleDateString() })}</p> : null}
      </CardContent>
    </Card>
  )
}
