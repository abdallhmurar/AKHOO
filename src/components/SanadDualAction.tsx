import type { ComponentType } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight } from 'phosphor-react-native'
import type { IconProps } from 'phosphor-react-native'
import { colors, font, radius, shadow, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { Tactile } from './Tactile'

export type DualActionItem = {
  Icon: ComponentType<IconProps>
  title: string
  text: string
  onPress: () => void
}

// Two equal-weight core actions - product rule: requesting help and giving
// help are equally central to SANAD, neither may read as primary/secondary
// (this replaced an earlier round's "hero + demoted row" treatment, which
// was a real product-rule violation, not a style choice).
//
// MCP source: ported from 21st.dev "Pricing Cards" (kokonutd, id 1062) -
// ACTUAL SOURCE FETCHED via get_component. Taken from its real code: the
// equal two-column grid with `flex flex-col h-full` (-> RN `flex:1` +
// `alignItems:'stretch'` here) so both tiles share one height regardless of
// content length; the card anatomy (icon/label area -> divider-less here
// since SANAD's version is shorter -> feature/body text -> footer CTA
// pinned to the bottom); the CTA's own arrow affordance. Deliberately NOT
// ported: the source's own light-card/dark-gradient "highlighted tier"
// asymmetry - copying that would recreate exactly the unequal-weight
// problem this component exists to fix, so both SANAD tiles get identical
// styling and differ only by icon and copy.
export function SanadDualAction({ primary, secondary }: { primary: DualActionItem; secondary: DualActionItem }) {
  const dir = dirStyles(useIsRTL())
  return (
    <View style={[styles.row, dir.row]}>
      <Tile item={primary} />
      <Tile item={secondary} />
    </View>
  )
}

function Tile({ item }: { item: DualActionItem }) {
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight
  return (
    <Tactile onPress={item.onPress} style={styles.tile} scaleTo={0.97}>
      <View style={styles.iconWrap}>
        <item.Icon size={26} color={colors.sand} weight="duotone" />
      </View>
      <Text style={[styles.title, dir.textStart]} numberOfLines={2}>{item.title}</Text>
      <Text style={[styles.text, dir.textStart]} numberOfLines={3}>{item.text}</Text>
      <View style={styles.cta}>
        <ForwardIcon size={14} color="#fff" />
      </View>
    </Tactile>
  )
}

const styles = StyleSheet.create({
  row: { gap: space.md, marginBottom: space.lg, alignItems: 'stretch' },
  tile: { flex: 1, backgroundColor: colors.forest, borderRadius: radius.xl, padding: space.lg, ...shadow.elevated, minHeight: 204 },
  iconWrap: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: '#FFFFFF1F', alignItems: 'center', justifyContent: 'center', marginBottom: space.md },
  title: { color: '#fff', fontFamily: font.extraBold, fontSize: 16.5, lineHeight: 21 },
  text: { color: '#FFFFFFC2', fontFamily: font.regular, fontSize: 11.5, lineHeight: 16, marginTop: 5, flexGrow: 1 },
  cta: { alignSelf: 'flex-start', width: 30, height: 30, borderRadius: radius.pill, backgroundColor: '#FFFFFF26', alignItems: 'center', justifyContent: 'center', marginTop: space.sm }
})
