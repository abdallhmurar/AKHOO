import type { ImageSourcePropType } from 'react-native'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useIsRTL } from '../../lib/direction'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

type ActionTone = 'primary' | 'community' | 'neutral'

const ILLUSTRATION_WIDTH = '44%'

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
        shadow.soft,
        { backgroundColor: fills[tone], borderColor: inverse ? 'transparent' : theme.colors.border },
        pressed && styles.pressed
      ]}
    >
      {/* Absolutely positioned so neither child's own size can drive the card's height - both are pinned to fill exactly the card's minHeight instead. */}
      <Image
        source={illustration}
        resizeMode="cover"
        style={[styles.illustration, isRTL ? styles.illustrationStart : styles.illustrationEnd, !isRTL && styles.illustrationFlipped]}
      />
      <View style={[styles.copy, isRTL ? styles.copyEnd : styles.copyStart]}>
        <Text style={[typography.h2, { color: inks[tone], textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        <Text style={[typography.small, { color: inks[tone], opacity: inverse ? 0.86 : 0.7, textAlign: isRTL ? 'right' : 'left' }]}>{description}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { height: 168, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', position: 'relative' },
  illustration: { position: 'absolute', top: 0, bottom: 0, width: ILLUSTRATION_WIDTH },
  illustrationStart: { left: 0 },
  illustrationEnd: { right: 0 },
  illustrationFlipped: { transform: [{ scaleX: -1 }] },
  copy: { position: 'absolute', top: 0, bottom: 0, justifyContent: 'center', gap: 6, paddingHorizontal: space.lg },
  copyStart: { left: 0, right: ILLUSTRATION_WIDTH },
  copyEnd: { right: 0, left: ILLUSTRATION_WIDTH },
  pressed: { opacity: 0.92 }
})
