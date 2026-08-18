import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Crown } from 'phosphor-react-native'
import { supabase } from '../lib/supabase'
import { CURRENT_MARKET } from '../lib/market'
import { colors, font, radius, shadow, space } from '../lib/theme'
import type { Membership } from '../types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function MembershipCard({ userId }: { userId: string }) {
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

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconWrap}>
          <Crown size={26} color={colors.sand} weight="duotone" />
        </View>
        <View style={styles.topText}>
          <Text style={styles.brand}>SANAD+</Text>
          {membership ? (
            <Text style={styles.status}>عضويتك فعالة</Text>
          ) : (
            <Text style={styles.status}>عضوية غير مفعّلة بعد</Text>
          )}
        </View>
      </View>

      {membership ? (
        <>
          <View style={styles.line} />
          <Text style={styles.label}>تنتهي في</Text>
          <Text style={styles.value}>{membership.expires_at ? formatDate(membership.expires_at) : '—'}</Text>
        </>
      ) : (
        <Text style={styles.teaser}>
          مساعدة المتطوعين تبقى مجانية دائماً. SANAD+ يضيف خصومات عند شركائنا وخيارات احتياط احترافية —
          {' '}{CURRENT_MARKET.membershipPrice} {CURRENT_MARKET.currencySymbol} / سنة، قريباً.
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg, marginBottom: space.xl, ...shadow.soft },
  top: { flexDirection: 'row-reverse', alignItems: 'center', gap: space.md },
  iconWrap: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.sandSoft, alignItems: 'center', justifyContent: 'center' },
  topText: { flex: 1, alignItems: 'flex-end' },
  brand: { color: colors.text, fontFamily: font.extraBold, fontSize: 18, textAlign: 'right' },
  status: { color: colors.muted, fontFamily: font.medium, fontSize: 13, textAlign: 'right', marginTop: 2 },
  line: { height: 1, backgroundColor: colors.border, marginVertical: space.md },
  label: { color: colors.muted, fontFamily: font.regular, fontSize: 12.5, textAlign: 'right' },
  value: { color: colors.text, fontFamily: font.bold, fontSize: 15, textAlign: 'right', marginTop: 2 },
  teaser: { color: colors.muted, fontFamily: font.regular, fontSize: 13, textAlign: 'right', lineHeight: 20, marginTop: space.md }
})
