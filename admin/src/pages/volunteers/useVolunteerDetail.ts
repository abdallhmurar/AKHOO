import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Profile, VolunteerProfile, VolunteerPointTransaction, AdminAuditLog, HelpRequest } from '@/types'

export function useVolunteerDetail(userId: string | undefined) {
  return useQuery({
    queryKey: ['volunteer', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId!).single()
      if (profileError) throw profileError

      const { data: volunteerProfile, error: vpError } = await supabase.from('volunteer_profiles').select('*').eq('user_id', userId!).single()
      if (vpError) throw vpError

      const { data: missions } = await supabase.from('help_requests').select('*').eq('volunteer_id', userId!).order('created_at', { ascending: false }).limit(50)

      const { data: points } = await supabase.from('volunteer_point_transactions').select('*').eq('volunteer_id', userId!).order('created_at', { ascending: false })

      const { data: history } = await supabase.from('admin_audit_log').select('*').eq('target_type', 'volunteer').eq('target_id', userId!).order('created_at', { ascending: false })

      const completedCount = (missions ?? []).filter(m => m.status === 'completed').length

      return {
        profile: profile as Profile,
        volunteerProfile: volunteerProfile as VolunteerProfile,
        missions: (missions ?? []) as HelpRequest[],
        points: (points ?? []) as VolunteerPointTransaction[],
        history: (history ?? []) as AdminAuditLog[],
        completedCount
      }
    }
  })
}
