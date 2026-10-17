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
import { mediaFrame } from './mediaLayout'
import { useVideoPlayback } from './useVideoPlayback.ios'

function dimension(value: unknown): number | `${number}%` | undefined {
  return typeof value === 'number' ? value : typeof value === 'string' && /^\d+(\.\d+)?%$/.test(value) ? value as `${number}%` : undefined
}

export function MotionScene(props: MotionSceneProps) {
  const media = motionMedia[props.name]
  return media ? <Scene key={props.name} {...props} media={media} /> : null
}

function Scene({ media, name, style, fit = 'cover', children }: MotionSceneProps & { media: { video: number; poster: number } }) {
  const ref = useRef<View>(null)
  const { height: viewportHeight, width: viewportWidth } = useWindowDimensions()
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(AppState.currentState === 'active')
  const [reduced, setReduced] = useState(true)
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [loaded, setLoaded] = useState(false)
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
    const syncStatus = (status: string) => { setLoaded(status === 'readyToPlay'); setFailed(status === 'error'); if (status !== 'readyToPlay') setReady(false) }
    syncStatus(player.status)
    const status = player.addListener('statusChange', event => syncStatus(event.status))
    return () => { mounted = false; motion.remove(); app.remove(); status.remove() }
  }, [player])
  useEffect(() => { if (reduced || failed) setReady(false) }, [reduced, failed])
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
  useVideoPlayback(player, focused && active && visible && loaded && !reduced && !failed && !guide?.blocking)
  const frame: ViewStyle = {
    width: dimension(style?.width) ?? '100%', height: dimension(style?.height),
    aspectRatio: style?.height ? undefined : typeof style?.aspectRatio === 'number' ? style.aspectRatio : 1.5,
    borderRadius: typeof style?.borderRadius === 'number' ? style.borderRadius : 20,
  }
  const artwork = mediaFrame(size.width, size.height, name === 'perks' ? 7 / 3 : 1168 / 784, fit, name === 'help' || name === 'helper-home' ? 'left' : 'center')
  return <View ref={ref} collapsable={false} style={[styles.scene, frame]} onLayout={event => setSize(event.nativeEvent.layout)}>
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden style={StyleSheet.absoluteFill}>
      {!failed && !reduced ? <VideoView player={player} style={[styles.artwork, artwork]} nativeControls={false} contentFit="contain" fullscreenOptions={{ enable: false }} allowsPictureInPicture={false} allowsVideoFrameAnalysis={false} onFirstFrameRender={() => setReady(true)} /> : null}
      {!ready || failed || reduced ? <Image source={media.poster} style={[styles.artwork, artwork]} resizeMode="cover" /> : null}
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
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const typography = useAppTypography()
  const theme = useSanadTheme()
  const [width, setWidth] = useState(0)
  return <View style={[styles.perks, { backgroundColor: theme.isDark ? '#153347' : '#eefaff', minHeight: width * 3 / 7 }]} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <View style={styles.perksArt} pointerEvents="none"><MotionScene name="perks" style={{ width, aspectRatio: 7 / 3, borderRadius: 0 }} fit="contain" /></View>
    <View style={styles.perksCopy}>
      <Text accessibilityRole="header" style={[typography.h2, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('perks.title')}</Text>
      <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('perks.hubSubtitle')}</Text>
    </View>
  </View>
}
export function ArtIcon({ name, size = 32 }: { name: string; size?: number }) {
  const source = motionIcons[name]
  return source ? <Image accessible={false} source={source} style={{ width: size, height: size }} resizeMode="contain" /> : null
}
export function IconCredits() {
  const theme = useSanadTheme()
  const { i18n } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const label = i18n.language.startsWith('ar') ? 'حقوق الأيقونات' : i18n.language.startsWith('he') ? 'קרדיט לאייקונים' : 'Icon credits'
  return <View><Text style={[styles.credits, { color: theme.colors.textMuted }]} accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(value => !value)}>{label} · Flaticon</Text>
    {expanded ? <Text style={[styles.credits, { color: theme.colors.textMuted }]} accessibilityRole="link" onPress={() => void Linking.openURL('https://www.flaticon.com/')}>
      setiawanap, IconMarketPK, smashingstocks, Magnific, DinosoftLabs, Roundicons, VectorPortal, Pixel perfect, Fathema Khanom & Smashicons — Flaticon
    </Text> : null}
  </View>
}
const styles = StyleSheet.create({
  scene: { position: 'relative', overflow: 'hidden' },
  artwork: { position: 'absolute' },
  header: { minHeight: 130, marginHorizontal: -20, marginTop: -16, overflow: 'hidden' },
  headerCopy: { padding: 20, minHeight: 130, justifyContent: 'center', gap: 8 },
  perks: { position: 'relative', marginHorizontal: -16, marginTop: -16, overflow: 'hidden', justifyContent: 'center' },
  perksArt: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '66%', overflow: 'hidden', justifyContent: 'center' },
  perksCopy: { marginLeft: '66%', paddingHorizontal: 10, paddingVertical: 16, justifyContent: 'center', gap: 6 },
  credits: { fontSize: 9, textAlign: 'center', paddingVertical: 4 },
})
