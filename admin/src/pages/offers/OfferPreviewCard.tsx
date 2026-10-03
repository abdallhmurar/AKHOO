import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageOff, Sparkles, Tag } from 'lucide-react'
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
  imageUrls,
  offerTypeLabel,
  discountType,
  discountValue,
  originalPrice,
  offerPrice,
  validUntil,
  memberOnly
}: {
  title: string
  description: string
  businessName: string | null
  imageUrl: string | null
  imageUrls?: string[]
  offerTypeLabel?: string | null
  discountType: OfferDiscountType
  discountValue: number | null
  originalPrice: number | null
  offerPrice: number | null
  validUntil: string | null
  memberOnly?: boolean
}) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string | null>(null)
  const images = imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : []
  const active = selected && images.includes(selected) ? selected : images[0]

  return (
    <Card className="overflow-hidden">
      <div className="flex aspect-square items-center justify-center bg-white">
        {active ? <img src={active} alt={title} className="size-full object-contain" /> : <ImageOff className="size-8 text-muted-foreground" />}
      </div>
      {images.length > 1 ? <div className="flex flex-wrap gap-2 p-3">{images.map((url, index) => <button type="button" key={url} aria-label={t('offers.form.imageNumber', { number: index + 1 })} aria-pressed={active === url} onClick={() => setSelected(url)} className={`size-14 overflow-hidden rounded-md border-2 bg-white ${active === url ? 'border-primary' : 'border-border'}`}><img src={url} alt="" className="size-full object-contain" /></button>)}</div> : null}
      <CardContent className="flex flex-col gap-2 p-4">
        {memberOnly ? (
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-sanad-forest px-2 py-0.5 text-xs font-bold text-sanad-sand">
            <Sparkles className="size-3" />
            {t('offers.preview.memberOnlyBadge')}
          </span>
        ) : null}
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
        {offerTypeLabel ? <p className="text-sm font-medium text-sanad-forest">{offerTypeLabel}</p> : null}
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
