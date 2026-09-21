import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../providers'
import { announcementRepository } from '../../repositories/announcementRepository'
import type { Announcement } from '../../types'

// One shared query: the home-screen bell, the popup host and the list screen
// all read the same cache entry, so opening any of them costs no extra request.
export function useAnnouncements() {
  const { session, isRestricted } = useAuth()
  const userId = session?.user.id
  const query = useQuery({
    queryKey: ['announcements', userId],
    queryFn: () => announcementRepository.list(),
    enabled: !!userId && !isRestricted,
    staleTime: 30_000,
    // A broadcast sent while the app is already open shows up within minutes;
    // foregrounding the app refetches immediately (QueryProvider's focusManager).
    refetchInterval: 2 * 60_000
  })
  const announcements = query.data ?? []
  const unread = announcements.filter(a => !a.read_at)
  return { announcements, unread, query }
}

export function useMarkAnnouncementsRead() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const key = ['announcements', session?.user.id]

  return useMutation({
    mutationFn: (ids: string[]) => announcementRepository.markRead(ids),
    onMutate: ids => {
      // Optimistic: the bell stops shaking the moment they open it.
      const now = new Date().toISOString()
      queryClient.setQueryData<Announcement[]>(key, current =>
        current?.map(a => (ids.includes(a.id) ? { ...a, read_at: a.read_at ?? now, popup_shown_at: a.popup_shown_at ?? now } : a))
      )
    },
    onSettled: () => { void queryClient.invalidateQueries({ queryKey: key }) }
  })
}
