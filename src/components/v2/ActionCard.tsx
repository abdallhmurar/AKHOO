import type { ImageSourcePropType } from 'react-native'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

type ActionTone = 'primary' | 'community' | 'neutral'

const CARD_HEIGHT = 168
const ILLUSTRATION_WIDTH = 156

export function ActionCard({
  title,
  description,
  illustration,
  fullCard,
  tone = 'primary',
  onPress
}: {
  title: string
  description: string
  /** Cropped, text-free art used for every language except Arabic. */
  illustration: ImageSourcePropType
  /** Arabic-only: a pre-composed card image (art + baked-in Arabic copy) supplied as-is, no cropping. */
  fullCard: ImageSourcePropType
  tone?: ActionTone
  onPress: () => void
}) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { i18n } = useTranslation()
  const isArabic = i18n.language.startsWith('ar')
  const fills = { primary: theme.colors.primary, community: theme.colors.community, neutral: theme.colors.surface }
  const inks = { primary: theme.colors.onPrimary, community: theme.colors.onCommunity, neutral: theme.colors.textPrimary }
  const inverse = tone !== 'neutral'

  if (isArabic) {
    return (
      <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({ pressed }) => [styles.card, shadow.soft, pressed && styles.pressed]}>
        <Image source={fullCard} resizeMode="cover" style={styles.fullCard} />
      </Pressable>
    )
  }

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
      <Image source={illustration} resizeMode="cover" style={[styles.illustration, !isRTL && styles.illustrationFlipped]} />
      <View style={styles.copy}>
        <Text style={[typography.h2, { color: inks[tone], textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        <Text style={[typography.small, { color: inks[tone], opacity: inverse ? 0.86 : 0.7, textAlign: isRTL ? 'right' : 'left' }]}>{description}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { height: CARD_HEIGHT, borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent', overflow: 'hidden' },
  fullCard: { width: '100%', height: CARD_HEIGHT },
  illustration: { width: ILLUSTRATION_WIDTH, height: CARD_HEIGHT },
  illustrationFlipped: { transform: [{ scaleX: -1 }] },
  copy: { flex: 1, justifyContent: 'center', gap: 6, paddingHorizontal: space.lg },
  pressed: { opacity: 0.92 }
})
