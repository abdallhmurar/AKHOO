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

export async function removeBusinessImage(url: string) {
  const marker = '/business-photos/'
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const path = url.slice(idx + marker.length)
  await supabase.storage.from('business-photos').remove([path])
}
