// Mirrors the `action`/`target_type` CHECK constraints on
// public.admin_audit_log (supabase/migrations/0014_admin_audit_log.sql).

export type AuditAction = 'user_banned' | 'user_unbanned' | 'volunteer_verified' | 'volunteer_unverified' | 'request_cancelled'
export type AuditTargetType = 'user' | 'volunteer' | 'request'

export const AUDIT_ACTION_LABEL_KEYS: Record<AuditAction, string> = {
  user_banned: 'audit.actions.userBanned',
  user_unbanned: 'audit.actions.userUnbanned',
  volunteer_verified: 'audit.actions.volunteerVerified',
  volunteer_unverified: 'audit.actions.volunteerUnverified',
  request_cancelled: 'audit.actions.requestCancelled'
}
