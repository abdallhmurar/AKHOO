import type { HelpRequest, RequestStatus } from '../types'

export type SupportedLanguage = 'ar' | 'he' | 'en'

export type CommunityCategorySlug =
  | 'mobility'
  | 'errands'
  | 'home-support'
  | 'accessibility'
  | 'accompaniment'
  | 'language-help'
  | 'digital-help'
  | 'community-response'
  | 'other'

export type LocalizedText = {
  ar: string
  he: string
  en: string
}

export type AssistanceCategory = {
  id: string
  slug: CommunityCategorySlug | string
  name_ar: string
  name_he: string
  name_en: string
  description_ar: string | null
  description_he: string | null
  description_en: string | null
  icon: string | null
  color: string | null
  sort_order: number
  is_active: boolean
}

export type AssistanceScenario = {
  id: string
  category_id: string
  slug: string
  name_ar: string
  name_he: string
  name_en: string
  description_ar: string | null
  description_he: string | null
  description_en: string | null
  emergency_level: 'none' | 'screen' | 'redirect'
  requires_details: boolean
  allows_media: boolean
  sort_order: number
  is_active: boolean
}

export type RequestUrgency = 'standard' | 'urgent' | 'emergency_redirected'

export type CivicRequestDraft = {
  requesterId: string
  categoryId: string
  scenarioId: string | null
  details: string | null
  urgency: RequestUrgency
  latitude: number
  longitude: number
  locationAccuracy?: number | null
  locationLabel?: string | null
  mediaPaths?: string[]
  legacyServiceType?: HelpRequest['service_type']
}

export type MissionStatus =
  | 'matching'
  | 'assigned'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type Mission = {
  id: string
  request_id: string
  requester_id: string
  helper_id: string | null
  status: MissionStatus
  accepted_at: string | null
  started_at: string | null
  arrived_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  request?: HelpRequest | null
  source: 'v2' | 'legacy'
}

export type MissionEventType =
  | 'created'
  | 'matching_started'
  | 'assigned'
  | 'on_the_way'
  | 'arrived'
  | 'started'
  | 'completion_requested'
  | 'completed'
  | 'cancelled'
  | 'released'
  | 'disputed'
  | 'safety_reported'

export type MissionEvent = {
  id: string
  mission_id: string
  actor_id: string | null
  event_type: MissionEventType | string
  from_status: MissionStatus | string | null
  to_status: MissionStatus | string | null
  metadata: Record<string, unknown>
  created_at: string
}

export type MissionMessage = {
  id: string
  mission_id: string
  sender_id: string
  body: string
  created_at: string
  read_at: string | null
}

export type HelperSkill = {
  id: string
  helper_id: string
  category_id: string
  scenario_id: string | null
  is_verified: boolean
  created_at: string
}

export type DeviceRegistration = {
  id: string
  user_id: string
  expo_push_token: string
  platform: string
  locale: SupportedLanguage
  notifications_enabled: boolean
  last_seen_at: string
  created_at: string
  updated_at: string
}

export type NotificationRecord = {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export type MissionRating = {
  id: string
  mission_id: string
  author_id: string
  subject_id: string
  score: number
  comment: string | null
  tags: string[]
  created_at: string
}

export type SafetyReport = {
  id: string
  reporter_id: string
  reported_user_id: string | null
  mission_id: string | null
  category: string
  details: string | null
  status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
  created_at: string
  updated_at: string
}

export type UserBlock = {
  id: string
  blocker_id: string
  blocked_user_id: string
  reason: string | null
  created_at: string
}

export type Reward = {
  id: string
  title_ar: string
  title_he: string
  title_en: string
  description_ar: string | null
  description_he: string | null
  description_en: string | null
  points_cost: number
  image_url: string | null
  stock: number | null
  market: string
  is_active: boolean
  valid_from: string | null
  valid_until: string | null
  created_at: string
}

export type RewardRedemption = {
  id: string
  reward_id: string
  user_id: string
  points_spent: number
  code: string | null
  status: 'pending' | 'approved' | 'redeemed' | 'cancelled' | 'expired'
  created_at: string
  redeemed_at: string | null
}

export type LegacyMissionStatus = Extract<RequestStatus, 'accepted' | 'on_the_way' | 'arrived' | 'awaiting_confirmation' | 'completed' | 'cancelled'>
