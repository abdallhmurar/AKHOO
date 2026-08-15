import { useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import type { HelpRequest } from '../types'
import { Header } from '../components/Header'
import { Screen } from '../components/Screen'

const statusLabels: Record<string, string> = {
  open: 'نبحث عن متطوع',
  accepted: 'متطوع استلم الطلب',
  on_the_way: 'بالطريق',
  arrived: 'وصل',
  completed: 'تمت المساعدة',
  cancelled: 'ملغي'
}

const serviceLabels: Record<string, string> = {
  battery: '🔋 بطارية',
  tire: '🛞 بنشر',
  fuel: '⛽ وقود',
  locked_car: '🔑 سيارة مقفلة',
  other: '🧰 مساعدة أخرى'
}

const ACTIVE_STATUSES = ['open', 'accepted', 'on_the_way', 'arrived']

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('ar', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function HistoryScreen({ userId, onBack, onOpen }: { userId: string; onBack: () => void; onOpen: (request: HelpRequest) => void }) {
  const [items, setItems] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('help_requests')
      .select('*')
      .or(`requester_id.eq.${userId},volunteer_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) Alert.alert('خطأ', error.message)
        else setItems((data ?? []) as HelpRequest[])
        setLoading(false)
      })
  }, [userId])

  return (
    <Screen>
      <Header title="السجل" subtitle="كل طلباتك والمهام اللي ساعدت فيها." onBack={onBack} />

      {loading ? <Text style={styles.empty}>...تحميل</Text> : null}

      {!loading && items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🕘</Text>
          <Text style={styles.emptyTitle}>ما في شي بالسجل لسا</Text>
        </View>
      ) : null}

      {items.map(item => {
        const role = item.requester_id === userId ? 'requester' : 'volunteer'
        const active = ACTIVE_STATUSES.includes(item.status)
        return (
          <Pressable key={item.id} onPress={() => onOpen(item)} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.roleBadge}>{role === 'requester' ? 'طلبت مساعدة' : 'ساعدت'}</Text>
              {active ? <Text style={styles.activeBadge}>نشط الآن</Text> : null}
            </View>
            <Text style={styles.service}>{serviceLabels[item.service_type] ?? item.service_type}</Text>
            <Text style={styles.status}>{statusLabels[item.status] ?? item.status}</Text>
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </Pressable>
        )
      })}
    </Screen>
  )
}

const styles = StyleSheet.create({
  empty: { color: colors.muted, textAlign: 'center', marginTop: 20 },
  emptyCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 22, padding: 28, alignItems: 'center' },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roleBadge: { color: colors.blueDark, backgroundColor: colors.blueSoft, fontWeight: '800', fontSize: 12, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8 },
  activeBadge: { color: colors.green, backgroundColor: colors.greenSoft, fontWeight: '800', fontSize: 12, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8 },
  service: { color: colors.text, fontWeight: '900', fontSize: 16, textAlign: 'right' },
  status: { color: colors.muted, textAlign: 'right', marginTop: 4 },
  date: { color: colors.muted, textAlign: 'right', marginTop: 6, fontSize: 12 }
})
