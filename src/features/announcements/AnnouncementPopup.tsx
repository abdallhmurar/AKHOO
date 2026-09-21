import { useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Bell, CaretLeft, CaretRight, X } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { Button, IconButton } from '../../components/ui'
import type { Announcement } from '../../types'

const POSTER_HEIGHT = 220

// Swipeable posters with dots. Direction is pinned to ltr: the pager's page
// math (offset / width) and the dots must not be mirrored by an rtl language.
function PosterPager({ images }: { images: string[] }) {
  const theme = useSanadTheme()
  const [width, setWidth] = useState(0)
  const [page, setPage] = useState(0)

  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={styles.pagerWrap}>
      {width > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={[styles.pager, { direction: 'ltr', backgroundColor: theme.colors.surfaceMuted }]}
          onMomentumScrollEnd={event => setPage(Math.round(event.nativeEvent.contentOffset.x / width))}
        >
          {images.map(uri => (
            <View key={uri} style={{ width, height: POSTER_HEIGHT }}>
              <Image source={{ uri }} style={styles.poster} resizeMode="contain" accessible={false} />
            </View>
          ))}
        </ScrollView>
      ) : null}
      {images.length > 1 ? (
        <View style={[styles.dots, { direction: 'ltr' }]}>
          {images.map((uri, index) => (
            <View key={uri} style={[styles.dot, { backgroundColor: index === page ? theme.colors.emergency : theme.colors.borderStrong, width: index === page ? 18 : 7 }]} />
          ))}
        </View>
      ) : null}
    </View>
  )
}

// The announcement popup: poster(s), bell + title, the message, then
// "View now" / "Later". "Later" only closes it - the announcement stays
// unread so the bell keeps shaking until they open it.
export function AnnouncementPopup({ announcement, onViewNow, onLater }: { announcement: Announcement; onViewNow: () => void; onLater: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t } = useTranslation()
  const Chevron = isRTL ? CaretLeft : CaretRight
  const textAlign = isRTL ? 'right' : 'left'

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onLater}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('announcements.close')} onPress={onLater} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={[styles.card, shadow.floating, { backgroundColor: theme.colors.surface }]}>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardContent}>
            {announcement.image_urls.length > 0 ? <PosterPager images={announcement.image_urls} /> : null}

            <View style={[styles.header, dirStyles(isRTL).row]}>
              <View style={[styles.headerMain, dirStyles(isRTL).row]}>
                <View style={[styles.bellCircle, { backgroundColor: theme.colors.emergencySoft }]}>
                  <Bell size={24} weight="fill" color={theme.colors.emergency} />
                </View>
                <Text style={[typography.h2, styles.title, { color: theme.colors.textPrimary, textAlign }]}>{announcement.title}</Text>
              </View>
              <IconButton label={t('announcements.close')} size={38} icon={<X size={18} color={theme.colors.textSecondary} />} onPress={onLater} style={styles.close} />
            </View>

            <Text style={[typography.body, { color: theme.colors.textSecondary, textAlign }]}>{announcement.body}</Text>

            <View style={[styles.actions, dirStyles(isRTL).row]}>
              <Button label={t('announcements.viewNow')} variant="emergency" fullWidth={false} style={styles.action} trailing={<Chevron size={16} weight="bold" color={theme.colors.onEmergency} />} onPress={onViewNow} />
              <Button label={t('announcements.later')} variant="secondary" fullWidth={false} style={styles.action} onPress={onLater} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: { alignSelf: 'stretch', maxWidth: 420, maxHeight: '88%', borderRadius: radius.xl, overflow: 'hidden' },
  cardContent: { padding: space.xl, gap: space.lg },
  pagerWrap: { gap: space.sm },
  pager: { borderRadius: radius.lg },
  poster: { width: '100%', height: '100%' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { height: 7, borderRadius: 4 },
  header: { alignItems: 'flex-start', justifyContent: 'space-between', gap: space.md },
  headerMain: { flex: 1, alignItems: 'center', gap: space.md },
  bellCircle: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1 },
  close: { borderWidth: 0 },
  actions: { gap: space.md },
  action: { flex: 1 }
})
