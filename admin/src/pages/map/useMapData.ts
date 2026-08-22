import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { HelpRequest, Business } from '@/types'

// Pilot scale (per 0009_jerusalem_pilot.sql) - a capped, one-shot fetch of
// currently-relevant rows is simpler and cheap enough here; no realtime
// subscription needed for an admin overview map (unlike the mobile app's
// live volunteer-facing map). Only non-terminal requests are shown - no
// historical volunteer GPS trail, per the brief's explicit privacy note.
export function useMapRequests() {
  return useQuery({
    queryKey: ['map-requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('help_requests').select('*').in('status', ['open', 'accepted', 'on_the_way', 'arrived', 'awaiting_confirmation']).limit(200)
      if (error) throw error
      return data as HelpRequest[]
    }
  })
}

export function useMapBusinesses() {
  return useQuery({
    queryKey: ['map-businesses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partners').select('*').not('latitude', 'is', null).not('longitude', 'is', null).limit(500)
      if (error) throw error
      return data as Business[]
    }
  })
}
