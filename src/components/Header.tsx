import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, radius, space, type } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'

export function Header({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const BackIcon = isRTL ? ArrowRight : ArrowLeft

  return (
    <View style={[styles.row, dir.row]}>
      <View style={styles.textWrap}>
        <Text style={[styles.title, dir.textStart]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, dir.textStart]}>{subtitle}</Text> : null}
      </View>
      {onBack ? (
        <Pressable style={[styles.back, dir.row]} onPress={onBack}>
          <BackIcon size={16} color={colors.forestPressed} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: space.xl },
  textWrap: { flex: 1 },
  title: { ...type.h1, color: colors.text },
  subtitle: { ...type.small, color: colors.muted, marginTop: 5 },
  back: { alignItems: 'center', gap: 4, backgroundColor: colors.sageSoft, borderRadius: radius.sm, paddingVertical: 9, paddingHorizontal: space.md },
  backText: { ...type.caption, fontFamily: type.button.fontFamily, color: colors.forestPressed }
})
