import type { ImageSourcePropType } from 'react-native'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

type ActionTone = 'primary' | 'community' | 'neutral'

export function ActionCard({ title, description, illustration, tone = 'primary', onPress }: { title: string; description: string; illustration: ImageSourcePropType; tone?: ActionTone; onPress: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const fills = { primary: theme.colors.primary, community: theme.colors.community, neutral: theme.colors.surface }
  const inks = { primary: theme.colors.onPrimary, community: theme.colors.onCommunity, neutral: theme.colors.textPrimary }
  const inverse = tone !== 'neutral'
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        dirStyles(isRTL).row,
        shadow.soft,
        { backgroundColor: fills[tone], borderColor: inverse ? 'transparent' : theme.colors.border },
        pressed && styles.pressed
      ]}
    >
      <View style={styles.copy}>
        <Text style={[typography.h2, { color: inks[tone], textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        <Text style={[typography.small, { color: inks[tone], opacity: inverse ? 0.86 : 0.7, textAlign: isRTL ? 'right' : 'left' }]}>{description}</Text>
      </View>
      {/* The illustrations are RTL-authored (their baked-in direction cue reads correctly for Arabic/Hebrew); mirroring them for LTR keeps that cue pointing the right way instead of just relocating the art. */}
      <Image source={illustration} resizeMode="cover" style={[styles.illustration, !isRTL && styles.illustrationFlipped]} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { minHeight: 168, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', alignItems: 'stretch' },
  copy: { flex: 1, justifyContent: 'center', gap: 6, paddingHorizontal: space.lg, paddingVertical: space.lg },
  illustration: { width: '42%' },
  illustrationFlipped: { transform: [{ scaleX: -1 }] },
  pressed: { opacity: 0.92 }
})
