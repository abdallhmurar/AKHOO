// Mirrors ../../../src/types/index.ts's relevant subset (same reasoning as
// activityLevel.ts - cross-project imports aren't possible between two
// separately-deployed npm packages).
import type { AuditAction, AuditTargetType } from '@/lib/auditActions'

export type ServiceType = 'battery' | 'tire' | 'fuel' | 'locked_car' | 'other'
export type RequestStatus = 'open' | 'accepted' | 'on_the_way' | 'arrived' | 'awaiting_confirmation' | 'completed' | 'cancelled'

export type HelpRequest = {
  id: string
  requester_id: string
  service_type: ServiceType
  note: string | null
  latitude: number
  longitude: number
  status: RequestStatus
  volunteer_id: string | null
  created_at: string
  accepted_at: string | null
  completed_at: string | null
  photo_url: string | null
  awaiting_confirmation_at: string | null
  confirmation_rejected_at: string | null
}

export type Profile = {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  is_admin: boolean
  is_banned: boolean
  created_at: string
}

export type VolunteerProfile = {
  user_id: string
  is_available: boolean
  latitude: number | null
  longitude: number | null
  services: ServiceType[]
  is_verified: boolean
  updated_at: string
}

export type VolunteerPointTransaction = {
  id: string
  volunteer_id: string
  request_id: string
  points: number
  reason: 'completed_verified_mission'
  created_at: string
}

export type HelpRequestRelease = {
  id: string
  request_id: string
  volunteer_id: string
  reason: 'cannot_reach' | 'emergency' | 'accepted_by_mistake' | 'other' | null
  released_at: string
}

export type AdminAuditLog = {
  id: string
  admin_id: string | null
  action: AuditAction
  target_type: AuditTargetType
  target_id: string
  target_label: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ── Round 2: Businesses / Offers / Reviews ──────────────────────────────
// The underlying tables are still named partners/partner_offers (see
// supabase/migrations/0015_businesses_offers_reviews.sql's header for why
// they weren't renamed) - "Business"/"Offer" is this app's own presentation
// terminology, applied consistently from here down.

export type BusinessCategory =
  | 'battery'
  | 'tire'
  | 'maintenance'
  | 'towing'
  | 'locksmith'
  | 'mobile_mechanic'
  | 'workshop'
  | 'auto_electrician'
  | 'car_wash'
  | 'inspection'
  | 'other'

export type BusinessStatus = 'pending' | 'verified' | 'suspended' | 'rejected'

export type OpeningHours = Partial<Record<'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat', string>>

export type Business = {
  id: string
  name: string
  slug: string
  category: BusinessCategory
  description: string | null
  logo_url: string | null
  phone: string | null
  whatsapp: string | null
  latitude: number | null
  longitude: number | null
  address: string | null
  service_area: string | null
  opening_hours: OpeningHours | null
  website_url: string | null
  social_url: string | null
  market: string
  status: BusinessStatus
  is_active: boolean
  created_at: string
  updated_at: string
}

export type BusinessPhoto = {
  id: string
  business_id: string
  url: string
  sort_order: number
  created_at: string
}

export type OfferDiscountType = 'percentage' | 'fixed' | 'special_price' | 'free_benefit'
export type OfferStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'paused' | 'expired'

export type Offer = {
  id: string
  partner_id: string
  title: string
  description: string | null
  terms: string | null
  discount_type: OfferDiscountType
  discount_value: number | null
  original_price: number | null
  offer_price: number | null
  image_url: string | null
  member_only: boolean
  valid_from: string | null
  valid_until: string | null
  status: OfferStatus
  created_at: string
  updated_at: string
}

export type Review = {
  id: string
  business_id: string
  user_id: string
  rating: number
  comment: string | null
  is_hidden: boolean
  created_at: string
}

export type BusinessRating = {
  business_id: string
  average_rating: number
  review_count: number
}

export type DashboardMetrics = {
  total_users: number
  banned_users: number
  open_requests: number
  active_requests: number
  awaiting_confirmation_requests: number
  completed_today: number
  completed_this_week: number
  cancelled_total: number
  active_volunteers: number
  total_volunteers: number
  verified_volunteers: number
  total_confirmed_assists: number
  total_points_awarded: number
}
