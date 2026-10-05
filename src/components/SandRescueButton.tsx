import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Phone } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { LinearGradient } from 'expo-linear-gradient'
import { useIsRTL } from '../lib/direction'
import { useAppTypography } from '../lib/typography'
import { telHref } from '../lib/contactLinks'

const SAND_PHONE = '0529101855'

export function SandRescueButton() {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const typography = useAppTypography()
  const call = async () => {
    try { await Linking.openURL(telHref(SAND_PHONE)) }
    catch { Alert.alert(t('sandRescue.title'), t('sandRescue.callError')) }
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${t('sandRescue.title')}. ${t('sandRescue.call')}`} accessibilityHint={t('sandRescue.hint')} onPress={call} style={({ pressed }) => [styles.button, { opacity: pressed ? 0.8 : 1 }]}>
      <LinearGradient colors={['#FFF5D5', '#FAE9B7', '#FFF8E3']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.content, { flexDirection: isRTL ? 'row' : 'row-reverse' }]}>
        <Image accessible={false} source={require('../../assets/images/sand-rescue-logo.png')} resizeMode="contain" style={styles.logo} />
        <View style={styles.copy}>
          <Text style={[typography.h3, styles.text, { textAlign: isRTL ? 'right' : 'left' }]}>{t('sandRescue.title')}</Text>
          <Text style={[typography.small, styles.text, { textAlign: isRTL ? 'right' : 'left' }]}>{t('sandRescue.subtitle')}</Text>
          <View style={[styles.call, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Phone size={20} color="#FFFFFF" weight="fill" />
            <Text style={[typography.smallMedium, styles.callText]}>{t('sandRescue.call')}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: { borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: '#EBD59A', marginTop: 16 },
  content: { padding: 14, gap: 12, alignItems: 'center', minHeight: 156, direction: 'ltr' },
  logo: { width: '31%', maxWidth: 145, aspectRatio: 1 },
  copy: { flex: 1, minWidth: 0, gap: 7 },
  text: { color: '#503014' },
  call: { alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#573414', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 10, minHeight: 44, marginTop: 3 },
  callText: { color: '#FFFFFF', flexShrink: 1, textAlign: 'center' },
})
