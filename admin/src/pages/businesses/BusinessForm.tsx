import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ImageOff, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { BUSINESS_CATEGORIES, BUSINESS_CATEGORY_LABEL_KEYS } from '@/lib/categories'
import { uploadBusinessImage, ImageValidationError } from '@/lib/storage'
import type { Business, OpeningHours } from '@/types'
import { useUpsertBusiness } from './useUpsertBusiness'
import { BusinessLocationMap } from './BusinessLocationMap'

const DAYS: (keyof OpeningHours)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export function BusinessForm({ business }: { business?: Business }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const upsert = useUpsertBusiness()
  const isEdit = !!business

  const [name, setName] = useState(business?.name ?? '')
  const [category, setCategory] = useState(business?.category ?? 'other')
  const [description, setDescription] = useState(business?.description ?? '')
  const [phone, setPhone] = useState(business?.phone ?? '')
  const [whatsapp, setWhatsapp] = useState(business?.whatsapp ?? '')
  const [address, setAddress] = useState(business?.address ?? '')
  const [serviceArea, setServiceArea] = useState(business?.service_area ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(business?.website_url ?? '')
  const [socialUrl, setSocialUrl] = useState(business?.social_url ?? '')
  const [logoUrl, setLogoUrl] = useState(business?.logo_url ?? null)
  const [lat, setLat] = useState<number | null>(business?.latitude ?? null)
  const [lng, setLng] = useState<number | null>(business?.longitude ?? null)
  const [hours, setHours] = useState<OpeningHours>(business?.opening_hours ?? {})
  const [logoUploading, setLogoUploading] = useState(false)

  async function handleLogoChange(file: File | undefined) {
    if (!file) return
    setLogoUploading(true)
    try {
      const url = await uploadBusinessImage(file, business?.id ?? 'new', 'logo')
      setLogoUrl(url)
    } catch (error) {
      if (error instanceof ImageValidationError) {
        toast.error(t(`businesses.form.imageErrors.${error.message}`))
      } else {
        toast.error((error as Error).message)
      }
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      const result = await upsert.mutateAsync({
        id: business?.id ?? null,
        payload: {
          name,
          category,
          description,
          phone,
          whatsapp,
          address,
          latitude: lat,
          longitude: lng,
          service_area: serviceArea,
          opening_hours: Object.keys(hours).length ? hours : null,
          website_url: websiteUrl,
          social_url: socialUrl,
          logo_url: logoUrl
        }
      })
      toast.success(t(isEdit ? 'businesses.form.savedEdit' : 'businesses.form.savedCreate'))
      navigate(`/businesses/${result.id}`)
    } catch {
      // useUpsertBusiness's onError already toasts the message
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <h2 className="text-sm font-semibold text-foreground">{t('businesses.form.sections.general')}</h2>
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-lg">
              <AvatarImage src={logoUrl ?? undefined} className="object-cover" />
              <AvatarFallback className="rounded-lg">
                <ImageOff className="size-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <Label htmlFor="logo-upload" className="cursor-pointer">
                <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
                  <Upload className="size-4" />
                  {t('businesses.form.uploadLogo')}
                </span>
              </Label>
              <input id="logo-upload" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={logoUploading} onChange={e => handleLogoChange(e.target.files?.[0])} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t('businesses.form.name')}</Label>
              <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t('businesses.form.category')}</Label>
              <Select value={category} onValueChange={v => setCategory(v as Business['category'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {t(BUSINESS_CATEGORY_LABEL_KEYS[cat])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="description">{t('businesses.form.description')}</Label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <h2 className="text-sm font-semibold text-foreground">{t('businesses.form.sections.contact')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">{t('businesses.form.phone')}</Label>
              <Input id="phone" dir="ltr" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="whatsapp">{t('businesses.form.whatsapp')}</Label>
              <Input id="whatsapp" dir="ltr" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="website">{t('businesses.form.website')}</Label>
              <Input id="website" dir="ltr" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="social">{t('businesses.form.social')}</Label>
              <Input id="social" dir="ltr" value={socialUrl} onChange={e => setSocialUrl(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <h2 className="text-sm font-semibold text-foreground">{t('businesses.form.sections.location')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">{t('businesses.form.address')}</Label>
              <Input id="address" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="serviceArea">{t('businesses.form.serviceArea')}</Label>
              <Input id="serviceArea" value={serviceArea} onChange={e => setServiceArea(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('businesses.form.mapHint')}</p>
          <BusinessLocationMap latitude={lat} longitude={lng} editable onChange={(newLat, newLng) => { setLat(newLat); setLng(newLng) }} />
          {lat != null && lng != null ? (
            <p className="text-xs text-muted-foreground" dir="ltr">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <h2 className="text-sm font-semibold text-foreground">{t('businesses.form.sections.hours')}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {DAYS.map(day => (
              <div key={day} className="flex items-center gap-3">
                <Label className="w-20 shrink-0">{t(`businesses.form.days.${day}`)}</Label>
                <Input
                  placeholder={t('businesses.form.hoursPlaceholder')}
                  value={hours[day] ?? ''}
                  onChange={e => setHours(prev => ({ ...prev, [day]: e.target.value || undefined }))}
                  dir="ltr"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={upsert.isPending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
