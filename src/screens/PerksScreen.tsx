import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { CURRENT_MARKET_CODE } from '../lib/market'
import { partnerCategories } from '../lib/partnerCategories'
import { colors, font, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { PartnerCategory } from '../types'
import { Header } from '../components/Header'
import { MembershipCard } from '../components/MembershipCard'
import { PartnerCategoryChip } from '../components/PartnerCategoryChip'
import { Screen } from '../components/Screen'

export function PerksScreen({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
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
      <Header title={t('perks.title')} subtitle={t('perks.subtitle')} />

      <MembershipCard userId={userId} />

      <Text style={[styles.sectionTitle, dir.textStart]}>{t('perks.categoriesTitle')}</Text>
      <View style={[styles.grid, dir.row]}>
        {partnerCategories.map(category => (
          <PartnerCategoryChip key={category.key} category={category} count={counts[category.key] ?? 0} />
        ))}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  sectionTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 17, marginBottom: space.md },
  grid: { flexWrap: 'wrap', gap: space.sm }
})
