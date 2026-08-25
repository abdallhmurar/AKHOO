import type { PropsWithChildren, ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight } from 'phosphor-react-native'
import { colors, font, radius, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { Screen } from './Screen'

// Auth V2 - rebuilt to closely follow a provided reference (flat minimal
// canvas, small circular back chevron, large centered title, short
// centered subtitle, no illustration/hero image). Deliberately NOT built
// on top of AuthShell/IllustrationHero - the brief was explicit that the
// reference image, not SANAD's current auth layout, is the visual target.
// Brand adaptation: the reference's own neutral background/bright green
// are swapped for SANAD's real tokens (colors.bg, colors.forest); layout,
// spacing, density and typography hierarchy follow the reference closely.
export function AuthScreenLayout({
  title,
  subtitle,
  onBack,
  children
}: PropsWithChildren<{
  title: string
  subtitle?: string
  onBack?: () => void
}>) {
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  return (
    <Screen contentStyle={styles.content}>
      <View style={[styles.topRow, dir.row]}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={8}>
            <BackIcon size={18} color={colors.forest} />
          </Pressable>
        ) : (
          <View style={styles.backButtonSpacer} />
        )}
      </View>

      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.body}>{children}</View>
    </Screen>
  )
}

// Small helper so screens can render a link/footer row under the primary
// action without re-declaring the same centered/muted text style each time.
export function AuthFooterText({ children }: { children: ReactNode }) {
  return <Text style={styles.footer}>{children}</Text>
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingTop: space.lg },
  topRow: { minHeight: 38, marginBottom: space.xl },
  backButton: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  backButtonSpacer: { width: 38, height: 38 },

  title: { fontFamily: font.extraBold, fontSize: 27, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: font.regular, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 21, marginTop: 8, alignSelf: 'center', maxWidth: '88%' },

  body: { marginTop: space.xxl, gap: space.lg },
  footer: { color: colors.muted, fontFamily: font.regular, fontSize: 13.5, textAlign: 'center' }
})
