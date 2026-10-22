import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { IntroVideo } from '../components/motion/IntroVideo.ios'
import { civicColors } from '../lib/theme'
import { detectDeviceLanguage, getPreferredAppLanguage, type AppLanguage } from '../lib/i18n'

const videos: Record<AppLanguage, number> = {
  ar: require('./launch-video-ar.mp4'), he: require('./launch-video-he.mp4'), en: require('./launch-video-en.mp4'),
}
export function LaunchScreen() {
  const [locale, setLocale] = useState<AppLanguage | null>(null)
  useEffect(() => {
    let mounted = true
    getPreferredAppLanguage().catch(detectDeviceLanguage).then(value => { if (mounted) setLocale(value) })
    return () => { mounted = false }
  }, [])
  return <View style={styles.fill}>{locale ? <IntroVideo key={locale} source={videos[locale]} /> : null}</View>
}
const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: civicColors.fog } })
