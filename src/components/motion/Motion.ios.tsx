import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AccessibilityInfo, AppState, Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
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
import { BlendedArt } from './BlendedArt.ios'

function dimension(value: unknown): number | `${number}%` | undefined {
  return typeof value === 'number' ? value : typeof value === 'string' && /^\d+(\.\d+)?%$/.test(value) ? value as `${number}%` : undefined
}

type NativeMotionProps = MotionSceneProps & { paused?: boolean }

export function MotionScene(props: NativeMotionProps) {
  const media = motionMedia[props.name]
  return media ? <Scene key={props.name} {...props} media={media} /> : null
}

function Scene({ media, name, style, fit = 'cover', children, paused = false }: NativeMotionProps & { media: { video: number; poster: number } }) {
  const theme = useSanadTheme()
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
  useVideoPlayback(player, focused && active && visible && loaded && !reduced && !failed && !guide?.blocking && !paused)
  const frame: ViewStyle = {
    width: dimension(style?.width) ?? '100%', height: dimension(style?.height),
    aspectRatio: style?.height ? undefined : typeof style?.aspectRatio === 'number' ? style.aspectRatio : 1.5,
    borderRadius: typeof style?.borderRadius === 'number' ? style.borderRadius : 20,
  }
  const artwork = mediaFrame(size.width, size.height, name === 'partner-home' ? 1648 / 544 : name === 'help-rose' ? 2 : name === 'perks' ? 7 / 3 : 1168 / 784, fit, name === 'help' || name === 'help-rose' || name === 'helper-home' ? 'left' : 'center')
  const content = <>
    {!failed && !reduced ? <VideoView player={player} style={styles.fill} nativeControls={false} contentFit="contain" fullscreenOptions={{ enable: false }} allowsPictureInPicture={false} allowsVideoFrameAnalysis={false} onFirstFrameRender={() => setReady(true)} /> : null}
    {!ready || failed || reduced ? <Image source={media.poster} style={styles.fill} resizeMode="cover" /> : null}
  </>
  return <View ref={ref} collapsable={false} style={[styles.scene, frame]} onLayout={event => setSize(event.nativeEvent.layout)}>
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden style={[styles.artwork, artwork, theme.isDark && { opacity: name === 'perks' ? 0.62 : 0.72 }]}>
      {fit === 'contain' && name !== 'perks' ? <BlendedArt edge={name === 'help-rose' ? 'right' : 'soft'}>{content}</BlendedArt> : content}
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
  const { fontScale } = useWindowDimensions()
  const [width, setWidth] = useState(0)
  const stacked = fontScale >= 1.3
  // Keep the two people and logo intact; the rightmost third contains baked-in Arabic.
  const artWidth = stacked ? Math.min(width, 260) : width * (width < 350 ? 0.48 : 0.54)
  const videoWidth = artWidth / 0.66
  return <View style={[styles.perks, { backgroundColor: theme.isDark ? '#153347' : '#eefaff', minHeight: 150 }]} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <View style={[styles.perksArt, { width: artWidth }, stacked && { position: 'relative', height: videoWidth * 3 / 7, alignSelf: 'center' }]} pointerEvents="none">
      <View style={{ height: videoWidth * 3 / 7, overflow: 'hidden' }}><BlendedArt edge="soft"><MotionScene name="perks" style={{ width: videoWidth, aspectRatio: 7 / 3, borderRadius: 0 }} fit="contain" /></BlendedArt></View>
    </View>
    <View style={[styles.perksCopy, { marginLeft: stacked ? 0 : artWidth }]}>
      <Text accessibilityRole="header" style={[typography.h2, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('perks.title')}</Text>
      <Text style={[typography.small, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('perks.hubSubtitle')}</Text>
    </View>
  </View>
}
export function ArtIcon({ name, size = 32 }: { name: string; size?: number }) {
  const source = motionIcons[name]
  return source ? <Image accessible={false} source={source} style={{ width: size, height: size }} resizeMode="contain" /> : null
}
const styles = StyleSheet.create({
  scene: { position: 'relative', overflow: 'hidden' },
  artwork: { position: 'absolute' },
  fill: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  header: { minHeight: 130, marginHorizontal: -20, marginTop: -16, overflow: 'hidden' },
  headerCopy: { padding: 20, minHeight: 130, justifyContent: 'center', gap: 8 },
  perks: { position: 'relative', marginHorizontal: -16, marginTop: -16, overflow: 'hidden', justifyContent: 'center' },
  perksArt: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden', justifyContent: 'center' },
  perksCopy: { paddingHorizontal: 14, paddingVertical: 20, justifyContent: 'center', gap: 6 },
})
