export type PartnerDraft = { business: string; category: number; city: string; phone: string; offer: string }
export const emptyPartnerDraft: PartnerDraft = { business: '', category: -1, city: '', phone: '', offer: '' }

export function normalizePartnerPhone(value: string) {
  return value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : 0x6f0))).replace(/[\s()-]/g, '')
}

export function partnerDraftErrors(draft: PartnerDraft) {
  const errors: (keyof Omit<PartnerDraft, 'offer'>)[] = []
  if (draft.business.trim().length < 2 || draft.business.length > 80) errors.push('business')
  if (!Number.isInteger(draft.category) || draft.category < 0 || draft.category > 4) errors.push('category')
  if (draft.city.trim().length < 2 || draft.city.length > 60) errors.push('city')
  const phone = normalizePartnerPhone(draft.phone)
  if (!/^\+?\d{8,15}$/.test(phone) || /^(\d)\1+$/.test(phone.replace(/^\+/, ''))) errors.push('phone')
  return errors
}

// Height here is the actual content area, after safe areas and the tab bar.
// On small windows use text-only actions rather than clipping controls or scrolling.
export function partnerHomeLayout(height: number, activeMission: boolean, fontScale: number) {
  const compact = height < 540 || fontScale > 1.25
  const minimal = height < 440 || fontScale > 1.65
  const gap = height < 440 ? 6 : 10
  const resume = activeMission ? 48 : 0
  const banner = minimal ? 72 : compact ? 112 : 138
  const rewards = minimal ? 64 : 78
  const card = Math.max(44, (height - banner - rewards - resume - gap * (activeMission ? 4 : 3)) / 2)
  return { compact, minimal, gap, resume, banner, rewards, card }
}
