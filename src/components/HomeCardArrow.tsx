import { StyleSheet, View } from 'react-native'
import Svg, { Polyline } from 'react-native-svg'

// Fixed artwork colors: these cards retain their light video backgrounds in every theme.
const tones = {
  help: { backgroundColor: '#FFDEDA', stroke: '#FF514D' },
  volunteer: { backgroundColor: '#CCF5E9', stroke: '#006C5B' },
  perks: { backgroundColor: '#D0F3F5', stroke: '#007B76' },
} as const

export function HomeCardArrow({ tone, locale }: {
  tone: keyof typeof tones
  locale: 'ar' | 'he' | 'en'
}) {
  const colors = tones[tone]
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.badge, { backgroundColor: colors.backgroundColor }]}
    >
      <Svg width="60%" height="60%" viewBox="0 0 24 24" aria-hidden>
        <Polyline
          points={locale === 'en' ? '9,5 16,12 9,19' : '15,5 8,12 15,19'}
          fill="none" stroke={colors.stroke} strokeWidth={3.5}
          strokeLinecap="round" strokeLinejoin="round"
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    // Every localized video keeps its copy on the right; don't mirror the artwork.
    right: '7%',
    bottom: '8%',
    width: '7.5%',
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
