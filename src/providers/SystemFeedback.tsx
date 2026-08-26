import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { WifiSlash } from 'phosphor-react-native'
import { useToast } from '../components/ui'
import { localizeAppError, subscribeToAppErrors } from '../services/errors'
import { useAppTypography } from '../lib/typography'
import { radius, shadow, space, useSanadTheme } from '../lib/theme'
import { useNetworkStatus } from './QueryProvider'
import { useLanguageDirection } from './LanguageDirectionProvider'

export function ErrorToastBridge() {
  const toast = useToast()
  const { language } = useLanguageDirection()
  useEffect(() => subscribeToAppErrors(({ error }) => toast.show(localizeAppError(error, (ar, he, en) => language === 'en' ? en : language === 'he' ? he : ar), 'error')), [language, toast])
  return null
}

export function ConnectivityBanner() {
  const { isOnline } = useNetworkStatus()
  const { language } = useLanguageDirection()
  const theme = useSanadTheme()
  const typography = useAppTypography()
  if (isOnline) return null
  const label = language === 'en' ? 'Offline · Some live updates are paused' : language === 'he' ? 'אין חיבור · חלק מהעדכונים מושהים' : 'لا يوجد اتصال · بعض التحديثات المباشرة متوقفة'
  return <View accessibilityLiveRegion="polite" style={[styles.banner, shadow.elevated, { backgroundColor: theme.colors.textPrimary }]}><WifiSlash size={18} color={theme.colors.reward} /><Text style={[typography.caption, { color: theme.colors.textInverse, flex: 1 }]}>{label}</Text></View>
}

const styles = StyleSheet.create({ banner: { position: 'absolute', left: space.lg, right: space.lg, bottom: 86, minHeight: 44, borderRadius: radius.md, paddingHorizontal: space.lg, paddingVertical: space.md, flexDirection: 'row', alignItems: 'center', gap: space.sm, zIndex: 999 } })
