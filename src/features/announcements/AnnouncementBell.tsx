import { useEffect, useRef } from 'react'
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Bell } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { radius, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAnnouncements } from './useAnnouncements'

// Small bell for the top of the home screen. While there is anything unread
// it shakes (a short burst, a pause, repeat) and carries a count badge; once
// everything is read it goes still. Skips the motion entirely when the OS
// "reduce motion" setting is on - the badge still says there is something new.
export function AnnouncementBell() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const router = useRouter()
  const { t } = useTranslation()
  const { unread } = useAnnouncements()
  const count = unread.length
  const hasUnread = count > 0
  const rotation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!hasUnread) {
      rotation.setValue(0)
      return
    }
    let cancelled = false
    let loop: Animated.CompositeAnimation | null = null
    AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (cancelled || reduce) return
      const step = (toValue: number) => Animated.timing(rotation, { toValue, duration: 85, easing: Easing.linear, useNativeDriver: true })
      loop = Animated.loop(Animated.sequence([step(1), step(-1), step(0.8), step(-0.8), step(0.45), step(-0.45), step(0), Animated.delay(1700)]))
      loop.start()
    }).catch(() => {})
    return () => {
      cancelled = true
      loop?.stop()
      rotation.setValue(0)
    }
  }, [hasUnread, rotation])

  const rotate = rotation.interpolate({ inputRange: [-1, 1], outputRange: ['-16deg', '16deg'] })

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hasUnread ? t('announcements.bellLabelUnread', { count }) : t('announcements.bellLabel')}
      onPress={() => router.push('/announcements')}
      hitSlop={8}
      style={({ pressed }) => [styles.button, { backgroundColor: hasUnread ? theme.colors.emergencySoft : theme.colors.surface, borderColor: hasUnread ? theme.colors.emergency : theme.colors.border }, pressed && styles.pressed]}
    >
      <Animated.View style={{ transform: [{ rotate }] }}>
        <Bell size={22} weight={hasUnread ? 'fill' : 'regular'} color={hasUnread ? theme.colors.emergency : theme.colors.textPrimary} />
      </Animated.View>
      {hasUnread ? (
        <View style={[styles.badge, { backgroundColor: theme.colors.emergency, borderColor: theme.colors.background }]}>
          <Text style={[typography.caption, styles.badgeText, { color: theme.colors.onEmergency }]}>{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.94 }] },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, lineHeight: 12, fontWeight: '700' }
})
