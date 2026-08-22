import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { ImageValidationError } from '@/lib/storage'
import type { BusinessPhoto } from '@/types'
import { useAddBusinessPhoto, useRemoveBusinessPhoto } from './useBusinessPhotos'

export function BusinessPhotosManager({ businessId, photos }: { businessId: string; photos: BusinessPhoto[] }) {
  const { t } = useTranslation()
  const addPhoto = useAddBusinessPhoto(businessId)
  const removePhoto = useRemoveBusinessPhoto(businessId)
  const [uploading, setUploading] = useState(false)

  async function handleAdd(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      await addPhoto.mutateAsync({ file, sortOrder: photos.length })
    } catch (error) {
      if (error instanceof ImageValidationError) toast.error(t(`businesses.form.imageErrors.${error.message}`))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {photos.map(photo => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
            <img src={photo.url} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto.mutate({ id: photo.id, url: photo.url })}
              className="absolute end-1 top-1 rounded-full bg-background/90 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={t('common.close')}
            >
              <Trash2 className="size-4 text-destructive" />
            </button>
          </div>
        ))}
      </div>
      <div>
        <Label htmlFor="photo-upload" className="cursor-pointer">
          <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm">
            <Upload className="size-4" />
            {t('businesses.form.addPhoto')}
          </span>
        </Label>
        <input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={e => handleAdd(e.target.files?.[0])} />
      </div>
    </div>
  )
}
