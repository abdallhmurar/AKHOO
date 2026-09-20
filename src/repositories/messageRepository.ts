import { realtimeSubscription } from '../lib/realtimeSubscription'
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



export const messageRepository = {
  async list(requestId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase.from('messages').select('*').eq('request_id', requestId).order('created_at', { ascending: true })
    throwIfError(error, { domain: 'messages', operation: 'list' })
    // Allows a rolling client rollout before migration 0027 rewrites the
    // historical public URLs. Storage still authorizes every signed URL.
    const messages = ((data ?? []) as ChatMessage[]).map(m => ({ ...m,
      media_url: m.media_url?.replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/mission-chat\//, '') ?? null
    }))
    const paths = messages.flatMap(m => m.media_url ? [m.media_url] : [])
    if (!paths.length) return messages
    const signed = await supabase.storage.from('mission-chat').createSignedUrls(paths, 900)
    throwIfError(signed.error, { domain: 'messages', operation: 'read-media' })
    const urls = new Map(signed.data.map(item => [item.path, item.signedUrl]))
    return messages.map(m => ({ ...m, media_url: m.media_url ? urls.get(m.media_url) ?? null : null }))
  },

  async sendText(requestId: string, senderId: string, body: string) {
    const { error } = await supabase.from('messages').insert({ request_id: requestId, sender_id: senderId, body })
    throwIfError(error, { domain: 'messages', operation: 'send-text' })
  },

  async sendMedia(requestId: string, senderId: string, uri: string, mediaType: 'image' | 'video', mimeType?: string) {
    const response = await fetch(uri)
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength > 25 * 1024 * 1024) throw new Error('Media must be under 25 MB')
    const contentType = mimeType ?? (mediaType === 'video' ? 'video/mp4' : 'image/jpeg')
    const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'video/mp4': 'mp4', 'video/quicktime': 'mov' }
    const extension = extensions[contentType]
    if (!extension) throw new Error('Unsupported media type')
    const path = `${senderId}/${requestId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
    const { error: uploadError } = await supabase.storage.from('mission-chat').upload(path, bytes, { contentType })
    throwIfError(uploadError, { domain: 'messages', operation: 'upload-media' })
    const { error } = await supabase.from('messages').insert({ request_id: requestId, sender_id: senderId, media_url: path, media_type: mediaType })
    if (error) await supabase.storage.from('mission-chat').remove([path])
    throwIfError(error, { domain: 'messages', operation: 'send-media' })
  },

  subscribe(requestId: string, listener: (message: ChatMessage) => void) {
    return realtimeSubscription(`messages:${requestId}`, channel => channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}` }, payload => listener(payload.new as ChatMessage))
    )
  }
}
