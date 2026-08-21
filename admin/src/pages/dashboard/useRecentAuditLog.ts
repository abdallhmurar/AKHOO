import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AdminAuditLog } from '@/types'

export type AuditLogWithAdminName = AdminAuditLog & { admin_name: string | null }

// admin_audit_log.admin_id references auth.users, not public.profiles
// directly, so PostgREST can't embed profiles through it - batch-fetch the
// distinct admin profiles for this page instead (same two-step pattern
// used by every list hook in this app, see lib/pagination.ts's header).
export function useRecentAuditLog(limit = 10) {
  return useQuery({
    queryKey: ['audit-log', { limit }],
    queryFn: async (): Promise<AuditLogWithAdminName[]> => {
      const { data, error } = await supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(limit)
      if (error) throw error
      const rows = (data ?? []) as AdminAuditLog[]

      const adminIds = [...new Set(rows.map(r => r.admin_id).filter((id): id is string => !!id))]
      const adminNames = new Map<string, string>()
      if (adminIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', adminIds)
        for (const p of profiles ?? []) adminNames.set(p.id, p.full_name)
      }

      return rows.map(row => ({ ...row, admin_name: row.admin_id ? (adminNames.get(row.admin_id) ?? null) : null }))
    }
  })
}
