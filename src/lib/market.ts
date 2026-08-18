export type MarketConfig = {
  countryCode: string
  currencyCode: string
  currencySymbol: string
  membershipPrice: number
  locale: string
}

export const MARKETS: Record<string, MarketConfig> = {
  JO: { countryCode: 'JO', currencyCode: 'JOD', currencySymbol: 'د.أ', membershipPrice: 14.99, locale: 'ar-JO' }
}

export const CURRENT_MARKET_CODE = 'JO'
export const CURRENT_MARKET = MARKETS[CURRENT_MARKET_CODE]!

export type MarketFeatureFlags = { sanadPlus: boolean; partners: boolean; professionalBackup: boolean }

export const MARKET_FEATURES: Record<string, MarketFeatureFlags> = {
  JO: { sanadPlus: true, partners: true, professionalBackup: true }
}

export const CURRENT_MARKET_FEATURES = MARKET_FEATURES[CURRENT_MARKET_CODE]!
