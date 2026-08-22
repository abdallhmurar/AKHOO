import { normalizePhone } from './phone'

// Admin's business form stores phone/whatsapp as free-text with no format
// validation (admin/src/pages/businesses/BusinessForm.tsx), so this can't
// assume a clean E.164 string - normalize first, and fall back to a
// digits-only strip rather than refusing to link at all.
function digitsOnly(input: string) {
  return input.replace(/[^\d+]/g, '')
}

export function telHref(phone: string): string {
  const normalized = normalizePhone(phone) ?? digitsOnly(phone)
  return `tel:${normalized}`
}

export function whatsappHref(phone: string): string {
  const normalized = normalizePhone(phone) ?? digitsOnly(phone)
  return `https://wa.me/${normalized.replace(/^\+/, '')}`
}

export function directionsHref(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
}
