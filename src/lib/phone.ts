import { parsePhoneNumberFromString } from 'libphonenumber-js'

export function normalizePhone(input: string, defaultCountry: 'IL' | 'JO' = 'IL'): string | null {
  const parsed = parsePhoneNumberFromString(input, defaultCountry)
  if (!parsed || !parsed.isValid()) return null
  return parsed.format('E.164')
}
