import { Image, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, CarProfile, ClockCounterClockwise, GearSix, HandHeart, UserCircle } from 'phosphor-react-native'
import { colors, font, radius, space } from '../lib/theme'
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
  onHistory,
  onAccount,
  onResumeActive
}: {
  name: string
  avatarUrl: string | null
  isAdmin: boolean
  activeKind: 'request' | 'job' | null
  onRequester: () => void
  onVolunteer: () => void
  onAdmin: () => void
  onHistory: () => void
  onAccount: () => void
  onResumeActive: () => void
}) {
  return (
    <Screen>
      <View style={styles.top}>
        <View style={styles.identity}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}><UserCircle size={22} color={colors.muted} weight="light" /></View>
          )}
          <View>
            <Text style={styles.brand}>سَنَد</Text>
            <Text style={styles.greeting}>أهلاً {name || 'فيك'}</Text>
          </View>
        </View>
        <View style={styles.topActions}>
          <Tactile onPress={onHistory} style={styles.topButton}><ClockCounterClockwise size={18} color={colors.forest} /></Tactile>
          <Tactile onPress={onAccount} style={styles.topButton}><UserCircle size={18} color={colors.forest} /></Tactile>
        </View>
      </View>

      {activeKind ? (
        <Tactile onPress={onResumeActive} style={styles.resumeCard}>
          <ArrowLeft size={18} color="#fff" />
          <Text style={styles.resumeText}>
            {activeKind === 'request' ? 'لسا عندك طلب مساعدة نشط — تابعه' : 'لسا عندك مهمة تطوّع نشطة — تابعها'}
          </Text>
        </Tactile>
      ) : null}

      <Text style={styles.title}>شو بدك تعمل هلق؟</Text>
      <Text style={styles.subtitle}>اختر دورك لهذه اللحظة.</Text>

      <Tactile onPress={onRequester} style={[styles.roleCard, styles.requestCard]} scaleTo={0.98}>
        <View style={styles.roleCardTop}>
          <View style={[styles.icon, { backgroundColor: colors.sandSoft }]}><CarProfile size={30} color={colors.sand} weight="duotone" /></View>
          <ArrowLeft size={18} color={colors.text} />
        </View>
        <Text style={styles.roleTitle}>بدي مساعدة</Text>
        <Text style={styles.roleText}>عندي مشكلة وبدي متطوع قريب يساعدني.</Text>
      </Tactile>

      <Tactile onPress={onVolunteer} style={[styles.roleCard, styles.volunteerCard]} scaleTo={0.98}>
        <View style={styles.roleCardTop}>
          <View style={[styles.icon, { backgroundColor: colors.sageSoft }]}><HandHeart size={30} color={colors.forest} weight="duotone" /></View>
          <ArrowLeft size={18} color={colors.forest} />
        </View>
        <Text style={styles.roleTitle}>بدي أساعد</Text>
        <Text style={styles.roleText}>أنا متاح أساعد شخص قريب مني.</Text>
      </Tactile>

      {isAdmin ? (
        <Tactile onPress={onAdmin} style={styles.adminRow}>
          <GearSix size={16} color={colors.muted} />
          <Text style={styles.adminText}>لوحة الإدارة</Text>
        </Tactile>
      ) : null}

      <View style={styles.notice}>
        <Text style={styles.noticeText}>أول إصدار: توزيع الطلبات مباشر بين المستخدم والمتطوع، بلا مركز اتصالات.</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xxl },
  identity: { flexDirection: 'row-reverse', alignItems: 'center', gap: space.md },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border },
  avatarFallback: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 20, fontFamily: font.extraBold, color: colors.text, textAlign: 'right' },
  greeting: { color: colors.muted, fontFamily: font.regular, fontSize: 13, textAlign: 'right', marginTop: 2 },
  topActions: { flexDirection: 'row-reverse', gap: space.sm },
  topButton: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  resumeCard: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.forest, borderRadius: radius.md, paddingVertical: space.lg, paddingHorizontal: space.xl, marginBottom: space.xl, gap: space.md },
  resumeText: { flex: 1, color: '#fff', fontFamily: font.bold, fontSize: 14, textAlign: 'right' },
  title: { color: colors.text, fontSize: 28, fontFamily: font.extraBold, textAlign: 'right' },
  subtitle: { color: colors.muted, fontSize: 14.5, fontFamily: font.regular, textAlign: 'right', marginTop: 6, marginBottom: space.xxl },
  roleCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, padding: space.xl, marginBottom: space.lg },
  requestCard: { borderColor: colors.sandSoft },
  volunteerCard: { borderColor: colors.border },
  roleCardTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  icon: { width: 60, height: 60, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  roleTitle: { fontSize: 20, fontFamily: font.extraBold, color: colors.text, textAlign: 'right', marginTop: space.lg },
  roleText: { color: colors.muted, fontSize: 13.5, fontFamily: font.regular, lineHeight: 20, textAlign: 'right', marginTop: 4 },
  adminRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: space.md, marginBottom: space.sm },
  adminText: { color: colors.muted, fontFamily: font.medium, fontSize: 13 },
  notice: { backgroundColor: colors.sageSoft, paddingVertical: space.md, paddingHorizontal: space.lg, borderRadius: radius.md, marginTop: space.xs },
  noticeText: { color: colors.forest, fontSize: 12, fontFamily: font.regular, lineHeight: 18, textAlign: 'right' }
})
