export type MarketConfig = {
  countryCode: string
  currencyCode: string
  currencySymbol: string
  membershipPrice: number
  locale: string
}

export const MARKETS: Record<string, MarketConfig> = {
  JO: { countryCode: 'JO', currencyCode: 'JOD', currencySymbol: 'د.أ', membershipPrice: 14.99, locale: 'ar-JO' },
  IL: { countryCode: 'IL', currencyCode: 'ILS', currencySymbol: '₪', membershipPrice: 59, locale: 'he-IL' }
}

// Jerusalem pilot (Phase 2) - JO stays in the registry as proof the
// market-config pattern genuinely supports more than one market.
export const CURRENT_MARKET_CODE = 'IL'
export const CURRENT_MARKET = MARKETS[CURRENT_MARKET_CODE]!

export type MarketFeatureFlags = {
  sanadPlus: boolean
  partners: boolean
  rewards: boolean
  professionalBackup: boolean
  paidServices: boolean
}

export const MARKET_FEATURES: Record<string, MarketFeatureFlags> = {
  JO: { sanadPlus: true, partners: true, rewards: false, professionalBackup: true, paidServices: false },
  // Jerusalem pilot (Phase 2): community help + partners + volunteer
  // rewards only - no real SANAD+ payments or paid professional fallback yet.
  IL: { sanadPlus: false, partners: true, rewards: true, professionalBackup: false, paidServices: false }
}

export const CURRENT_MARKET_FEATURES = MARKET_FEATURES[CURRENT_MARKET_CODE]!
