import type { PropsWithChildren, ReactElement } from 'react'
import { RefreshControlProps, SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native'
import { colors } from '../lib/theme'

export function Screen({ children, scroll = true, contentStyle, refreshControl }: PropsWithChildren<{ scroll?: boolean; contentStyle?: ViewStyle; refreshControl?: ReactElement<RefreshControlProps> }>) {
  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>
          {children}
        </ScrollView>
      ) : (
        <SafeAreaView style={[styles.content, styles.flex, contentStyle]}>{children}</SafeAreaView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  // maxWidth only ever engages on wide web viewports (phones are already
  // narrower than 480) - keeps every screen from stretching into an
  // unreadable full-bleed line on tablet/desktop without touching any
  // individual screen's own layout.
  content: { padding: 20, paddingBottom: 36, width: '100%', maxWidth: 480, alignSelf: 'center' },
  flex: { flex: 1 }
})
