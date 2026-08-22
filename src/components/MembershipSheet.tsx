import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Check, Sparkle } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, radius, space, type } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { CURRENT_MARKET_FEATURES } from '../lib/market'
import { BottomSheet } from './BottomSheet'
import { PrimaryButton } from './PrimaryButton'
import { Tactile } from './Tactile'

// No real subscription route exists yet (memberships has no client insert
// path - a payment webhook/RPC is a future phase) regardless of the
// market's sanadPlus flag, so "Learn about SANAD+" never fakes a checkout -
// it just reveals an honest current-state note in place. When the flag
// itself is off for this market, purchasing isn't offered at all (a
// distinct, more definitive message) - but the member_only restriction
// this sheet exists to explain still applies either way; the flag only
// changes what CTA/copy is shown here, never whether the sheet appears.
export function MembershipSheet({ visible, onClose, offerLocked = false }: { visible: boolean; onClose: () => void; offerLocked?: boolean }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const [acknowledged, setAcknowledged] = useState(false)
  const purchasingAvailable = CURRENT_MARKET_FEATURES.sanadPlus

  function handleClose() {
    setAcknowledged(false)
    onClose()
  }

  const benefits = [t('perks.membershipSheet.benefitDiscounts'), t('perks.membershipSheet.benefitPriority'), t('perks.membershipSheet.benefitSupport')]

  return (
    <BottomSheet visible={visible} onClose={handleClose}>
      <View style={[styles.top, dir.row]}>
        <View style={styles.iconWrap}>
          <Sparkle size={22} color={colors.sand} weight="fill" />
        </View>
        <Text style={[styles.brand, dir.textStart]}>{t('perks.membershipSheet.genericTitle')}</Text>
      </View>

      {offerLocked ? <Text style={[styles.headline, dir.textStart]}>{t('perks.membershipSheet.offerLockedTitle')}</Text> : null}
      <Text style={[styles.message, dir.textStart]}>
        {offerLocked ? t('perks.membershipSheet.offerLockedMessage') : t('perks.membershipSheet.genericMessage')}
      </Text>

      <View style={styles.benefits}>
        {benefits.map(benefit => (
          <View key={benefit} style={[styles.benefitRow, dir.row]}>
            <View style={styles.checkWrap}>
              <Check size={12} color={colors.forest} weight="bold" />
            </View>
            <Text style={[styles.benefitText, dir.textStart]}>{benefit}</Text>
          </View>
        ))}
      </View>

      {!purchasingAvailable ? (
        <Text style={[styles.comingSoon, dir.textStart]}>{t('perks.membershipSheet.notAvailableInMarket')}</Text>
      ) : acknowledged ? (
        <Text style={[styles.comingSoon, dir.textStart]}>{t('perks.membershipSheet.comingSoon')}</Text>
      ) : null}

      <View style={styles.actions}>
        {purchasingAvailable ? <PrimaryButton title={t('perks.membershipSheet.learnMore')} onPress={() => setAcknowledged(true)} /> : null}
        <Tactile onPress={handleClose} style={styles.notNow}>
          <Text style={styles.notNowText}>{t('perks.membershipSheet.notNow')}</Text>
        </Tactile>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  top: { alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  iconWrap: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  brand: { color: colors.text, fontFamily: font.extraBold, fontSize: 17 },
  headline: { ...type.h3, color: colors.text, marginBottom: 6 },
  message: { color: colors.muted, fontFamily: font.regular, fontSize: 13.5, lineHeight: 20 },
  benefits: { gap: space.sm, marginTop: space.lg, marginBottom: space.lg },
  benefitRow: { alignItems: 'center', gap: space.sm },
  checkWrap: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  benefitText: { flex: 1, color: colors.text, fontFamily: font.medium, fontSize: 13.5 },
  comingSoon: { color: colors.muted, fontFamily: font.medium, fontSize: 12, textAlign: 'center', marginBottom: space.md },
  actions: { gap: space.sm },
  notNow: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.sm },
  notNowText: { color: colors.muted, fontFamily: font.bold, fontSize: 13.5 }
})
