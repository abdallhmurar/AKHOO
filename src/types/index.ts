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
  /** Additive SANAD V2 fields; optional while older deployments roll out. */
  category_id?: string | null
  scenario_id?: string | null
  urgency?: 'standard' | 'urgent' | 'emergency_redirected'
  location_accuracy?: number | null
  location_label?: string | null
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
}

export type VolunteerPointTransaction = {
  id: string
  volunteer_id: string
  request_id: string
  points: number
  reason: 'completed_verified_mission'
  created_at: string
}

export type MembershipStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'failed'

export type Membership = {
  id: string
  user_id: string
  plan: 'sanad_plus'
  market: string
  currency: string
  amount: number
  status: MembershipStatus
  starts_at: string | null
  expires_at: string | null
  auto_renew: boolean
  payment_provider: string | null
  provider_subscription_id: string | null
  created_at: string
  updated_at: string
}

export type PartnerCategory = 'battery' | 'tire' | 'maintenance' | 'towing' | 'locksmith' | 'mobile_mechanic' | 'workshop' | 'auto_electrician' | 'car_wash' | 'inspection' | 'other'

export type PartnerStatus = 'pending' | 'verified' | 'suspended' | 'rejected'

export type OpeningHours = Partial<Record<'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat', string>>

export type Partner = {
  id: string
  name: string
  slug: string
  category: PartnerCategory
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
  status: PartnerStatus
  is_active: boolean
  commission_type: 'none' | 'fixed' | 'percentage'
  commission_value: number
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

export type PartnerOffer = {
  id: string
  partner_id: string
  title: string
  description: string | null
  discount_type: OfferDiscountType
  discount_value: number | null
  original_price: number | null
  offer_price: number | null
  image_url: string | null
  member_only: boolean
  valid_from: string | null
  valid_until: string | null
  terms: string | null
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

export type RedemptionStatus = 'active' | 'redeemed' | 'expired' | 'cancelled'

export type OfferRedemption = {
  id: string
  offer_id: string
  partner_id: string
  user_id: string
  code: string
  status: RedemptionStatus
  created_at: string
  expires_at: string
  redeemed_at: string | null
}
