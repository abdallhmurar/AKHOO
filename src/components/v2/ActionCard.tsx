import type { Icon } from 'phosphor-react-native'
import { CaretLeft, CaretRight } from 'phosphor-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { palette, radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

type ActionTone = 'primary' | 'community' | 'emergency' | 'reward' | 'neutral'

export function ActionCard({ title, description, label, Icon, tone = 'primary', onPress, large = false }: { title: string; description: string; label?: string; Icon: Icon; tone?: ActionTone; onPress: () => void; large?: boolean }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const Arrow = isRTL ? CaretLeft : CaretRight
  const fills = { primary: theme.colors.primary, community: theme.colors.community, emergency: theme.colors.emergencySoft, reward: theme.colors.rewardSoft, neutral: theme.colors.surface }
  const inks = { primary: theme.colors.onPrimary, community: theme.colors.onCommunity, emergency: theme.colors.emergency, reward: theme.colors.onReward, neutral: theme.colors.textPrimary }
  const inverse = tone === 'primary' || tone === 'community'
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.card, large && styles.large, shadow.soft, { backgroundColor: fills[tone], borderColor: inverse ? 'transparent' : theme.colors.border }, pressed && styles.pressed]}>
      <View style={[styles.top, dirStyles(isRTL).row]}>
        <View style={[styles.icon, { backgroundColor: inverse ? palette.whiteAlpha12 : `${inks[tone]}12` }]}><Icon size={large ? 29 : 24} color={inks[tone]} weight="duotone" /></View>
        <Arrow size={20} color={inks[tone]} />
      </View>
      <View style={styles.copy}>
        {label ? <Text style={[typography.eyebrow, { color: inks[tone], opacity: 0.82, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text> : null}
        <Text style={[large ? typography.h2 : typography.h3, { color: inks[tone], textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        <Text style={[typography.small, { color: inks[tone], opacity: inverse ? 0.86 : 0.78, textAlign: isRTL ? 'right' : 'left' }]}>{description}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { flex: 1, minHeight: 172, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, justifyContent: 'space-between', gap: space.xl },
  large: { minHeight: 204, padding: space.xl },
  top: { alignItems: 'center', justifyContent: 'space-between' },
  icon: { width: 50, height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  copy: { gap: 5 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] }
})
