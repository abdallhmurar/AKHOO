import { Linking, StyleSheet, Text, View } from 'react-native'
import { Phone, WhatsappLogo } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import type { AppLanguage } from '../../lib/i18n'
import { space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { AppScreen, ScreenHeader } from '../../components/v2'
import { Button } from '../../components/ui'
import { LEGAL_CONTACT, LEGAL_LAST_UPDATED, type LegalBlock } from './legalContent'

const SUPPORTED_LANGUAGES: AppLanguage[] = ['ar', 'he', 'en']

// Renders a static legal document (Privacy Policy / Terms of Use). The
// Arabic text is the one the user gave us directly; English and Hebrew are
// translations of it (see legalContent.ts's header comment) rather than
// separately supplied source text, so this now follows the app's actual
// language instead of being forced to Arabic.
export function LegalDocumentScreen({ title, brand, blocks }: { title: string; brand: string; blocks: Record<AppLanguage, LegalBlock[]> }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { i18n, t } = useTranslation()
  const language: AppLanguage = SUPPORTED_LANGUAGES.includes(i18n.language as AppLanguage) ? (i18n.language as AppLanguage) : 'ar'
  const align: 'right' | 'left' = isRTL ? 'right' : 'left'
  const docBlocks = blocks[language]

  return (
    <AppScreen header={<ScreenHeader title={title} back />} contentStyle={styles.content}>
      <Text style={[typography.bodyMedium, { color: theme.colors.textSecondary, textAlign: align }]}>{brand}</Text>
      <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: align }]}>{`${t('account.legal.lastUpdated')}: ${LEGAL_LAST_UPDATED[language]}`}</Text>

      {docBlocks.map((block, index) => {
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
        <Button fullWidth={false} label={t('perks.business.call')} variant="outline" leading={<Phone size={18} color={theme.colors.primary} />} onPress={() => Linking.openURL(LEGAL_CONTACT.telHref)} />
        <Button fullWidth={false} label={t('perks.business.whatsapp')} variant="outline" leading={<WhatsappLogo size={18} color={theme.colors.community} />} onPress={() => Linking.openURL(LEGAL_CONTACT.whatsappHref)} />
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
