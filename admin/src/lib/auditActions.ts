// Mirrors the `action`/`target_type` CHECK constraints on
// public.admin_audit_log (supabase/migrations/0014_admin_audit_log.sql,
// extended by 0015_businesses_offers_reviews.sql).

export type AuditAction =
  | 'user_banned'
  | 'user_unbanned'
  | 'volunteer_verified'
  | 'volunteer_unverified'
  | 'request_cancelled'
  | 'business_created'
  | 'business_edited'
  | 'business_activated'
  | 'business_hidden'
  | 'offer_created'
  | 'offer_edited'
  | 'offer_approved'
  | 'offer_rejected'
  | 'offer_paused'
  | 'review_hidden'
  | 'review_restored'

export type AuditTargetType = 'user' | 'volunteer' | 'request' | 'business' | 'offer' | 'review'

export const AUDIT_ACTION_LABEL_KEYS: Record<AuditAction, string> = {
  user_banned: 'audit.actions.userBanned',
  user_unbanned: 'audit.actions.userUnbanned',
  volunteer_verified: 'audit.actions.volunteerVerified',
  volunteer_unverified: 'audit.actions.volunteerUnverified',
  request_cancelled: 'audit.actions.requestCancelled',
  business_created: 'audit.actions.businessCreated',
  business_edited: 'audit.actions.businessEdited',
  business_activated: 'audit.actions.businessActivated',
  business_hidden: 'audit.actions.businessHidden',
  offer_created: 'audit.actions.offerCreated',
  offer_edited: 'audit.actions.offerEdited',
  offer_approved: 'audit.actions.offerApproved',
  offer_rejected: 'audit.actions.offerRejected',
  offer_paused: 'audit.actions.offerPaused',
  review_hidden: 'audit.actions.reviewHidden',
  review_restored: 'audit.actions.reviewRestored'
}
