import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/useAuth'

export function useCurrentAdminProfile() {
  const { state } = useAuth()
  const userId = state.status === 'admin' ? state.session.user.id : undefined

  return useQuery({
    queryKey: ['current-admin-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', userId!).single()
      if (error) throw error
      return data
    },
    enabled: !!userId
  })
}
