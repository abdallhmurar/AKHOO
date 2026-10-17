import { useEffect, useState } from 'react'
import { AccessibilityInfo, AppState, Image, StyleSheet, View } from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { civicColors } from '../../lib/theme'

// These portrait clips include translated text. Fit the entire frame so that
// a different device aspect ratio cannot cut that text or the characters off.
export function IntroVideo({ source, active = true }: { source: number; active?: boolean }) {
  const [foreground, setForeground] = useState(AppState.currentState === 'active')
  const [reduced, setReduced] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [firstFrame, setFirstFrame] = useState(false)
  const [failed, setFailed] = useState(false)
  const player = useVideoPlayer(source, video => {
    video.loop = true
    video.muted = true
    video.audioMixingMode = 'mixWithOthers'
    video.staysActiveInBackground = false
    video.showNowPlayingNotification = false
  })
  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value) }).catch(() => {})
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    const app = AppState.addEventListener('change', state => setForeground(state === 'active'))
    const sync = (status: string) => { setLoaded(status === 'readyToPlay'); setFailed(status === 'error') }
    sync(player.status)
    const status = player.addListener('statusChange', event => sync(event.status))
    return () => { mounted = false; motion.remove(); app.remove(); status.remove() }
  }, [player])
  useEffect(() => {
    if (active && foreground && loaded && !reduced && !failed) player.play()
    else player.pause()
    return () => player.pause()
  }, [player, active, foreground, loaded, reduced, failed])
  return <View style={styles.frame} pointerEvents="none" accessible={false} accessibilityElementsHidden>
    {!failed ? <VideoView player={player} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} contentFit="contain" nativeControls={false} fullscreenOptions={{ enable: false }} allowsPictureInPicture={false} allowsVideoFrameAnalysis={false} onFirstFrameRender={() => setFirstFrame(true)} /> : null}
    {!firstFrame || failed ? <View style={styles.fallback}><Image source={require('../../../assets/images/icon.png')} style={styles.logo} resizeMode="contain" /></View> : null}
  </View>
}
const styles = StyleSheet.create({
  frame: { flex: 1, overflow: 'hidden', backgroundColor: civicColors.fog },
  fallback: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: civicColors.fog },
  logo: { width: 100, height: 100, borderRadius: 24 },
})
