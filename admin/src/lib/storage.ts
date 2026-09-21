import { supabase } from './supabase'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export class ImageValidationError extends Error {}

export function validateImageFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ImageValidationError('invalidType')
  }
  if (file.size > MAX_BYTES) {
    throw new ImageValidationError('tooLarge')
  }
}

// Uploads to the business-photos bucket (public read, admin-only write -
// see the storage policies in 0015_businesses_offers_reviews.sql). Path is
// prefixed by businessId so removing a business's photos later is a single
// prefix-based list+remove, and collisions across businesses are
// impossible by construction.
export async function uploadBusinessImage(file: File, businessId: string, folder: 'logo' | 'photos' | 'offers') {
  validateImageFile(file)
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${folder}/${businessId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('business-photos').upload(path, file, { contentType: file.type })
  if (error) throw error
  return supabase.storage.from('business-photos').getPublicUrl(path).data.publicUrl
}

// Same validation/shape as uploadBusinessImage, targeting the separate
// `content` bucket (0023_admin_phase3_5.sql) used for admin-managed content
// (Perks banners today) rather than anything tied to a specific business.
//
// optimize: downscale anything larger than MAX_DIMENSION on its long side (or
// over ~1.5MB) to a JPEG first. Posters go to phones over mobile data; a
// 5MB original adds nothing there. Off by default so existing callers (the
// Perks banners) keep uploading exactly what the admin picked.
const MAX_DIMENSION = 1600
const OPTIMIZE_ABOVE_BYTES = 1.5 * 1024 * 1024

async function optimizeImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= OPTIMIZE_ABOVE_BYTES) {
      bitmap.close()
      return file
    }
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context) return file
    context.fillStyle = '#fff' // JPEG has no alpha; a transparent PNG would turn black
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return blob ? new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' }) : file
  } catch {
    // Couldn't decode/re-encode in this browser: the original is still valid.
    return file
  }
}

export async function uploadContentImage(file: File, folder: string, options: { optimize?: boolean } = {}) {
  validateImageFile(file)
  const upload = options.optimize ? await optimizeImage(file) : file
  const ext = upload.name.split('.').pop() ?? 'jpg'
  // Random suffix: several images uploaded in the same millisecond must not collide.
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`
  const { error } = await supabase.storage.from('content').upload(path, upload, { contentType: upload.type })
  if (error) throw error
  return supabase.storage.from('content').getPublicUrl(path).data.publicUrl
}

export async function removeBusinessImage(url: string) {
  const marker = '/business-photos/'
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const path = url.slice(idx + marker.length)
  await supabase.storage.from('business-photos').remove([path])
}
