import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { announcementRepository } from '../../repositories/announcementRepository'
import { AnnouncementPopup } from './AnnouncementPopup'
import { useAnnouncements, useMarkAnnouncementsRead } from './useAnnouncements'

// Mounted once, above the navigator, for signed-in users. Shows the newest
// announcement that has neither been read nor already popped up, one at a time.
export function AnnouncementHost() {
  const router = useRouter()
  const { announcements, query } = useAnnouncements()
  const markRead = useMarkAnnouncementsRead()
  const [activeId, setActiveId] = useState<string | null>(null)
  // Ids already offered in this session, so closing one never re-opens it
  // before the server-side "shown" state has round-tripped.
  const handled = useRef(new Set<string>())

  useEffect(() => {
    if (activeId || !query.isSuccess) return
    const next = announcements.find(a => !a.read_at && !a.popup_shown_at && !handled.current.has(a.id))
    if (!next) return
    // A beat after arriving, so it doesn't fight the screen transition.
    const timer = setTimeout(() => {
      handled.current.add(next.id)
      setActiveId(next.id)
      // Recorded as soon as it is on screen: if the app is killed right after,
      // it must not pop up again on the next launch.
      announcementRepository.markPopupShown(next.id).catch(() => {})
    }, 700)
    return () => clearTimeout(timer)
  }, [activeId, query.isSuccess, announcements])

  const active = activeId ? announcements.find(a => a.id === activeId) : undefined
  if (!active) return null

  return (
    <AnnouncementPopup
      announcement={active}
      onLater={() => setActiveId(null)}
      onViewNow={() => {
        markRead.mutate([active.id])
        setActiveId(null)
        router.push('/announcements')
      }}
    />
  )
}
