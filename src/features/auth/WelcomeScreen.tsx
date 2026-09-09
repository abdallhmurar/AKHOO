import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useVideoPlayer, VideoView } from 'expo-video'
import { space } from '../../lib/theme'
import { Button } from '../../components/ui'

type Locale = 'ar' | 'he' | 'en'

// Metro needs static string literals to resolve requires - can't build the
// path from the current language at runtime, so each language's video is
// required separately here and looked up below. Mirrors WelcomeScreen.web.tsx.
const VIDEO_BY_LOCALE: Record<Locale, number> = {
  ar: require('./welcome-video-ar.mp4'),
  he: require('./welcome-video-he.mp4'),
  en: require('./welcome-video-en.mp4')
}

/** Native: same per-language video background as web (each has its own baked-in text already). */
export function WelcomeScreen() {
  const { t, i18n } = useTranslation()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const locale: Locale = i18n.language.startsWith('he') ? 'he' : i18n.language.startsWith('en') ? 'en' : 'ar'
  const videoSource = VIDEO_BY_LOCALE[locale] ?? VIDEO_BY_LOCALE.ar

  const player = useVideoPlayer(videoSource, p => {
    p.loop = true
    p.muted = true
    p.play()
  })

  return (
    <View style={styles.welcomeBg}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} pointerEvents="none" />
      <View style={[styles.welcomeActions, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
        <Button label={t('welcome.createAccount')} size="lg" onPress={() => router.push('/signup')} />
        <Button label={t('welcome.haveAccount')} variant="secondary" size="lg" onPress={() => router.push('/login')} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  welcomeBg: { flex: 1, justifyContent: 'flex-end', overflow: 'hidden' },
  welcomeActions: { paddingHorizontal: space.xl, paddingTop: space.lg, gap: space.md }
})
