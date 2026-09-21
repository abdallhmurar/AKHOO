import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Bell, ImagePlus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, TablePagination } from '@/components/DataTable'
import type { Column } from '@/components/DataTable'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { ImageValidationError, uploadContentImage, validateImageFile } from '@/lib/storage'
import type { BroadcastNotification, NotificationAudience } from '@/types'
import { useNotifications } from './useNotifications'
import { useRetryNotification, useSendNotification } from './useSendNotification'
import { AnnouncementPreview } from './AnnouncementPreview'

const MAX_IMAGES = 5
// Mirrors truncateForPush in supabase/functions/_shared/push.ts: past this a phone notification is cut.
const PUSH_PREVIEW_CHARS = 160

type ImageDraft = { id: string; file: File; preview: string }

function ComposeCard() {
  const { t } = useTranslation()
  const send = useSendNotification()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [details, setDetails] = useState('')
  const [audience, setAudience] = useState<NotificationAudience>('all')
  const [images, setImages] = useState<ImageDraft[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const imagesRef = useRef(images)
  imagesRef.current = images

  // Object URLs are only for the local preview; release them on unmount.
  useEffect(() => () => imagesRef.current.forEach(image => URL.revokeObjectURL(image.preview)), [])

  function addFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const room = MAX_IMAGES - images.length
    if (files.length > room) toast.error(t('notifications.compose.maxImages'))
    const accepted: ImageDraft[] = []
    for (const file of Array.from(files).slice(0, Math.max(room, 0))) {
      try {
        validateImageFile(file)
        accepted.push({ id: crypto.randomUUID(), file, preview: URL.createObjectURL(file) })
      } catch (error) {
        if (error instanceof ImageValidationError) toast.error(`${file.name}: ${t(`businesses.form.imageErrors.${error.message}`)}`)
      }
    }
    setImages(current => [...current, ...accepted])
    if (fileInput.current) fileInput.current.value = ''
  }

  function removeImage(id: string) {
    setImages(current => {
      const removed = current.find(image => image.id === id)
      if (removed) URL.revokeObjectURL(removed.preview)
      return current.filter(image => image.id !== id)
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    // Upload first: if any image fails nothing has been created or sent yet.
    let imageUrls: string[] = []
    if (images.length > 0) {
      setUploading(true)
      try {
        imageUrls = await Promise.all(images.map(image => uploadContentImage(image.file, 'announcements', { optimize: true })))
      } catch (error) {
        toast.error((error as Error).message)
        return
      } finally {
        setUploading(false)
      }
    }

    try {
      const result = await send.mutateAsync({ title, body, details, audience, imageUrls })
      if (result.deliveryComplete) toast.success(t('notifications.compose.sent'))
      else toast.warning(t('notifications.delivery.incomplete'))
      images.forEach(image => URL.revokeObjectURL(image.preview))
      setImages([])
      setTitle('')
      setBody('')
      setDetails('')
    } catch {
      // useSendNotification's onError already toasts the message
    }
  }

  const busy = uploading || send.isPending

  return (
    <Card>
      <CardContent className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-teal" />
            <h2 className="text-sm font-semibold text-foreground">{t('notifications.compose.title')}</h2>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="notif-title">{t('notifications.compose.titleField')}</Label>
              <Input id="notif-title" required value={title} onChange={e => setTitle(e.target.value)} maxLength={80} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notif-body">{t('notifications.compose.bodyField')}</Label>
              <textarea
                id="notif-body"
                required
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={3}
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className={`text-xs ${Array.from(body).length > PUSH_PREVIEW_CHARS ? 'text-sanad-warning' : 'text-muted-foreground'}`}>
                {Array.from(body).length > PUSH_PREVIEW_CHARS ? t('notifications.compose.bodyHintLong', { max: PUSH_PREVIEW_CHARS }) : t('notifications.compose.bodyHint', { max: PUSH_PREVIEW_CHARS })}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notif-details">{t('notifications.compose.detailsField')}</Label>
              <textarea
                id="notif-details"
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={6}
                className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">{t('notifications.compose.detailsHint')}</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('notifications.compose.images')}</Label>
              <p className="text-xs text-muted-foreground">{t('notifications.compose.imagesHint', { max: MAX_IMAGES })}</p>
              <div className="flex flex-wrap items-center gap-2">
                {images.map(image => (
                  <div key={image.id} className="relative size-20 overflow-hidden rounded-lg border border-border bg-secondary">
                    <img src={image.preview} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(image.id)}
                      disabled={busy}
                      aria-label={t('notifications.compose.removeImage')}
                      className="absolute end-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/65 text-white hover:bg-black"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                {images.length < MAX_IMAGES ? (
                  <>
                    <Button type="button" variant="outline" className="h-20 w-20 flex-col gap-1 border-dashed text-xs" disabled={busy} onClick={() => fileInput.current?.click()}>
                      <ImagePlus className="size-5" />
                      {t('notifications.compose.addImages')}
                    </Button>
                    <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:w-64">
              <Label>{t('notifications.compose.audience')}</Label>
              <Select value={audience} onValueChange={v => setAudience(v as NotificationAudience)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('notifications.compose.audienceAll')}</SelectItem>
                  <SelectItem value="volunteers">{t('notifications.compose.audienceVolunteers')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button type="submit" disabled={busy || !title.trim() || !body.trim()}>
                {uploading ? t('notifications.compose.uploading') : t('notifications.compose.send')}
              </Button>
            </div>
          </form>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{t('notifications.compose.previewTitle')}</p>
          <AnnouncementPreview title={title} body={body} details={details} images={images.map(image => image.preview)} />
          <p className="text-xs text-muted-foreground">{t('notifications.compose.previewHint')}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function NotificationsPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(0)
  const query = useNotifications(page)
  const retry = useRetryNotification()

  const columns: Column<BroadcastNotification>[] = [
    { key: 'title', header: t('notifications.table.title'), cell: row => row.title },
    {
      key: 'images',
      header: t('notifications.table.images'),
      cell: row =>
        row.image_urls?.length ? (
          <div className="flex items-center gap-1">
            {row.image_urls.slice(0, 3).map(url => (
              <img key={url} src={url} alt="" className="size-9 rounded-md border border-border object-cover" />
            ))}
            {row.image_urls.length > 3 ? <span className="text-xs text-muted-foreground" dir="ltr">+{row.image_urls.length - 3}</span> : null}
          </div>
        ) : (
          '—'
        )
    },
    { key: 'audience', header: t('notifications.table.audience'), cell: row => (row.target_audience === 'all' ? t('notifications.compose.audienceAll') : t('notifications.compose.audienceVolunteers')) },
    { key: 'sentCount', header: t('notifications.table.sentCount'), cell: row => row.sent_count },
    { key: 'status', header: t('notifications.delivery.status'), cell: row => t(`notifications.delivery.${row.delivery_status}`) },
    { key: 'retry', header: '', cell: row => !row.sent_at && row.delivery_status !== 'sending' ? <Button size="sm" variant="outline" disabled={retry.isPending} onClick={() => {
      retry.mutate(row.id, { onSuccess: result => result.complete ? toast.success(t('notifications.compose.sent')) : toast.warning(t('notifications.delivery.incomplete')), onError: () => toast.error(t('notifications.delivery.incomplete')) })
    }}>{t('notifications.delivery.retry')}</Button> : null },
    { key: 'date', header: t('notifications.table.date'), cell: row => (row.sent_at ? new Date(row.sent_at).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }) : '—') }
  ]

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">{t('notifications.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('notifications.subtitle')}</p>
      </div>
      <ComposeCard />
      <DataTable columns={columns} rows={query.data?.rows ?? []} isLoading={query.isPending} isError={query.isError} getRowId={row => row.id} />
      <TablePagination page={page} pageSize={DEFAULT_PAGE_SIZE} total={query.data?.total ?? 0} onPageChange={setPage} />
    </div>
  )
}
