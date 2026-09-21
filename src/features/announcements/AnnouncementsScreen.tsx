import { useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Bell } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { AppScreen, ScreenHeader } from '../../components/v2'
import { Skeleton } from '../../components/ui'
import { EmptyState } from '../../components/EmptyState'
import { PosterImage } from './PosterImage'
import { useAnnouncements, useMarkAnnouncementsRead } from './useAnnouncements'
import type { Announcement } from '../../types'

function AnnouncementCard({ announcement, isNew }: { announcement: Announcement; isNew: boolean }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t, i18n } = useTranslation()
  const textAlign = isRTL ? 'right' : 'left'

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: isNew ? theme.colors.emergency : theme.colors.border }]}>
      {announcement.image_urls.map(uri => <PosterImage key={uri} uri={uri} />)}
      <View style={[styles.meta, dirStyles(isRTL).row]}>
        <Text style={[typography.caption, { color: theme.colors.textMuted }]}>{new Date(announcement.created_at).toLocaleDateString(i18n.language, { dateStyle: 'medium' })}</Text>
        {isNew ? (
          <View style={[styles.newBadge, { backgroundColor: theme.colors.emergencySoft }]}>
            <Text style={[typography.caption, { color: theme.colors.emergency }]}>{t('announcements.newBadge')}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign }]}>{announcement.title}</Text>
      <Text style={[typography.body, { color: theme.colors.textSecondary, textAlign }]}>{announcement.body}</Text>
      {announcement.details ? (
        <View style={[styles.details, { borderColor: theme.colors.border }]}>
          <Text style={[typography.body, { color: theme.colors.textPrimary, textAlign }]}>{announcement.details}</Text>
        </View>
      ) : null}
    </View>
  )
}

export function AnnouncementsScreen() {
  const { t } = useTranslation()
  const { announcements, query } = useAnnouncements()
  const markRead = useMarkAnnouncementsRead()
  // Opening the screen marks everything read (the bell stops shaking), but
  // the "New" badges are decided once, from what was unread on arrival.
  const initiallyUnread = useRef<Set<string> | null>(null)

  useEffect(() => {
    if (!query.isSuccess || initiallyUnread.current) return
    const unreadIds = announcements.filter(a => !a.read_at).map(a => a.id)
    initiallyUnread.current = new Set(unreadIds)
    if (unreadIds.length > 0) markRead.mutate(unreadIds)
  }, [query.isSuccess, announcements, markRead])

  return (
    <AppScreen header={<ScreenHeader title={t('announcements.title')} back />} contentStyle={styles.content}>
      {query.isLoading ? (
        <>
          <Skeleton width="100%" height={220} />
          <Skeleton width="100%" height={120} />
        </>
      ) : announcements.length === 0 ? (
        <EmptyState Icon={Bell} title={t('announcements.emptyTitle')} message={t('announcements.emptyMessage')} />
      ) : (
        announcements.map(a => <AnnouncementCard key={a.id} announcement={a} isNew={initiallyUnread.current?.has(a.id) ?? false} />)
      )}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: space.lg, gap: space.md },
  meta: { alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  details: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md },
  newBadge: { paddingHorizontal: space.md, paddingVertical: 3, borderRadius: radius.pill }
})
