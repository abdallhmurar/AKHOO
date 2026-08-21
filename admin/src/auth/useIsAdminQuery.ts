import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// public.is_admin() (supabase/migrations/0003_fix_help_requests_recursion.sql)
// is a SECURITY DEFINER function reading profiles.is_admin server-side -
// this is the only signal that gates the admin shell. Every page's own
// queries are independently RLS-gated by the same function too (defense in
// depth, matching 0011_security_hardening.sql's posture), so a bypassed
// client check still can't read data.
export function useIsAdminQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['is-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_admin')
      if (error) throw error
      return data as boolean
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
  })
}
