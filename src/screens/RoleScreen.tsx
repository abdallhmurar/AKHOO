import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../lib/theme'
import { Screen } from '../components/Screen'

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
          {avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : null}
          <View>
            <Text style={styles.brand}>سَنَد</Text>
            <Text style={styles.greeting}>أهلاً {name || 'فيك'} 👋</Text>
          </View>
        </View>
        <View style={styles.topActions}>
          <Pressable onPress={onHistory} style={styles.topButton}><Text style={styles.topButtonText}>السجل 🕘</Text></Pressable>
          <Pressable onPress={onAccount} style={styles.topButton}><Text style={styles.topButtonText}>حسابي 👤</Text></Pressable>
        </View>
      </View>

      {activeKind ? (
        <Pressable onPress={onResumeActive} style={styles.resumeCard}>
          <Text style={styles.resumeArrow}>تابع ←</Text>
          <Text style={styles.resumeText}>
            {activeKind === 'request' ? 'لسا عندك طلب مساعدة نشط' : 'لسا عندك مهمة تطوّع نشطة'}
          </Text>
        </Pressable>
      ) : null}

      <Text style={styles.title}>شو بدك تعمل هلق؟</Text>
      <Text style={styles.subtitle}>نفس الحساب بقدر يطلب مساعدة أو يساعد غيره. اختار دورك لهذه اللحظة.</Text>

      <Pressable onPress={onRequester} style={[styles.roleCard, styles.requestCard]}>
        <View style={[styles.icon, { backgroundColor: colors.redSoft }]}><Text style={styles.iconText}>🆘</Text></View>
        <Text style={styles.roleTitle}>بدي مساعدة</Text>
        <Text style={styles.roleText}>افتح طلب، شارك موقعك، وأقرب متطوع متاح يقدر يستلمه.</Text>
        <Text style={styles.arrow}>ابدأ ←</Text>
      </Pressable>

      <Pressable onPress={onVolunteer} style={[styles.roleCard, styles.volunteerCard]}>
        <View style={[styles.icon, { backgroundColor: colors.blueSoft }]}><Text style={styles.iconText}>🤝</Text></View>
        <Text style={styles.roleTitle}>بدي أساعد</Text>
        <Text style={styles.roleText}>فعّل توفرّك وشوف طلبات المساعدة القريبة منك حسب موقعك.</Text>
        <Text style={[styles.arrow, { color: colors.green }]}>شوف الطلبات ←</Text>
      </Pressable>

      {isAdmin ? (
        <Pressable onPress={onAdmin} style={styles.adminRow}>
          <Text style={styles.adminText}>لوحة الإدارة ⚙️</Text>
        </Pressable>
      ) : null}

      <View style={styles.notice}>
        <Text style={styles.noticeText}>أول إصدار: توزيع الطلبات مباشر بين المستخدم والمتطوع، بلا مركز اتصالات.</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  identity: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.border },
  topActions: { flexDirection: 'row-reverse', gap: 8 },
  topButton: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 13 },
  topButtonText: { color: colors.blueDark, fontWeight: '800', fontSize: 13 },
  brand: { fontSize: 28, fontWeight: '900', color: colors.blueDark, textAlign: 'right' },
  greeting: { color: colors.muted, textAlign: 'right', marginTop: 3 },
  resumeCard: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.blueDark, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 18, marginBottom: 18 },
  resumeText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  resumeArrow: { color: '#fff', fontWeight: '900' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', textAlign: 'right' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, textAlign: 'right', marginTop: 8, marginBottom: 22 },
  roleCard: { backgroundColor: colors.card, borderRadius: 27, borderWidth: 1, padding: 21, marginBottom: 15 },
  requestCard: { borderColor: '#FFD8DE' },
  volunteerCard: { borderColor: colors.border },
  icon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  iconText: { fontSize: 28 },
  roleTitle: { fontSize: 22, fontWeight: '900', color: colors.text, textAlign: 'right', marginTop: 14 },
  roleText: { color: colors.muted, fontSize: 14, lineHeight: 22, textAlign: 'right', marginTop: 6 },
  arrow: { color: colors.blueDark, fontWeight: '900', marginTop: 16, textAlign: 'left' },
  notice: { backgroundColor: colors.blueSoft, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, marginTop: 4 },
  noticeText: { color: colors.blueDark, fontSize: 12, lineHeight: 18, textAlign: 'right' },
  adminRow: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  adminText: { color: colors.muted, fontWeight: '800' }
})
