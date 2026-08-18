import { StyleSheet, Text, View } from 'react-native'
import { colors, font, radius, space } from '../lib/theme'
import type { partnerCategories } from '../lib/partnerCategories'

type CategoryDef = (typeof partnerCategories)[number]

export function PartnerCategoryChip({ category, count }: { category: CategoryDef; count: number }) {
  return (
    <View style={styles.chip}>
      <View style={styles.iconWrap}>
        <category.Icon size={22} color={colors.forest} weight="duotone" />
      </View>
      <Text style={styles.label}>{category.label}</Text>
      <Text style={styles.count}>{count > 0 ? `${count} شريك` : 'قريباً'}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: { width: '31%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: space.md, paddingHorizontal: space.sm, alignItems: 'center', gap: 6 },
  iconWrap: { width: 42, height: 42, borderRadius: radius.sm, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.text, fontFamily: font.bold, fontSize: 12, textAlign: 'center' },
  count: { color: colors.muted, fontFamily: font.regular, fontSize: 10.5, textAlign: 'center' }
})
