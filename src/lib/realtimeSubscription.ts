import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'

// Each observer owns a channel: one component unmounting must not disconnect
// another component, and every mounted observer must receive its callback.
let sequence = 0
export function realtimeSubscription(topic: string, bind: (channel: RealtimeChannel) => RealtimeChannel) {
  const channel = bind(supabase.channel(`${topic}:${++sequence}`)).subscribe()
  return () => { void supabase.removeChannel(channel) }
}
