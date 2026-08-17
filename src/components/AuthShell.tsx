import type { PropsWithChildren, ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors, font, radius, space } from '../lib/theme'
import { Screen } from './Screen'
import { IllustrationHero } from './IllustrationHero'
import type { IllustrationScene } from '../illustrations'

export function AuthShell({
  scene,
  title,
  subtitle,
  back,
  children
}: PropsWithChildren<{ scene: IllustrationScene; title: string; subtitle?: string; back?: ReactNode }>) {
  return (
    <Screen contentStyle={styles.screenContent}>
      <IllustrationHero scene={scene} height={230} showWordmark={!back} />
      <View style={styles.sheet}>
        {back}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.body}>{children}</View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  screenContent: { padding: 0, flexGrow: 1 },
  sheet: {
    flexGrow: 1,
    marginTop: -radius.sheet,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: space.xxl,
    paddingTop: space.xxl + 4
  },
  title: { fontFamily: font.extraBold, fontSize: 24, color: colors.text, textAlign: 'right' },
  subtitle: { fontFamily: font.regular, fontSize: 14, color: colors.muted, textAlign: 'right', marginTop: 6, lineHeight: 21 },
  body: { marginTop: space.xl, gap: space.lg }
})
