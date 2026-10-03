import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { uploadBusinessImage, validateImageFile, ImageValidationError } from '@/lib/storage'
import type { Offer, OfferDiscountType } from '@/types'
import { useUpsertOffer } from './useUpsertOffer'
import { useBusinessOptions } from './useBusinessOptions'
import { OfferPreviewCard } from './OfferPreviewCard'
import { ContentTranslationNotice } from '@/components/ContentTranslationNotice'

const DISCOUNT_TYPES: OfferDiscountType[] = ['percentage', 'fixed', 'special_price', 'free_benefit']

// Radix Select reserves the empty string for "no selection" internally, so a
// real "no partner" choice needs its own sentinel value, translated back to
// null only when building the RPC payload.
const NO_BUSINESS_VALUE = '__none__'

function toDateInputValue(iso: string | null) {
  return iso ? iso.slice(0, 10) : ''
}

export function OfferForm({ offer }: { offer?: Offer }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const businessOptions = useBusinessOptions()
  const upsert = useUpsertOffer()
  const isEdit = !!offer

  const [businessId, setBusinessId] = useState(offer?.partner_id ?? searchParams.get('business') ?? NO_BUSINESS_VALUE)
  const [title, setTitle] = useState(offer?.title ?? '')
  const [description, setDescription] = useState(offer?.description ?? '')
  const [terms, setTerms] = useState(offer?.terms ?? '')
  const [discountType, setDiscountType] = useState<OfferDiscountType>(offer?.discount_type ?? 'percentage')
  const [discountValue, setDiscountValue] = useState(offer?.discount_value?.toString() ?? '')
  const [originalPrice, setOriginalPrice] = useState(offer?.original_price?.toString() ?? '')
  const [offerPrice, setOfferPrice] = useState(offer?.offer_price?.toString() ?? '')
  const [imageUrls, setImageUrls] = useState<string[]>(offer?.image_urls?.length ? offer.image_urls : offer?.image_url ? [offer.image_url] : [])
  const [offerTypeLabel, setOfferTypeLabel] = useState(offer?.offer_type_label ?? '')
  const [validFrom, setValidFrom] = useState(toDateInputValue(offer?.valid_from ?? null))
  const [validUntil, setValidUntil] = useState(toDateInputValue(offer?.valid_until ?? null))
  const [memberOnly, setMemberOnly] = useState(offer?.member_only ?? false)
  const [pointsRequired, setPointsRequired] = useState(offer?.points_required?.toString() ?? '')
  const [imageUploading, setImageUploading] = useState(false)

  const selectedBusinessName = useMemo(() => businessOptions.data?.find(b => b.id === businessId)?.name ?? null, [businessOptions.data, businessId])

  async function handleImageChange(files: File[]) {
    if (!files.length || imageUploading) return
    if (imageUrls.length + files.length > 6) { toast.error(t('offers.form.galleryLimit')); return }
    setImageUploading(true)
    try {
      files.forEach(validateImageFile)
      for (const file of files) {
        const url = await uploadBusinessImage(file, businessId === NO_BUSINESS_VALUE ? 'general' : businessId, 'offers')
        setImageUrls(current => [...current, url])
      }
    } catch (error) {
      if (error instanceof ImageValidationError) toast.error(t(`businesses.form.imageErrors.${error.message}`))
      else toast.error((error as Error).message)
    } finally {
      setImageUploading(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (imageUploading || upsert.isPending) return
    try {
      const result = await upsert.mutateAsync({
        id: offer?.id ?? null,
        published: offer?.status === 'approved',
        payload: {
          business_id: businessId === NO_BUSINESS_VALUE ? null : businessId,
          title,
          description,
          terms,
          discount_type: discountType,
          discount_value: discountValue ? Number(discountValue) : null,
          original_price: originalPrice ? Number(originalPrice) : null,
          offer_price: offerPrice ? Number(offerPrice) : null,
          image_url: imageUrls[0] ?? null,
          image_urls: imageUrls,
          offer_type_label: offerTypeLabel.trim() || null,
          translations: offer?.translations,
          valid_from: validFrom ? new Date(validFrom).toISOString() : null,
          valid_until: validUntil ? new Date(validUntil).toISOString() : null,
          member_only: memberOnly,
          points_required: pointsRequired ? Number(pointsRequired) : null
        }
      })
      toast.success(t(isEdit ? 'offers.form.savedEdit' : 'offers.form.savedCreate'))
      navigate(`/offers/${result.id}`)
    } catch {
      // useUpsertOffer's onError already toasts the message
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <ContentTranslationNotice />
        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <h2 className="text-sm font-semibold text-foreground">{t('offers.form.sections.general')}</h2>
            <div className="flex flex-col gap-2">
              <Label>{t('offers.form.business')}</Label>
              <Select value={businessId} onValueChange={setBusinessId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('offers.form.selectBusiness')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_BUSINESS_VALUE}>{t('offers.form.noBusiness')}</SelectItem>
                  {(businessOptions.data ?? []).map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">{t('offers.form.title')}</Label>
              <Input id="title" required value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">{t('offers.form.description')}</Label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="terms">{t('offers.form.terms')}</Label>
              <textarea
                id="terms"
                value={terms}
                onChange={e => setTerms(e.target.value)}
                rows={2}
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <Label htmlFor="offer-image" className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
                  <Upload className="size-4" />
                  {t(imageUploading ? 'offers.form.uploadingImages' : 'offers.form.addImages')}
                </span>
              </Label>
              <input id="offer-image" type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" disabled={imageUploading || imageUrls.length >= 6} onChange={e => { void handleImageChange(Array.from(e.target.files ?? [])); e.target.value = '' }} />
              <p className="mt-2 text-xs text-muted-foreground" role="status">{t('offers.form.galleryHint', { count: imageUrls.length })}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {imageUrls.map((url, index) => (
                  <div key={url} className="flex flex-col gap-2 rounded-lg border border-border p-2">
                    <img src={url} alt={t('offers.form.imageNumber', { number: index + 1 })} className="aspect-square w-full rounded-md bg-white object-contain" />
                    <Button type="button" size="sm" variant={index === 0 ? 'secondary' : 'outline'} disabled={imageUploading || index === 0} onClick={() => setImageUrls(current => [url, ...current.filter(image => image !== url)])}>{t(index === 0 ? 'offers.form.coverImage' : 'offers.form.makeCover')}</Button>
                    <Button type="button" size="sm" variant="ghost" disabled={imageUploading} onClick={() => setImageUrls(current => current.filter(image => image !== url))}>{t('offers.form.removeImage')}</Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <h2 className="text-sm font-semibold text-foreground">{t('offers.form.sections.pricing')}</h2>
            <div className="flex flex-col gap-2">
              <Label htmlFor="offerTypeLabel">{t('offers.form.customType')}</Label>
              <Input id="offerTypeLabel" maxLength={80} value={offerTypeLabel} placeholder={t('offers.form.customTypePlaceholder')} onChange={e => setOfferTypeLabel(e.target.value)} />
              <p className="text-xs text-muted-foreground">{t('offers.form.customTypeHint')}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t('offers.form.pricingMethod')}</Label>
              <Select value={discountType} onValueChange={v => setDiscountType(v as OfferDiscountType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISCOUNT_TYPES.map(dt => (
                    <SelectItem key={dt} value={dt}>
                      {t(`offers.discountTypes.${dt}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="originalPrice">{t('offers.form.originalPrice')}</Label>
                <Input id="originalPrice" type="number" min="0" step="0.01" dir="ltr" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="offerPrice">{t('offers.form.offerPrice')}</Label>
                <Input id="offerPrice" type="number" min="0" step="0.01" dir="ltr" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="discountValue">{discountType === 'percentage' ? t('offers.form.discountPercentage') : t('offers.form.discountValue')}</Label>
                <Input id="discountValue" type="number" min="0" step="0.01" dir="ltr" value={discountValue} onChange={e => setDiscountValue(e.target.value)} disabled={discountType === 'free_benefit'} />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:w-1/3">
              <Label htmlFor="pointsRequired">{t('offers.form.pointsRequired')}</Label>
              <Input id="pointsRequired" type="number" min="0" step="1" dir="ltr" value={pointsRequired} onChange={e => setPointsRequired(e.target.value)} />
              <p className="text-xs text-muted-foreground">{t('offers.form.pointsRequiredHint')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 p-4">
            <h2 className="text-sm font-semibold text-foreground">{t('offers.form.sections.validity')}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="validFrom">{t('common.dateFrom')}</Label>
                <Input id="validFrom" type="date" dir="ltr" value={validFrom} onChange={e => setValidFrom(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="validUntil">{t('common.dateTo')}</Label>
                <Input id="validUntil" type="date" dir="ltr" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <h2 className="text-sm font-semibold text-foreground">{t('offers.form.sections.membership')}</h2>
            <div className="flex items-start gap-2">
              <Checkbox id="memberOnly" checked={memberOnly} onCheckedChange={checked => setMemberOnly(checked === true)} className="mt-0.5" />
              <div className="flex flex-col gap-1">
                <Label htmlFor="memberOnly" className="cursor-pointer font-normal">{t('offers.form.memberOnly')}</Label>
                <p className="text-xs text-muted-foreground">{t('offers.form.memberOnlyHint')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={upsert.isPending || imageUploading}>
            {t('common.save')}
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase text-muted-foreground">{t('offers.form.previewLabel')}</p>
        <OfferPreviewCard
          title={title}
          description={description}
          businessName={selectedBusinessName}
          imageUrl={imageUrls[0] ?? null}
          imageUrls={imageUrls}
          offerTypeLabel={offerTypeLabel}
          discountType={discountType}
          discountValue={discountValue ? Number(discountValue) : null}
          originalPrice={originalPrice ? Number(originalPrice) : null}
          offerPrice={offerPrice ? Number(offerPrice) : null}
          validUntil={validUntil || null}
          memberOnly={memberOnly}
        />
      </div>
    </div>
  )
}
