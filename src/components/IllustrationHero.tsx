import { Image, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { colors, font } from '../lib/theme'
import { illustrations, type IllustrationScene } from '../illustrations'

export function IllustrationHero({ scene, height = 260, showWordmark = true }: { scene: IllustrationScene; height?: number; showWordmark?: boolean }) {
  const { t } = useTranslation()
  const spec = illustrations[scene]
  const brand = t('home.brand')

  return (
    <View style={[styles.wrap, { height }]}>
      {spec.imageSource ? (
        <Image source={spec.imageSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient colors={spec.gradientColors} start={{ x: 0.15, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill}>
          <View style={[styles.blob, styles.blobOne]} />
          <View style={[styles.blob, styles.blobTwo]} />
          <View style={styles.horizon} />
        </LinearGradient>
      )}

      {showWordmark ? (
        <View style={styles.wordmarkWrap}>
          <View style={styles.mark}><Text style={styles.markText}>{brand.charAt(0)}</Text></View>
          <Text style={styles.wordmark}>{brand}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', borderBottomLeftRadius: 32, borderBottomRightRadius: 32, backgroundColor: colors.sageSoft },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: '#FFFFFF33' },
  blobOne: { width: 220, height: 220, top: -60, left: -50 },
  blobTwo: { width: 160, height: 160, bottom: -50, right: -30, backgroundColor: '#20342A22' },
  horizon: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 46, backgroundColor: '#20342A14' },
  wordmarkWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mark: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  markText: { color: '#fff', fontSize: 28, fontFamily: font.extraBold },
  wordmark: { color: colors.text, fontSize: 22, fontFamily: font.extraBold }
})
