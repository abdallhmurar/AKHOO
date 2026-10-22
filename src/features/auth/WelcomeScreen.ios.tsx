import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { IntroVideo } from '../../components/motion/IntroVideo.ios'
import { space, useSanadTheme } from '../../lib/theme'
import { Button } from '../../components/ui'

const videos = {
  ar: require('./welcome-video-ar.mp4'), he: require('./welcome-video-he.mp4'), en: require('./welcome-video-en.mp4'),
}
export function WelcomeScreen() {
  const { t, i18n } = useTranslation()
  const theme = useSanadTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [focused, setFocused] = useState(false)
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false) }, []))
  const locale = i18n.language.startsWith('he') ? 'he' : i18n.language.startsWith('en') ? 'en' : 'ar'
  return <View style={[styles.page, { paddingTop: insets.top, backgroundColor: theme.colors.background }]}>
    <IntroVideo key={locale} source={videos[locale]} active={focused} />
    <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>
      <Button label={t('welcome.createAccount')} size="lg" onPress={() => router.push('/signup')} />
      <Button label={t('welcome.haveAccount')} variant="secondary" size="lg" onPress={() => router.push('/login')} />
    </View>
  </View>
}
const styles = StyleSheet.create({ page: { flex: 1 }, actions: { paddingHorizontal: space.xl, paddingTop: space.md, gap: space.md } })
