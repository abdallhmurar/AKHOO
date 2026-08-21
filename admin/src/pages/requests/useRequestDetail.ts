import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { HelpRequest, Profile, HelpRequestRelease, VolunteerPointTransaction } from '@/types'

export function useRequestDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['request', id],
    enabled: !!id,
    queryFn: async () => {
      const { data: request, error } = await supabase.from('help_requests').select('*').eq('id', id!).single()
      if (error) throw error
      const r = request as HelpRequest

      const profileIds = [r.requester_id, r.volunteer_id].filter((v): v is string => !!v)
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, phone, avatar_url').in('id', profileIds)
      const profilesById = new Map((profiles ?? []).map(p => [p.id, p as Pick<Profile, 'id' | 'full_name' | 'phone' | 'avatar_url'>]))

      const { data: releases } = await supabase.from('help_request_releases').select('*').eq('request_id', r.id).order('released_at', { ascending: false })

      const { data: pointsRows } = await supabase.from('volunteer_point_transactions').select('*').eq('request_id', r.id).maybeSingle()

      return {
        request: r,
        requester: profilesById.get(r.requester_id) ?? null,
        volunteer: r.volunteer_id ? (profilesById.get(r.volunteer_id) ?? null) : null,
        releases: (releases ?? []) as HelpRequestRelease[],
        pointsTransaction: (pointsRows ?? null) as VolunteerPointTransaction | null
      }
    }
  })
}
