import type { PropsWithChildren } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { useFonts } from 'expo-font'
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular'
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium'
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold'
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold'
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold'
import { NotoSansArabic_400Regular } from '@expo-google-fonts/noto-sans-arabic/400Regular'
import { NotoSansArabic_500Medium } from '@expo-google-fonts/noto-sans-arabic/500Medium'
import { NotoSansArabic_600SemiBold } from '@expo-google-fonts/noto-sans-arabic/600SemiBold'
import { NotoSansArabic_700Bold } from '@expo-google-fonts/noto-sans-arabic/700Bold'
import { NotoSansArabic_800ExtraBold } from '@expo-google-fonts/noto-sans-arabic/800ExtraBold'
import { NotoSansHebrew_400Regular } from '@expo-google-fonts/noto-sans-hebrew/400Regular'
import { NotoSansHebrew_500Medium } from '@expo-google-fonts/noto-sans-hebrew/500Medium'
import { NotoSansHebrew_600SemiBold } from '@expo-google-fonts/noto-sans-hebrew/600SemiBold'
import { NotoSansHebrew_700Bold } from '@expo-google-fonts/noto-sans-hebrew/700Bold'
import { NotoSansHebrew_800ExtraBold } from '@expo-google-fonts/noto-sans-hebrew/800ExtraBold'
import { civicColors, palette } from '../lib/theme'
import { AuthProvider } from './AuthProvider'
import { LanguageDirectionProvider, useLanguageDirection } from './LanguageDirectionProvider'
import { MissionProvider } from './MissionProvider'
import { QueryProvider } from './QueryProvider'
import { ToastProvider } from '../components/ui'
import { AppErrorBoundary } from './AppErrorBoundary'
import { ConnectivityBanner, ErrorToastBridge } from './SystemFeedback'

export function AppProviders({ children }: PropsWithChildren) {
  const [fontsLoaded] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
    NotoSansArabic_400Regular, NotoSansArabic_500Medium, NotoSansArabic_600SemiBold, NotoSansArabic_700Bold, NotoSansArabic_800ExtraBold,
    NotoSansHebrew_400Regular, NotoSansHebrew_500Medium, NotoSansHebrew_600SemiBold, NotoSansHebrew_700Bold, NotoSansHebrew_800ExtraBold
  })
  if (!fontsLoaded) return <LaunchScreen />
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <LanguageDirectionProvider>
          <LanguageReadyGate>
            <QueryProvider>
              <AuthProvider>
                <MissionProvider>
                  <BottomSheetModalProvider>
                    <ToastProvider><AppErrorBoundary>{children}</AppErrorBoundary><ErrorToastBridge /><ConnectivityBanner /></ToastProvider>
                  </BottomSheetModalProvider>
                </MissionProvider>
              </AuthProvider>
            </QueryProvider>
          </LanguageReadyGate>
        </LanguageDirectionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

function LanguageReadyGate({ children }: PropsWithChildren) {
  const { ready } = useLanguageDirection()
  return ready ? children : <LaunchScreen />
}

export function LaunchScreen() {
  return (
    <View style={styles.launch}>
      <View style={styles.mark}><Text style={styles.markText}>S</Text></View>
      <Text style={styles.wordmark}>SANAD</Text>
      <ActivityIndicator color={civicColors.signalBlue} style={styles.spinner} />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  launch: { flex: 1, backgroundColor: civicColors.fog, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 64, height: 64, borderRadius: 22, backgroundColor: civicColors.navy, alignItems: 'center', justifyContent: 'center' },
  markText: { color: palette.onCivic, fontFamily: 'Inter_800ExtraBold', fontSize: 30 },
  wordmark: { color: civicColors.navy, fontFamily: 'Inter_800ExtraBold', fontSize: 20, letterSpacing: 3, marginTop: 16 },
  spinner: { marginTop: 24 }
})
