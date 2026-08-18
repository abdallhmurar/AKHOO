import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { CURRENT_MARKET_CODE } from '../lib/market'
import { partnerCategories } from '../lib/partnerCategories'
import { colors, font, space } from '../lib/theme'
import type { PartnerCategory } from '../types'
import { Header } from '../components/Header'
import { MembershipCard } from '../components/MembershipCard'
import { PartnerCategoryChip } from '../components/PartnerCategoryChip'
import { Screen } from '../components/Screen'

export function PerksScreen({ userId }: { userId: string }) {
  const [counts, setCounts] = useState<Partial<Record<PartnerCategory, number>>>({})

  useEffect(() => {
    let cancelled = false
    supabase
      .from('partners')
      .select('category')
      .eq('market', CURRENT_MARKET_CODE)
      .eq('status', 'verified')
      .then(({ data }) => {
        if (cancelled || !data) return
        const next: Partial<Record<PartnerCategory, number>> = {}
        for (const row of data as { category: PartnerCategory }[]) {
          next[row.category] = (next[row.category] ?? 0) + 1
        }
        setCounts(next)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <Screen>
      <Header title="مزايا سَنَد" subtitle="عضوية SANAD+ وخصومات عند شركائنا." />

      <MembershipCard userId={userId} />

      <Text style={styles.sectionTitle}>تصنيفات الشركاء</Text>
      <View style={styles.grid}>
        {partnerCategories.map(category => (
          <PartnerCategoryChip key={category.key} category={category} count={counts[category.key] ?? 0} />
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  sectionTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 17, textAlign: 'right', marginBottom: space.md },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: space.sm }
})
