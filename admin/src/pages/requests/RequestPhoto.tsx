import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/useAuth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { requestPhotoCopy } from '../../../../shared/requestPhotos'
import { useRequestPhoto } from '../../../../shared/useRequestPhoto'

export function RequestPhoto({ reference }: { reference: string }) {
  const { state } = useAuth()
  const { i18n } = useTranslation()
  const copy = requestPhotoCopy(i18n.resolvedLanguage ?? i18n.language)
  const photo = useRequestPhoto(supabase, import.meta.env.VITE_SUPABASE_URL, reference, state.status === 'admin' ? state.session.user.id : null)
  if (state.status !== 'admin') return null
  if (photo.url) return <img key={photo.url} src={photo.url} alt={copy.label} referrerPolicy="no-referrer" onError={photo.onImageError} className="max-h-72 rounded-lg border border-border object-cover" />
  return <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-border p-4 text-sm text-muted-foreground" role="status">
    {photo.loading ? copy.loading : <>{copy.unavailable}<Button variant="outline" onClick={photo.retry}>{copy.retry}</Button></>}
  </div>
}
