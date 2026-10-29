// Validation and the notification text for partner applications (submit-partner-application). Pure functions, no
// Deno APIs, so the unit tests under src/lib can import them.
export type PartnerApplicationRow = {
  business_name: string
  category: number
  city: string
  phone: string
  offer: string
  language: 'ar' | 'en' | 'he'
  source: 'web' | 'ios' | 'android'
}

export type ParsedApplication = { ok: true; value: PartnerApplicationRow } | { ok: false; field: string }

// Same order as the categories in src/features/home/partnerBetaCopy.ts.
const categoryLabels = ['خدمات سيارات', 'مطاعم وكافيهات', 'محلات ومتاجر', 'خدمات مهنية', 'مجال ثاني']
const sourceLabels = { web: 'تطبيق الويب', ios: 'آيفون', android: 'أندرويد' } as const
const languages = ['ar', 'en', 'he']
const sources = ['web', 'ios', 'android']

export function normalizePhone(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : 0x6f0))).replace(/[\s()-]/g, '')
}

const text = (value: unknown) => (typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim() : '')

export function parsePartnerApplication(body: unknown): ParsedApplication {
  if (!body || typeof body !== 'object') return { ok: false, field: 'body' }
  const input = body as Record<string, unknown>
  const business = text(input.business)
  if (business.length < 2 || business.length > 80) return { ok: false, field: 'business' }
  const category = input.category
  if (typeof category !== 'number' || !Number.isInteger(category) || category < 0 || category > 4) return { ok: false, field: 'category' }
  const city = text(input.city)
  if (city.length < 2 || city.length > 60) return { ok: false, field: 'city' }
  const phone = typeof input.phone === 'string' ? normalizePhone(input.phone) : ''
  if (!/^\+?\d{8,15}$/.test(phone) || /^(\d)\1+$/.test(phone.replace(/^\+/, ''))) return { ok: false, field: 'phone' }
  const offer = text(input.offer)
  if (offer.length > 280) return { ok: false, field: 'offer' }
  const language = typeof input.language === 'string' && languages.includes(input.language) ? input.language as PartnerApplicationRow['language'] : 'ar'
  const source = typeof input.source === 'string' && sources.includes(input.source) ? input.source as PartnerApplicationRow['source'] : 'web'
  return { ok: true, value: { business_name: business, category, city, phone, offer, language, source } }
}

// Plain text only: the fields come from the public, so nothing is put into HTML or into a header unescaped.
export function applicationEmail(row: PartnerApplicationRow) {
  const oneLine = (value: string) => value.replace(/\s+/g, ' ').slice(0, 80)
  return {
    subject: `طلب شراكة جديد: ${oneLine(row.business_name)}`,
    text: [
      'وصل طلب شراكة جديد من التطبيق.',
      '',
      `اسم المصلحة: ${row.business_name}`,
      `المجال: ${categoryLabels[row.category] ?? row.category}`,
      `المدينة: ${row.city}`,
      `رقم التواصل: ${row.phone}`,
      `شو بتحب تقدّم: ${row.offer || '—'}`,
      `لغة المتقدم: ${row.language}`,
      `من وين: ${sourceLabels[row.source]}`,
      '',
      'كل الطلبات موجودة بلوحة التحكم، قسم "طلبات الشراكة".'
    ].join('\n')
  }
}
