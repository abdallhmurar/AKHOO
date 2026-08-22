import type { BusinessCategory } from '@/types'

// Single source of truth for business categories - every filter dropdown,
// create/edit form, and table badge reads from this list rather than
// duplicating the category set (and its i18n keys) per screen. Mirrors the
// partners_category_check constraint in
// supabase/migrations/0015_businesses_offers_reviews.sql exactly.
export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  'towing',
  'workshop',
  'mobile_mechanic',
  'tire',
  'battery',
  'auto_electrician',
  'inspection',
  'car_wash',
  'maintenance',
  'locksmith',
  'other'
]

export const BUSINESS_CATEGORY_LABEL_KEYS: Record<BusinessCategory, string> = {
  towing: 'businesses.categories.towing',
  workshop: 'businesses.categories.workshop',
  mobile_mechanic: 'businesses.categories.mobileMechanic',
  tire: 'businesses.categories.tire',
  battery: 'businesses.categories.battery',
  auto_electrician: 'businesses.categories.autoElectrician',
  inspection: 'businesses.categories.inspection',
  car_wash: 'businesses.categories.carWash',
  maintenance: 'businesses.categories.maintenance',
  locksmith: 'businesses.categories.locksmith',
  other: 'businesses.categories.other'
}
