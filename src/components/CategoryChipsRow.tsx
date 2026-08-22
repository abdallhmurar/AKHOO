import type { ComponentType } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
import * as Haptics from 'expo-haptics'
import type { IconProps } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { businessCategories } from '../lib/businessCategories'
import { colors, font, radius, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { PartnerCategory } from '../types'
import { Tactile } from './Tactile'

export function CategoryChipsRow({ selected, onSelect }: { selected: PartnerCategory | 'all'; onSelect: (category: PartnerCategory | 'all') => void }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())

  function select(category: PartnerCategory | 'all') {
    Haptics.selectionAsync().catch(() => {})
    onSelect(category)
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.content, dir.row]}>
      <Chip label={t('perks.categoriesAll')} active={selected === 'all'} onPress={() => select('all')} />
      {businessCategories.map(category => (
        <Chip key={category.key} label={t(`perks.categories.${category.key}`)} Icon={category.Icon} active={selected === category.key} onPress={() => select(category.key)} />
      ))}
    </ScrollView>
  )
}

function Chip({ label, Icon, active, onPress }: { label: string; Icon?: ComponentType<IconProps>; active: boolean; onPress: () => void }) {
  const dir = dirStyles(useIsRTL())
  return (
    <Tactile onPress={onPress} style={[styles.chip, dir.row, active && styles.chipActive]} scaleTo={0.94}>
      {Icon ? <Icon size={15} color={active ? '#fff' : colors.forest} weight={active ? 'fill' : 'duotone'} /> : null}
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Tactile>
  )
}

const styles = StyleSheet.create({
  content: { gap: space.sm, paddingVertical: 2, paddingEnd: space.lg },
  chip: { alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: space.md },
  chipActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  label: { color: colors.text, fontFamily: font.bold, fontSize: 13 },
  labelActive: { color: '#fff' }
})
