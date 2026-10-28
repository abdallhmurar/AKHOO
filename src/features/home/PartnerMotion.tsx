import { useCallback, useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, AppState, Image, StyleSheet, View, useWindowDimensions } from 'react-native'
import type { ViewStyle } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useVideoPlayer, VideoView } from 'expo-video'
import { useGuide } from '../guide/GuideProvider'
import { useSanadTheme } from '../../lib/theme'
import { mediaFrame } from '../../components/motion/mediaLayout'

// The three looping scenes of the partner/home layout (Android). The same approved artwork and videos as the iPhone
// build (`Motion.ios.tsx`), played with expo-video. It lives here, not in `Motion.tsx`, so the other Android screens
// keep their current presentation. Videos are silent, pause when the screen is not focused, the app is in the
// background, the scene is off screen, a guide covers it or Reduce Motion is on; the poster shows meanwhile.
const scenes = {
  'partner-home': { video: require('../../../assets/partner-home/partner-approved-loop.mp4'), poster: require('./web-assets/partner-approved-poster.jpg'), aspect: 1648 / 544, anchor: 'center' as const },
  'help-rose': { video: require('../../../assets/help-rose/help-rose-loop.mp4'), poster: require('../../../assets/help-rose/help-rose-poster.jpg'), aspect: 2, anchor: 'left' as const },
  'helper-home': { video: require('../../../previews/home-motion/assets/helper-3d.mp4'), poster: require('../../../previews/home-motion/assets/helper-3d-poster.png'), aspect: 1168 / 784, anchor: 'left' as const }
}

export type PartnerSceneName = keyof typeof scenes

function dimension(value: unknown): number | `${number}%` | undefined {
  return typeof value === 'number' ? value : typeof value === 'string' && /^\d+(\.\d+)?%$/.test(value) ? value as `${number}%` : undefined
}

export function PartnerScene({ name, style, fit = 'cover', paused = false }: { name: PartnerSceneName; style?: ViewStyle; fit?: 'contain' | 'cover'; paused?: boolean }) {
  const scene = scenes[name]
  const theme = useSanadTheme()
  const ref = useRef<View>(null)
  const { height: viewportHeight, width: viewportWidth } = useWindowDimensions()
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(AppState.currentState === 'active')
  const [reduced, setReduced] = useState(true)
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const guide = useGuide()
  const player = useVideoPlayer(scene.video, video => {
    video.loop = true
    video.muted = true
    video.staysActiveInBackground = false
    video.showNowPlayingNotification = false
  })
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false) }, []))
  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value) }).catch(() => { if (mounted) setReduced(false) })
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
  const playing = focused && active && visible && loaded && !reduced && !failed && !guide?.blocking && !paused
  // useVideoPlayer owns teardown, so playback is only toggled here, never in a cleanup.
  useEffect(() => { if (playing) player.play(); else player.pause() }, [player, playing])

  const frame: ViewStyle = {
    width: dimension(style?.width) ?? '100%', height: dimension(style?.height),
    aspectRatio: style?.height ? undefined : typeof style?.aspectRatio === 'number' ? style.aspectRatio : 1.5,
    borderRadius: typeof style?.borderRadius === 'number' ? style.borderRadius : 20
  }
  const artwork = mediaFrame(size.width, size.height, scene.aspect, fit, scene.anchor)
  return <View ref={ref} collapsable={false} style={[styles.scene, frame]} onLayout={event => setSize(event.nativeEvent.layout)}>
    <View pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants" style={[styles.artwork, artwork, theme.isDark && { opacity: 0.72 }]}>
      {!failed && !reduced ? <VideoView player={player} style={styles.fill} nativeControls={false} contentFit="contain" fullscreenOptions={{ enable: false }} allowsPictureInPicture={false} onFirstFrameRender={() => setReady(true)} /> : null}
      {!ready || failed || reduced ? <Image source={scene.poster} style={styles.fill} resizeMode="cover" /> : null}
    </View>
  </View>
}

const styles = StyleSheet.create({
  scene: { position: 'relative', overflow: 'hidden' },
  artwork: { position: 'absolute' },
  fill: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' }
})
