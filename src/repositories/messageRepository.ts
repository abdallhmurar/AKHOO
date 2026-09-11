import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'

export type ChatMessage = {
  id: string
  request_id: string
  sender_id: string
  body: string | null
  media_url: string | null
  media_type: 'image' | 'video' | null
  created_at: string
}

// Same channel-reuse guard as missionRepository.subscribe - supabase-js
// caches realtime channels by topic name, so re-subscribing to a topic
// that's already joined/joining throws instead of adding a second listener.
function subscribeOnce(topic: string, bind: (channel: RealtimeChannel) => RealtimeChannel) {
  const realtimeTopic = `realtime:${topic}`
  const existing = supabase.getChannels().find(channel => channel.topic === realtimeTopic)
  if (existing && (existing.state === 'joined' || existing.state === 'joining')) {
    return () => {}
  }
  const channel = bind(supabase.channel(topic)).subscribe()
  return () => { void supabase.removeChannel(channel) }
}

export const messageRepository = {
  async list(requestId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase.from('messages').select('*').eq('request_id', requestId).order('created_at', { ascending: true })
    throwIfError(error, { domain: 'messages', operation: 'list' })
    return (data ?? []) as ChatMessage[]
  },

  async sendText(requestId: string, senderId: string, body: string) {
    const { error } = await supabase.from('messages').insert({ request_id: requestId, sender_id: senderId, body })
    throwIfError(error, { domain: 'messages', operation: 'send-text' })
  },

  async sendMedia(requestId: string, senderId: string, uri: string, mediaType: 'image' | 'video') {
    const response = await fetch(uri)
    const blob = await response.blob()
    const extension = mediaType === 'video' ? 'mp4' : 'jpg'
    const path = `${senderId}/${Date.now()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('mission-chat').upload(path, blob, { contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg' })
    throwIfError(uploadError, { domain: 'messages', operation: 'upload-media' })
    const mediaUrl = supabase.storage.from('mission-chat').getPublicUrl(path).data.publicUrl
    const { error } = await supabase.from('messages').insert({ request_id: requestId, sender_id: senderId, media_url: mediaUrl, media_type: mediaType })
    throwIfError(error, { domain: 'messages', operation: 'send-media' })
  },

  subscribe(requestId: string, listener: (message: ChatMessage) => void) {
    return subscribeOnce(`messages:${requestId}`, channel => channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}` }, payload => listener(payload.new as ChatMessage))
    )
  }
}
