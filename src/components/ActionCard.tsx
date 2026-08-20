import type { ComponentType } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight } from 'phosphor-react-native'
import type { IconProps } from 'phosphor-react-native'
import { colors, font, radius, shadow, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { Tactile } from './Tactile'

// The Home screen's two primary actions must never read as equal weight
// (design brief section 13/62) - primary is the bold, filled, higher-
// contrast surface (need-help is the time-critical path), secondary is a
// calmer surface variant. Both share one component so they stay visually
// related rather than looking like two unrelated card systems.
export function ActionCard({
  variant,
  Icon,
  title,
  text,
  onPress
}: {
  variant: 'primary' | 'secondary'
  Icon: ComponentType<IconProps>
  title: string
  text: string
  onPress: () => void
}) {
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight
  const primary = variant === 'primary'

  return (
    <Tactile onPress={onPress} style={[styles.card, primary ? styles.primary : styles.secondary]} scaleTo={0.98}>
      <View style={[styles.top, dir.row]}>
        <View style={[styles.iconWrap, primary ? styles.iconWrapPrimary : styles.iconWrapSecondary]}>
          <Icon size={28} color={primary ? colors.sand : colors.forest} weight="duotone" />
        </View>
        <View style={[styles.forwardWrap, primary ? styles.forwardWrapPrimary : styles.forwardWrapSecondary]}>
          <ForwardIcon size={16} color={primary ? '#fff' : colors.forest} />
        </View>
      </View>
      <Text style={[styles.title, dir.textStart, primary && styles.titlePrimary]}>{title}</Text>
      <Text style={[styles.text, dir.textStart, primary && styles.textPrimary]}>{text}</Text>
    </Tactile>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.xl, marginBottom: space.lg },
  primary: { backgroundColor: colors.forest, ...shadow.elevated },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadow.soft },

  top: { justifyContent: 'space-between', alignItems: 'center' },
  iconWrap: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  iconWrapPrimary: { backgroundColor: '#FFFFFF22' },
  iconWrapSecondary: { backgroundColor: colors.sageSoft },
  forwardWrap: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  forwardWrapPrimary: { backgroundColor: '#FFFFFF22' },
  forwardWrapSecondary: { backgroundColor: colors.sageSoft },

  title: { fontSize: 19, fontFamily: font.extraBold, color: colors.text, marginTop: space.lg },
  titlePrimary: { color: '#fff' },
  text: { color: colors.muted, fontSize: 13.5, fontFamily: font.regular, lineHeight: 20, marginTop: 4 },
  textPrimary: { color: '#FFFFFFCC' }
})
