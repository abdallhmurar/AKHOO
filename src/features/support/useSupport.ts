import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../providers'
import { supportRepository } from '../../repositories/supportRepository'
import type { SupportConversation } from '../../types'

export const supportKeys = {
  conversation: (userId: string | undefined) => ['support', 'conversation', userId] as const,
  messages: (conversationId: string | undefined) => ['support', 'messages', conversationId] as const
}

export function hasUnreadReply(conversation: SupportConversation | null | undefined) {
  if (!conversation?.last_admin_message_at) return false
  if (!conversation.user_last_read_at) return true
  return Date.parse(conversation.last_admin_message_at) > Date.parse(conversation.user_last_read_at)
}

// The user's own conversation (null until they send their first message).
// Kept live over realtime while a screen that shows the "new reply" dot is
// mounted; the interval is only a fallback for a dropped socket.
export function useSupportConversation() {
  const { session, isRestricted } = useAuth()
  const userId = session?.user.id
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: supportKeys.conversation(userId),
    queryFn: () => supportRepository.getConversation(userId!),
    enabled: !!userId && !isRestricted,
    staleTime: 15_000,
    refetchInterval: 2 * 60_000
  })

  useEffect(() => {
    if (!userId || isRestricted) return
    return supportRepository.subscribeConversation(userId, () => {
      void queryClient.invalidateQueries({ queryKey: supportKeys.conversation(userId) })
    })
  }, [userId, isRestricted, queryClient])

  return { conversation: query.data ?? null, hasUnread: hasUnreadReply(query.data), query }
}
