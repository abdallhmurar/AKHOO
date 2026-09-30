import { GuideScrollView, GuideTarget } from '../../features/guide/GuideProvider'
import type { PropsWithChildren, ReactNode } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import type { ScrollViewProps, ViewStyle } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { space, useSanadTheme } from '../../lib/theme'

type AppScreenProps = PropsWithChildren<{
  scroll?: boolean
  header?: ReactNode
  footer?: ReactNode
  background?: string
  contentStyle?: ViewStyle
  scrollProps?: ScrollViewProps
  guideFooterId?: string
  unsafeTop?: boolean
  unsafeBottom?: boolean
}>

export function AppScreen({ children, scroll = true, header, footer, background, contentStyle, scrollProps, guideFooterId, unsafeTop = false, unsafeBottom = false }: AppScreenProps) {
  const theme = useSanadTheme()
  const insets = useSafeAreaInsets()
  const top = unsafeTop ? 0 : insets.top
  const bottom = unsafeBottom ? 0 : insets.bottom
  const content = <View style={[styles.content, contentStyle]}>{children}</View>
  return (
    <View style={[styles.fill, { backgroundColor: background ?? theme.colors.background, paddingTop: top }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      {header}
      {scroll ? (
        <GuideScrollView {...scrollProps} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.scroll, { paddingBottom: bottom + (footer ? 104 : space.xxl) }, scrollProps?.contentContainerStyle]} showsVerticalScrollIndicator={false}>
          <View style={styles.webFrame}>{content}</View>
        </GuideScrollView>
      ) : <View style={[styles.flexContent, { paddingBottom: bottom }]}><View style={styles.webFrame}>{content}</View></View>}
      {footer ? <View style={[styles.footer, { paddingBottom: Math.max(bottom, space.md), backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} >{guideFooterId ? <GuideTarget id={guideFooterId}>{footer}</GuideTarget> : footer}</View> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flexContent: { flex: 1 },
  webFrame: { width: '100%', maxWidth: Platform.OS === 'web' ? 560 : undefined, alignSelf: 'center', flex: 1 },
  scroll: { flexGrow: 1 },
  content: { paddingHorizontal: space.xl, paddingTop: space.lg, gap: space.xl },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.xl, paddingTop: space.md }
})
