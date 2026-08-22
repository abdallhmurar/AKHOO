import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile, HelpRequest, VolunteerProfile, VolunteerPointTransaction, AdminAuditLog } from '@/types'

export function useUserDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['user', id],
    enabled: !!id,
    queryFn: async () => {
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', id!).single()
      if (error) throw error

      const { data: requests } = await supabase.from('help_requests').select('*').eq('requester_id', id!).order('created_at', { ascending: false }).limit(50)

      const { data: volunteerProfile } = await supabase.from('volunteer_profiles').select('*').eq('user_id', id!).maybeSingle()

      const { data: assists } = await supabase.from('help_requests').select('*').eq('volunteer_id', id!).order('created_at', { ascending: false }).limit(50)

      const { data: points } = await supabase.from('volunteer_point_transactions').select('*').eq('volunteer_id', id!).order('created_at', { ascending: false })

      const { data: history } = await supabase.from('admin_audit_log').select('*').in('target_type', ['user', 'volunteer']).eq('target_id', id!).order('created_at', { ascending: false })

      const completedCount = (assists ?? []).filter(a => a.status === 'completed').length

      return {
        profile: profile as Profile,
        requests: (requests ?? []) as HelpRequest[],
        volunteerProfile: (volunteerProfile ?? null) as VolunteerProfile | null,
        assists: (assists ?? []) as HelpRequest[],
        points: (points ?? []) as VolunteerPointTransaction[],
        completedCount,
        history: (history ?? []) as AdminAuditLog[]
      }
    }
  })
}
