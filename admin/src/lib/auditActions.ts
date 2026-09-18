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
  | 'business_marked_pending'
  | 'business_verified'
  | 'business_suspended'
  | 'business_rejected'
  | 'offer_created'
  | 'offer_edited'
  | 'offer_approved'
  | 'offer_rejected'
  | 'offer_paused'
  | 'offer_weekly_slot_set'
  | 'review_hidden'
  | 'review_restored'
  | 'redemption_redeemed'
  | 'redemption_cancelled'
  | 'redemption_refunded'
  | 'report_resolved'
  | 'report_dismissed'
  | 'broadcast_notification_sent'
  | 'content_banner_updated'
  | 'partner_access_granted'
  | 'partner_access_updated'
  | 'partner_access_revoked'

export type AuditTargetType = 'user' | 'volunteer' | 'request' | 'business' | 'offer' | 'review' | 'redemption' | 'report' | 'notification' | 'content_banner'

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
  business_marked_pending: 'audit.actions.businessMarkedPending',
  business_verified: 'audit.actions.businessVerified',
  business_suspended: 'audit.actions.businessSuspended',
  business_rejected: 'audit.actions.businessRejected',
  offer_created: 'audit.actions.offerCreated',
  offer_edited: 'audit.actions.offerEdited',
  offer_approved: 'audit.actions.offerApproved',
  offer_rejected: 'audit.actions.offerRejected',
  offer_paused: 'audit.actions.offerPaused',
  offer_weekly_slot_set: 'audit.actions.offerWeeklySlotSet',
  review_hidden: 'audit.actions.reviewHidden',
  review_restored: 'audit.actions.reviewRestored',
  redemption_redeemed: 'audit.actions.redemptionRedeemed',
  redemption_cancelled: 'audit.actions.redemptionCancelled',
  redemption_refunded: 'audit.actions.redemptionRefunded',
  report_resolved: 'audit.actions.reportResolved',
  report_dismissed: 'audit.actions.reportDismissed',
  broadcast_notification_sent: 'audit.actions.broadcastNotificationSent',
  content_banner_updated: 'audit.actions.contentBannerUpdated',
  partner_access_granted: 'audit.actions.partnerAccessGranted',
  partner_access_updated: 'audit.actions.partnerAccessUpdated',
  partner_access_revoked: 'audit.actions.partnerAccessRevoked'
}
