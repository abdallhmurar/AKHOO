import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import { Screen } from '../components/Screen'

export function RoleScreen({ name, isAdmin, onRequester, onVolunteer, onAdmin, onHistory }: { name: string; isAdmin: boolean; onRequester: () => void; onVolunteer: () => void; onAdmin: () => void; onHistory: () => void }) {
  return (
    <Screen>
      <View style={styles.top}>
        <View>
          <Text style={styles.brand}>سَنَد</Text>
          <Text style={styles.greeting}>أهلاً {name || 'فيك'} 👋</Text>
        </View>
        <View style={styles.topActions}>
          <Pressable onPress={onHistory} style={styles.logout}><Text style={styles.logoutText}>السجل 🕘</Text></Pressable>
          <Pressable onPress={() => supabase.auth.signOut()} style={styles.logout}><Text style={styles.logoutText}>خروج</Text></Pressable>
        </View>
      </View>

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
        <Text style={styles.noticeText}>هذا هو أول إصدار: لا يوجد مركز اتصالات. توزيع الطلبات يتم مباشرة بين المستخدم والمتطوع.</Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 34 },
  topActions: { flexDirection: 'row-reverse', gap: 8 },
  brand: { fontSize: 28, fontWeight: '900', color: colors.blueDark, textAlign: 'right' },
  greeting: { color: colors.muted, textAlign: 'right', marginTop: 3 },
  logout: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, paddingVertical: 9, paddingHorizontal: 13, borderRadius: 13 },
  logoutText: { color: colors.blueDark, fontWeight: '800' },
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
  notice: { backgroundColor: colors.blueSoft, padding: 14, borderRadius: 17, marginTop: 4 },
  noticeText: { color: colors.blueDark, fontSize: 13, lineHeight: 20, textAlign: 'right' },
  adminRow: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  adminText: { color: colors.muted, fontWeight: '800' }
})
