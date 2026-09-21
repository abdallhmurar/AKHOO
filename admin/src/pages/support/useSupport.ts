import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { removeSupportImage, uploadSupportImage } from '@/lib/storage'
import type { SupportConversation, SupportMessage, SupportNote, SupportStatus } from '@/types'

export type ConversationRow = SupportConversation & { name: string | null; avatar_url: string | null }
export type MessageRow = SupportMessage & { media_url: string | null }

const CONVERSATION_LIMIT = 500
const PROFILE_CHUNK = 100

// Any change to a conversation or message refreshes whatever inbox queries
// are mounted. The polling intervals on those queries are only a fallback for
// a dropped socket.
export function useSupportRealtime() {
  const queryClient = useQueryClient()
  useEffect(() => {
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['support-conversations'] })
      void queryClient.invalidateQueries({ queryKey: ['support-open-count'] })
      void queryClient.invalidateQueries({ queryKey: ['support-messages'] })
    }
    const channel = supabase.channel(`support-inbox:${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_conversations' }, refresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, refresh)
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [queryClient])
}

export function useSupportConversations() {
  return useQuery({
    queryKey: ['support-conversations'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('support_conversations').select('*').order('last_message_at', { ascending: false }).limit(CONVERSATION_LIMIT)
      if (error) throw error
      const conversations = (data ?? []) as SupportConversation[]

      const profiles = new Map<string, { name: string | null; avatar_url: string | null }>()
      const ids = [...new Set(conversations.map(c => c.user_id))]
      for (let offset = 0; offset < ids.length; offset += PROFILE_CHUNK) {
        const { data: rows } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids.slice(offset, offset + PROFILE_CHUNK))
        for (const p of rows ?? []) profiles.set(p.id, { name: p.full_name, avatar_url: p.avatar_url })
      }

      return conversations.map<ConversationRow>(c => ({ ...c, name: profiles.get(c.user_id)?.name ?? null, avatar_url: profiles.get(c.user_id)?.avatar_url ?? null }))
    }
  })
}

// Conversations that need a reply: drives the sidebar badge.
export function useSupportOpenCount() {
  return useQuery({
    queryKey: ['support-open-count'],
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase.from('support_conversations').select('id', { count: 'exact', head: true }).eq('status', 'open')
      if (error) throw error
      return count ?? 0
    }
  })
}

export function useSupportMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['support-messages', conversationId],
    enabled: !!conversationId,
    // Signed image URLs last 15 minutes; refetching keeps them fresh.
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('support_messages').select('*').eq('conversation_id', conversationId!).order('created_at', { ascending: true }).limit(1000)
      if (error) throw error
      const rows = (data ?? []) as SupportMessage[]
      const paths = rows.flatMap(r => r.media_path ? [r.media_path] : [])
      const urls = new Map<string, string>()
      if (paths.length > 0) {
        const signed = await supabase.storage.from('support-chat').createSignedUrls(paths, 900)
        if (signed.error) throw signed.error
        for (const item of signed.data ?? []) if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl)
      }
      return rows.map<MessageRow>(r => ({ ...r, media_url: r.media_path ? urls.get(r.media_path) ?? null : null }))
    }
  })
}

export function useSupportNotes(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['support-notes', conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase.from('support_notes').select('*').eq('conversation_id', conversationId!).order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as SupportNote[]
    }
  })
}

function useRefreshSupport() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['support-conversations'] })
    void queryClient.invalidateQueries({ queryKey: ['support-open-count'] })
    void queryClient.invalidateQueries({ queryKey: ['support-messages'] })
    void queryClient.invalidateQueries({ queryKey: ['audit-log'] })
  }
}

export function useSupportReply() {
  const refresh = useRefreshSupport()
  return useMutation({
    mutationFn: async ({ conversation, body, image }: { conversation: SupportConversation; body: string; image: File | null }) => {
      const path = image ? await uploadSupportImage(image, conversation.user_id) : null
      const { error } = await supabase.rpc('admin_support_reply', { p_conversation_id: conversation.id, p_body: body.trim() || null, p_media_path: path })
      if (error) {
        if (path) await removeSupportImage(path)
        throw error
      }
    },
    onSuccess: refresh,
    onError: (error: Error) => { toast.error(error.message) }
  })
}

export function useSetSupportStatus() {
  const refresh = useRefreshSupport()
  return useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: string; status: SupportStatus }) => {
      const { error } = await supabase.rpc('admin_support_set_status', { p_conversation_id: conversationId, p_status: status })
      if (error) throw error
    },
    onSuccess: refresh,
    onError: (error: Error) => { toast.error(error.message) }
  })
}

export function useAddSupportNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ conversationId, body }: { conversationId: string; body: string }) => {
      const { error } = await supabase.rpc('admin_support_add_note', { p_conversation_id: conversationId, p_body: body })
      if (error) throw error
    },
    onSuccess: (_data, { conversationId }) => { void queryClient.invalidateQueries({ queryKey: ['support-notes', conversationId] }) },
    onError: (error: Error) => { toast.error(error.message) }
  })
}
