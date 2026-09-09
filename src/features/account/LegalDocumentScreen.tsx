import { Linking, StyleSheet, Text, View } from 'react-native'
import { Phone, WhatsappLogo } from 'phosphor-react-native'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { AppScreen, ScreenHeader } from '../../components/v2'
import { Button } from '../../components/ui'
import { LEGAL_CONTACT, LEGAL_LAST_UPDATED, type LegalBlock } from './legalContent'

// Renders a static legal document (Privacy Policy / Terms of Use) - the
// exact Arabic text given for these two documents, with no per-language
// translation, since only an Arabic version was provided.
export function LegalDocumentScreen({ title, brand, blocks }: { title: string; brand: string; blocks: LegalBlock[] }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const align: 'right' | 'left' = isRTL ? 'right' : 'left'

  return (
    <AppScreen header={<ScreenHeader title={title} back />} contentStyle={styles.content}>
      <Text style={[typography.bodyMedium, { color: theme.colors.textSecondary, textAlign: align }]}>{brand}</Text>
      <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: align }]}>{`آخر تحديث: ${LEGAL_LAST_UPDATED}`}</Text>

      {blocks.map((block, index) => {
        if (block.type === 'h2') {
          return <Text key={index} style={[typography.h3, styles.h2, { color: theme.colors.textPrimary, textAlign: align }]}>{block.text}</Text>
        }
        if (block.type === 'h3') {
          return <Text key={index} style={[typography.bodyMedium, styles.h3, { color: theme.colors.textPrimary, textAlign: align }]}>{block.text}</Text>
        }
        if (block.type === 'ul') {
          return (
            <View key={index} style={styles.list}>
              {block.items.map((item, itemIndex) => (
                <View key={itemIndex} style={[styles.listItem, dirStyles(isRTL).row]}>
                  <Text style={[typography.body, { color: theme.colors.textSecondary }]}>{'•'}</Text>
                  <Text style={[typography.body, styles.listText, { color: theme.colors.textSecondary, textAlign: align }]}>{item}</Text>
                </View>
              ))}
            </View>
          )
        }
        return <Text key={index} style={[typography.body, { color: theme.colors.textSecondary, textAlign: align }]}>{block.text}</Text>
      })}

      <Text style={[typography.bodyMedium, styles.phone, { color: theme.colors.textPrimary, textAlign: align }]}>{LEGAL_CONTACT.displayPhone}</Text>

      <View style={[styles.contactRow, dirStyles(isRTL).row]}>
        <Button fullWidth={false} label="اتصال هاتفي" variant="outline" leading={<Phone size={18} color={theme.colors.primary} />} onPress={() => Linking.openURL(LEGAL_CONTACT.telHref)} />
        <Button fullWidth={false} label="واتساب" variant="outline" leading={<WhatsappLogo size={18} color={theme.colors.community} />} onPress={() => Linking.openURL(LEGAL_CONTACT.whatsappHref)} />
      </View>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg, gap: space.md },
  h2: { marginTop: space.md },
  h3: { marginTop: space.xs },
  list: { gap: space.xs },
  listItem: { alignItems: 'flex-start', gap: space.sm },
  listText: { flex: 1 },
  phone: { marginTop: space.md },
  contactRow: { gap: space.md, marginBottom: space.xl }
})
