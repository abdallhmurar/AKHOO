import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AccessibilityInfo, AppState, Image, Linking, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import type { ViewStyle } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useTranslation } from 'react-i18next'
import { useGuide } from '../../features/guide/GuideProvider'
import { useIsRTL } from '../../lib/direction'
import { useAppTypography } from '../../lib/typography'
import { useSanadTheme } from '../../lib/theme'
import type { MotionSceneProps } from './Motion.types'
import { motionImages, motionIcons, motionMedia } from './media.ios'

function dimension(value: unknown): number | `${number}%` | undefined {
  return typeof value === 'number' ? value : typeof value === 'string' && /^\d+(\.\d+)?%$/.test(value) ? value as `${number}%` : undefined
}

export function MotionScene(props: MotionSceneProps) {
  const media = motionMedia[props.name]
  return media ? <Scene key={props.name} {...props} media={media} /> : null
}

function Scene({ media, style, fit = 'cover', children }: MotionSceneProps & { media: { video: number; poster: number } }) {
  const ref = useRef<View>(null)
  const { height: viewportHeight, width: viewportWidth } = useWindowDimensions()
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(AppState.currentState === 'active')
  const [reduced, setReduced] = useState(true)
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const guide = useGuide()
  const player = useVideoPlayer(media.video, video => {
    video.loop = true
    video.muted = true
    video.audioMixingMode = 'mixWithOthers'
    video.staysActiveInBackground = false
    video.showNowPlayingNotification = false
  })
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false) }, []))
  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value) }).catch(() => {})
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    const app = AppState.addEventListener('change', state => setActive(state === 'active'))
    const status = player.addListener('statusChange', event => { if (event.status === 'error') setFailed(true) })
    return () => { mounted = false; motion.remove(); app.remove(); status.remove() }
  }, [player])
  useEffect(() => {
    if (!focused || !active || reduced) return
    let mounted = true
    const measure = () => ref.current?.measureInWindow((x, y, width, height) => {
      if (mounted) setVisible(width > 0 && height > 0 && y + height > 0 && y < viewportHeight && x + width > 0 && x < viewportWidth)
    })
    measure()
    const timer = setInterval(measure, 500)
    return () => { mounted = false; clearInterval(timer) }
  }, [focused, active, reduced, viewportHeight, viewportWidth])
  useEffect(() => {
    if (focused && active && visible && !reduced && !failed && !guide?.blocking) player.play()
    else player.pause()
    return () => player.pause()
  }, [player, focused, active, visible, reduced, failed, guide?.blocking])
  const frame: ViewStyle = {
    width: dimension(style?.width) ?? '100%', height: dimension(style?.height),
    aspectRatio: style?.height ? undefined : typeof style?.aspectRatio === 'number' ? style.aspectRatio : 1.5,
    borderRadius: typeof style?.borderRadius === 'number' ? style.borderRadius : 20,
  }
  return <View ref={ref} collapsable={false} style={[styles.scene, frame]}>
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden style={StyleSheet.absoluteFill}>
      {!failed && !reduced ? <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit={fit} fullscreenOptions={{ enable: false }} allowsPictureInPicture={false} onFirstFrameRender={() => setReady(true)} /> : null}
      {!ready || failed || reduced ? <Image source={media.poster} style={StyleSheet.absoluteFill} resizeMode={fit} /> : null}
    </View>
    {children}
  </View>
}

export function MotionHeader({ children, kind = 'details' }: { children?: ReactNode; kind?: 'road' | 'request' | 'details' }) {
  return <View style={[styles.header, kind === 'road' && { aspectRatio: 3, minHeight: 0 }]}>
    <Image source={motionImages[kind]} accessible={false} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: kind === 'details' ? 0.35 : 1 }]} resizeMode="cover" />
    <View style={styles.headerCopy}>{children}</View>
  </View>
}
export function PerksHeader() {
  const { t, i18n } = useTranslation()
  const isRTL = useIsRTL()
  const typography = useAppTypography()
  const theme = useSanadTheme()
  const arabic = i18n.language.startsWith('ar')
  return <View style={styles.perks} accessibilityRole="header" accessibilityLabel={t('perks.title')}>
    <MotionScene name="perks" style={{ aspectRatio: 7 / 3, borderRadius: 0 }} fit="contain" />
    {!arabic ? <View style={[styles.perksCopy, { backgroundColor: theme.isDark ? '#153347' : '#eefaff', right: 0 }]}>
      <Text style={[typography.h1, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('perks.title')}</Text>
      <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('perks.hubSubtitle')}</Text>
    </View> : null}
  </View>
}
export function ArtIcon({ name, size = 32 }: { name: string; size?: number }) {
  const source = motionIcons[name]
  return source ? <Image accessible={false} source={source} style={{ width: size, height: size }} resizeMode="contain" /> : null
}
export function IconCredits() {
  const theme = useSanadTheme()
  return <Text style={[styles.credits, { color: theme.colors.textMuted }]} accessibilityRole="link" onPress={() => void Linking.openURL('https://www.flaticon.com/')}>
    Icons: setiawanap, IconMarketPK, smashingstocks, Magnific, DinosoftLabs, Roundicons, VectorPortal, Pixel perfect, Fathema Khanom & Smashicons — Flaticon
  </Text>
}
const styles = StyleSheet.create({
  scene: { position: 'relative', overflow: 'hidden' },
  header: { minHeight: 130, marginHorizontal: -20, marginTop: -16, overflow: 'hidden' },
  headerCopy: { padding: 20, minHeight: 130, justifyContent: 'center', gap: 8 },
  perks: { position: 'relative', marginHorizontal: -16, marginTop: -16 },
  perksCopy: { position: 'absolute', top: 0, bottom: 0, width: '58%', padding: 16, justifyContent: 'center', gap: 6 },
  credits: { fontSize: 8, lineHeight: 12, textAlign: 'center', paddingVertical: 8, writingDirection: 'ltr' },
})
