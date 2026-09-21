import { useTranslation } from 'react-i18next'
import { Bell, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useIsRTL } from '@/lib/direction'

// A visual stand-in for what the mobile app shows (src/features/announcements/
// AnnouncementPopup.tsx): same structure - poster on top, bell + title, the
// message, then "View now" / "Later". It renders the same fields the admin is
// typing, so what they see here is what users get. Colors are the app's
// (emergency coral for the primary action), not the admin panel's teal.
export function AnnouncementPreview({ title, body, details, images }: { title: string; body: string; details: string; images: string[] }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const Chevron = isRTL ? ChevronLeft : ChevronRight

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
    <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-xl">
      {images.length > 0 ? (
        <div className="relative flex h-48 items-center justify-center bg-secondary">
          <img src={images[0]} alt="" className="size-full object-contain" />
          {images.length > 1 ? (
            <span className="absolute bottom-2 end-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white" dir="ltr">
              1 / {images.length}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sanad-dangerSoft text-sanad-danger">
              <Bell className="size-5" />
            </span>
            <p className="min-w-0 break-words text-lg font-extrabold leading-snug text-foreground">{title || t('notifications.preview.titlePlaceholder')}</p>
          </div>
          <X className="mt-1 size-5 shrink-0 text-muted-foreground" />
        </div>

        <p className="line-clamp-6 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{body || t('notifications.preview.bodyPlaceholder')}</p>

        <div className="mt-1 flex gap-3">
          <span className="flex h-11 flex-1 items-center justify-center gap-1 rounded-2xl bg-sanad-danger text-sm font-bold text-white">
            {t('notifications.preview.viewNow')}
            <Chevron className="size-4" />
          </span>
          <span className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-secondary text-sm font-bold text-foreground">{t('notifications.preview.later')}</span>
        </div>
      </div>
    </div>

    {details.trim() ? (
      <div className="rounded-2xl border border-dashed border-border bg-white p-4">
        <p className="mb-2 text-[11px] font-bold uppercase text-muted-foreground">{t('notifications.preview.detailsLabel')}</p>
        <p className="max-h-48 overflow-y-auto whitespace-pre-line break-words text-sm leading-relaxed text-foreground">{details}</p>
      </div>
    ) : null}
    </div>
  )
}
