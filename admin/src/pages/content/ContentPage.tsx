import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ImageOff, Upload } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { ErrorState } from '@/components/ErrorState'
import { uploadContentImage, ImageValidationError } from '@/lib/storage'
import type { ContentBannerLanguage, ContentBannerSlot } from '@/types'
import { useContentBanners } from './useContentBanners'
import { useUpsertContentBanner } from './useUpsertContentBanner'

const SLOTS: ContentBannerSlot[] = ['perks_header', 'perks_promax']
const LANGUAGES: ContentBannerLanguage[] = ['ar', 'he', 'en']

function BannerCell({ slot, language, imageUrl, isActive }: { slot: ContentBannerSlot; language: ContentBannerLanguage; imageUrl: string | null; isActive: boolean }) {
  const { t } = useTranslation()
  const upsert = useUpsertContentBanner()
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadContentImage(file, `${slot}/${language}`)
      await upsert.mutateAsync({ slot, language, imageUrl: url, isActive: true })
      toast.success(t('content.saved'))
    } catch (error) {
      if (error instanceof ImageValidationError) toast.error(t(`businesses.form.imageErrors.${error.message}`))
    } finally {
      setUploading(false)
    }
  }

  async function handleToggle(checked: boolean) {
    if (!imageUrl) return
    await upsert.mutateAsync({ slot, language, imageUrl, isActive: checked })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <p className="text-sm font-semibold text-foreground">{t(`content.languages.${language}`)}</p>
        <div className="flex h-28 items-center justify-center overflow-hidden rounded-md bg-secondary">
          {imageUrl ? <img src={imageUrl} alt="" className="size-full object-cover" /> : <ImageOff className="size-6 text-muted-foreground" />}
        </div>
        <div>
          <Label htmlFor={`banner-${slot}-${language}`} className="cursor-pointer">
            <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
              <Upload className="size-4" />
              {t('content.upload')}
            </span>
          </Label>
          <input id={`banner-${slot}-${language}`} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={e => handleFile(e.target.files?.[0])} />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id={`active-${slot}-${language}`} checked={isActive} disabled={!imageUrl} onCheckedChange={checked => handleToggle(checked === true)} />
          <Label htmlFor={`active-${slot}-${language}`} className="cursor-pointer font-normal">{isActive ? t('content.active') : t('content.inactive')}</Label>
        </div>
      </CardContent>
    </Card>
  )
}

export function ContentPage() {
  const { t } = useTranslation()
  const query = useContentBanners()

  if (query.isPending) return <FullPageSpinner />
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} />

  const byKey = new Map(query.data.map(b => [`${b.slot}:${b.language}`, b]))

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('content.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('content.subtitle')}</p>
      </div>
      <p className="text-xs text-muted-foreground">{t('content.fallbackHint')}</p>
      {SLOTS.map(slot => (
        <div key={slot} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">{t(`content.slots.${slot}`)}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {LANGUAGES.map(language => {
              const row = byKey.get(`${slot}:${language}`)
              return <BannerCell key={language} slot={slot} language={language} imageUrl={row?.image_url ?? null} isActive={row?.is_active ?? false} />
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
