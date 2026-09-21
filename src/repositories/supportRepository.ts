import { realtimeSubscription } from '../lib/realtimeSubscription'
import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'
import type { SupportConversation, SupportMessage } from '../types'

const BUCKET = 'support-chat'
const HISTORY_LIMIT = 200
const IMAGE_EXTENSIONS: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

type MessageRow = Omit<SupportMessage, 'media_url'>

// Talks to the support tables added in 0035. Reads go straight through RLS
// (a user only ever sees their own conversation); every write is an RPC.
export const supportRepository = {
  // Filtered by user_id on purpose: an admin using the app can also read
  // every conversation through RLS, and must still get their own here.
  async getConversation(userId: string): Promise<SupportConversation | null> {
    const { data, error } = await supabase.from('support_conversations')
      .select('id, user_id, status, last_admin_message_at, user_last_read_at')
      .eq('user_id', userId)
      .maybeSingle()
    throwIfError(error, { domain: 'support', operation: 'get-conversation', silent: true })
    return (data as SupportConversation | null) ?? null
  },

  async listMessages(conversationId: string): Promise<SupportMessage[]> {
    const { data, error } = await supabase.from('support_messages')
      .select('id, conversation_id, from_admin, body, media_path, media_type, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(HISTORY_LIMIT)
    throwIfError(error, { domain: 'support', operation: 'list-messages' })
    const rows = ((data ?? []) as MessageRow[]).reverse()
    const paths = rows.flatMap(row => row.media_path ? [row.media_path] : [])
    if (paths.length === 0) return rows.map(row => ({ ...row, media_url: null }))
    const signed = await supabase.storage.from(BUCKET).createSignedUrls(paths, 900)
    throwIfError(signed.error, { domain: 'support', operation: 'read-media' })
    const urls = new Map((signed.data ?? []).map(item => [item.path, item.signedUrl]))
    return rows.map(row => ({ ...row, media_url: row.media_path ? urls.get(row.media_path) ?? null : null }))
  },

  async sendText(body: string): Promise<void> {
    const { error } = await supabase.rpc('support_send_message', { p_body: body })
    throwIfError(error, { domain: 'support', operation: 'send-text' })
  },

  async sendImage(userId: string, uri: string, mimeType?: string, body?: string): Promise<void> {
    const response = await fetch(uri)
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength > 10 * 1024 * 1024) throw new Error('Image must be under 10 MB')
    const contentType = mimeType && IMAGE_EXTENSIONS[mimeType] ? mimeType : 'image/jpeg'
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${IMAGE_EXTENSIONS[contentType]}`
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType })
    throwIfError(uploadError, { domain: 'support', operation: 'upload-image' })
    const { error } = await supabase.rpc('support_send_message', { p_body: body?.trim() || null, p_media_path: path })
    if (error) await supabase.storage.from(BUCKET).remove([path])
    throwIfError(error, { domain: 'support', operation: 'send-image' })
  },

  async markRead(): Promise<void> {
    const { error } = await supabase.rpc('support_mark_read')
    throwIfError(error, { domain: 'support', operation: 'mark-read', silent: true })
  },

  subscribeMessages(conversationId: string, listener: () => void) {
    return realtimeSubscription(`support-messages:${conversationId}`, channel => channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${conversationId}` }, listener)
    )
  },

  // The conversation row changes on every message (either side), which is
  // what keeps the "new reply" dot current while the app is open.
  subscribeConversation(userId: string, listener: () => void) {
    return realtimeSubscription(`support-conversation:${userId}`, channel => channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations', filter: `user_id=eq.${userId}` }, listener)
    )
  }
}
