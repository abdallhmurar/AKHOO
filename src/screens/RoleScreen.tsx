import { Image, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight, CarProfile, GearSix, HandHeart, UserCircle } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, radius, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { Screen } from '../components/Screen'
import { Tactile } from '../components/Tactile'

export function RoleScreen({
  name,
  avatarUrl,
  isAdmin,
  activeKind,
  onRequester,
  onVolunteer,
  onAdmin,
  onResumeActive
}: {
  name: string
  avatarUrl: string | null
  isAdmin: boolean
  activeKind: 'request' | 'job' | null
  onRequester: () => void
  onVolunteer: () => void
  onAdmin: () => void
  onResumeActive: () => void
}) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight

  return (
    <Screen>
      <View style={[styles.top, dir.row]}>
        <View style={[styles.identity, dir.row]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}><UserCircle size={22} color={colors.muted} weight="light" /></View>
          )}
          <View>
            <Text style={[styles.brand, dir.textStart]}>{t('home.brand')}</Text>
            <Text style={[styles.greeting, dir.textStart]}>{t('home.greeting', { name: name || t('home.guestName') })}</Text>
          </View>
        </View>
      </View>

      {activeKind ? (
        <Tactile onPress={onResumeActive} style={[styles.resumeCard, dir.row]}>
          <ForwardIcon size={18} color="#fff" />
          <Text style={[styles.resumeText, dir.textStart]}>
            {activeKind === 'request' ? t('home.resumeRequest') : t('home.resumeJob')}
          </Text>
        </Tactile>
      ) : null}

      <Text style={[styles.title, dir.textStart]}>{t('home.title')}</Text>
      <Text style={[styles.subtitle, dir.textStart]}>{t('home.subtitle')}</Text>

      <Tactile onPress={activeKind === 'request' ? onResumeActive : onRequester} style={[styles.roleCard, styles.requestCard]} scaleTo={0.98}>
        <View style={[styles.roleCardTop, dir.row]}>
          <View style={[styles.icon, { backgroundColor: colors.sandSoft }]}><CarProfile size={30} color={colors.sand} weight="duotone" /></View>
          <ForwardIcon size={18} color={colors.text} />
        </View>
        <Text style={[styles.roleTitle, dir.textStart]}>{t('home.needHelp.title')}</Text>
        <Text style={[styles.roleText, dir.textStart]}>{t('home.needHelp.text')}</Text>
      </Tactile>

      <Tactile onPress={onVolunteer} style={[styles.roleCard, styles.volunteerCard]} scaleTo={0.98}>
        <View style={[styles.roleCardTop, dir.row]}>
          <View style={[styles.icon, { backgroundColor: colors.sageSoft }]}><HandHeart size={30} color={colors.forest} weight="duotone" /></View>
          <ForwardIcon size={18} color={colors.forest} />
        </View>
        <Text style={[styles.roleTitle, dir.textStart]}>{t('home.wantToHelp.title')}</Text>
        <Text style={[styles.roleText, dir.textStart]}>{t('home.wantToHelp.text')}</Text>
      </Tactile>

      {isAdmin ? (
        <Tactile onPress={onAdmin} style={[styles.adminRow, dir.row]}>
          <GearSix size={16} color={colors.muted} />
          <Text style={styles.adminText}>{t('home.adminLink')}</Text>
        </Tactile>
      ) : null}

      <View style={styles.notice}>
        <Text style={[styles.noticeText, dir.textStart]}>{t('home.notice')}</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  top: { justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xxl },
  identity: { alignItems: 'center', gap: space.md },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border },
  avatarFallback: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 20, fontFamily: font.extraBold, color: colors.text },
  greeting: { color: colors.muted, fontFamily: font.regular, fontSize: 13, marginTop: 2 },
  resumeCard: { justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.forest, borderRadius: radius.md, paddingVertical: space.lg, paddingHorizontal: space.xl, marginBottom: space.xl, gap: space.md },
  resumeText: { flex: 1, color: '#fff', fontFamily: font.bold, fontSize: 14 },
  title: { color: colors.text, fontSize: 28, fontFamily: font.extraBold },
  subtitle: { color: colors.muted, fontSize: 14.5, fontFamily: font.regular, marginTop: 6, marginBottom: space.xxl },
  roleCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, padding: space.xl, marginBottom: space.lg },
  requestCard: { borderColor: colors.sandSoft },
  volunteerCard: { borderColor: colors.border },
  roleCardTop: { justifyContent: 'space-between', alignItems: 'center' },
  icon: { width: 60, height: 60, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontSize: 20, fontFamily: font.extraBold, color: colors.text, marginTop: space.lg },
  roleText: { color: colors.muted, fontSize: 13.5, fontFamily: font.regular, lineHeight: 20, marginTop: 4 },
  adminRow: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: space.md, marginBottom: space.sm },
  adminText: { color: colors.muted, fontFamily: font.medium, fontSize: 13 },
  notice: { backgroundColor: colors.sageSoft, paddingVertical: space.md, paddingHorizontal: space.lg, borderRadius: radius.md, marginTop: space.xs },
  noticeText: { color: colors.forest, fontSize: 12, fontFamily: font.regular, lineHeight: 18 }
})
