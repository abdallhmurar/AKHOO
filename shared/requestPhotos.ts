export const REQUEST_PHOTO_BUCKET = 'request-photos'
export const REQUEST_PHOTO_TTL_SECONDS = 300

export type RequestPhotoClient = {
  storage: {
    from(bucket: string): {
      createSignedUrl(path: string, expiresIn: number): Promise<{
        data: { signedUrl: string } | null
        error: unknown
      }>
    }
  }
}

/** Old photo_url values remain valid references, but are never image sources. */
export function requestPhotoPath(reference: string | null | undefined, supabaseUrl: string): string | null {
  if (!reference || !supabaseUrl) return null
  const prefix = `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${REQUEST_PHOTO_BUCKET}/`
  const path = reference.startsWith(prefix) ? reference.slice(prefix.length) : reference
  // All released uploaders use <user UUID>/<timestamp>.jpg. Also allow safe
  // nested object paths, but never foreign URLs, query strings or traversal.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[A-Za-z0-9_./-]+$/i.test(path)) return null
  if (path.split('/').some(part => !part || part === '.' || part === '..')) return null
  return path
}

export async function signRequestPhoto(client: RequestPhotoClient, supabaseUrl: string, reference: string) {
  const path = requestPhotoPath(reference, supabaseUrl)
  if (!path) throw new Error('Request photo unavailable')
  const startedAt = Date.now()
  const { data, error } = await client.storage.from(REQUEST_PHOTO_BUCKET).createSignedUrl(path, REQUEST_PHOTO_TTL_SECONDS)
  // Do not propagate Storage errors with paths/tokens into client diagnostics.
  if (error || !data?.signedUrl) throw new Error('Request photo unavailable')
  return { url: data.signedUrl, expiresAt: startedAt + REQUEST_PHOTO_TTL_SECONDS * 1000 }
}

export function requestPhotoCopy(language: string) {
  if (language.startsWith('he')) return { label: 'תמונת הבקשה', loading: 'טוען תמונה…', unavailable: 'לא ניתן לטעון את התמונה כרגע', retry: 'נסה שוב' }
  if (language.startsWith('en')) return { label: 'Request photo', loading: 'Loading photo…', unavailable: 'The photo is unavailable right now', retry: 'Try again' }
  return { label: 'صورة الطلب', loading: 'عم نحمّل الصورة…', unavailable: 'مش قادرين نفتح الصورة هلا', retry: 'جرّب كمان مرة' }
}
