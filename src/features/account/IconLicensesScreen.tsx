import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppScreen, ScreenHeader } from '../../components/v2'
import { useIsRTL } from '../../lib/direction'
import { useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

// Attribution lives here instead of recurring below screens and navigation.
const authors = [
  ['setiawanap', 'trophy_7937805'],
  ['IconMarketPK', 'car-battery_3294292'],
  ['smashingstocks', 'handshake_8635541'],
  ['Magnific', 'user_1077012'],
  ['DinosoftLabs', 'world-globe_3516105'],
  ['Roundicons', 'compass_187758'],
  ['VectorPortal', 'fuel-pump_9084001'],
  ['Pixel perfect', 'star_1828884'],
  ['Fathema Khanom', 'home_10307931'],
  ['Smashicons', 'holding-hands_3131389'],
] as const

export function IconLicensesScreen() {
  const { t } = useTranslation()
  const theme = useSanadTheme()
  const type = useAppTypography()
  const isRTL = useIsRTL()
  const align = { textAlign: isRTL ? 'right' as const : 'left' as const }
  return <AppScreen header={<ScreenHeader title={t('account.menu.licenses')} back />} contentStyle={styles.content}>
    <Text style={[type.body, align, { color: theme.colors.textSecondary }]}>{t('account.licenses.description')}</Text>
    <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      {authors.map(([author, icon]) => <Pressable key={author} accessibilityRole="link" style={styles.link}
        onPress={() => void Linking.openURL(`https://www.flaticon.com/free-icon/${icon}`)}>
        <Text style={[type.bodyMedium, align, { color: theme.colors.primary }]}>{t('account.licenses.author', { author })}</Text>
      </Pressable>)}
    </View>
    <Pressable accessibilityRole="link" style={styles.link} onPress={() => void Linking.openURL('https://www.flaticon.com/media/license/license.pdf')}>
      <Text style={[type.bodyMedium, align, { color: theme.colors.primary }]}>{t('account.licenses.viewLicense')}</Text>
    </Pressable>
  </AppScreen>
}

const styles = StyleSheet.create({
  content: { paddingTop: 20, gap: 16 },
  card: { borderWidth: 1, borderRadius: 20, padding: 12 },
  link: { minHeight: 44, justifyContent: 'center', padding: 10 },
})
