import type { ComponentType } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import type { IconProps } from 'phosphor-react-native'
import { colors, font, radius, space } from '../lib/theme'

export function EmptyState({ Icon, title, message }: { Icon: ComponentType<IconProps>; title: string; message?: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon size={26} color={colors.sage} weight="duotone" />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6, paddingVertical: space.xxl, paddingHorizontal: space.lg, backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  iconWrap: { width: 52, height: 52, borderRadius: radius.pill, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  title: { color: colors.text, fontFamily: font.bold, fontSize: 15, textAlign: 'center' },
  message: { color: colors.muted, fontFamily: font.regular, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 2, maxWidth: 260 }
})
