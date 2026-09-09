import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useVideoPlayer, VideoView } from 'expo-video'
import { civicColors } from '../lib/theme'
import { detectDeviceLanguage, type AppLanguage } from '../lib/i18n'

// Metro needs static string literals to resolve requires - can't build the
// path from the current language at runtime, so each language's video is
// required separately here and looked up below. Mirrors LaunchScreen.web.tsx.
const VIDEO_BY_LOCALE: Record<AppLanguage, number> = {
  ar: require('./launch-video-ar.mp4'),
  he: require('./launch-video-he.mp4'),
  en: require('./launch-video-en.mp4')
}

/**
 * Native: same per-language video background as web. This screen renders
 * before LanguageDirectionProvider is ready (it IS the loading gate shown
 * while i18n/fonts initialize), so there's no i18n.language to read yet -
 * reuses the same device-locale detection initI18n falls back to before a
 * stored preference exists, so the very first thing a user sees already
 * guesses right instead of defaulting to Arabic for everyone.
 */
export function LaunchScreen() {
  const [locale, setLocale] = useState<AppLanguage>('ar')
  useEffect(() => { setLocale(detectDeviceLanguage()) }, [])
  const videoSource = VIDEO_BY_LOCALE[locale] ?? VIDEO_BY_LOCALE.ar

  const player = useVideoPlayer(videoSource, p => {
    p.loop = true
    p.muted = true
    p.play()
  })

  return (
    <View style={styles.launch}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </View>
  )
}

const styles = StyleSheet.create({
  launch: { flex: 1, backgroundColor: civicColors.fog, overflow: 'hidden' }
})
