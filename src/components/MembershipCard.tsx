import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Crown } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { CURRENT_MARKET } from '../lib/market'
import { colors, font, radius, shadow, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { Membership } from '../types'

export function MembershipCard({ userId }: { userId: string }) {
  const { t, i18n } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setMembership(data as Membership | null)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [userId])

  if (loading) return null

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <View style={styles.card}>
      <View style={[styles.top, dir.row]}>
        <View style={styles.iconWrap}>
          <Crown size={26} color={colors.sand} weight="duotone" />
        </View>
        <View style={[styles.topText, dir.alignStart]}>
          <Text style={[styles.brand, dir.textStart]}>{t('perks.membership.brand')}</Text>
          <Text style={[styles.status, dir.textStart]}>
            {membership ? t('perks.membership.activeStatus') : t('perks.membership.inactiveStatus')}
          </Text>
        </View>
      </View>

      {membership ? (
        <>
          <View style={styles.line} />
          <Text style={[styles.label, dir.textStart]}>{t('perks.membership.expiresLabel')}</Text>
          <Text style={[styles.value, dir.textStart]}>
            {membership.expires_at ? formatDate(membership.expires_at) : t('perks.membership.expiresUnknown')}
          </Text>
        </>
      ) : (
        <Text style={[styles.teaser, dir.textStart]}>
          {t('perks.membership.teaser', { price: CURRENT_MARKET.membershipPrice, currency: CURRENT_MARKET.currencySymbol })}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg, marginBottom: space.xl, ...shadow.soft },
  top: { alignItems: 'center', gap: space.md },
  iconWrap: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.sandSoft, alignItems: 'center', justifyContent: 'center' },
  topText: { flex: 1 },
  brand: { color: colors.text, fontFamily: font.extraBold, fontSize: 18 },
  status: { color: colors.muted, fontFamily: font.medium, fontSize: 13, marginTop: 2 },
  line: { height: 1, backgroundColor: colors.border, marginVertical: space.md },
  label: { color: colors.muted, fontFamily: font.regular, fontSize: 12.5 },
  value: { color: colors.text, fontFamily: font.bold, fontSize: 15, marginTop: 2 },
  teaser: { color: colors.muted, fontFamily: font.regular, fontSize: 13, lineHeight: 20, marginTop: space.md }
})
