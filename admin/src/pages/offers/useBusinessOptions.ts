import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Lightweight id/name list for the offer form's business picker - admin
// scale (dozens, not thousands, of businesses), so a single capped fetch
// is simpler than a searchable async-select for Round 2.
export function useBusinessOptions() {
  return useQuery({
    queryKey: ['business-options'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partners').select('id, name').order('name').limit(500)
      if (error) throw error
      return data as { id: string; name: string }[]
    }
  })
}
