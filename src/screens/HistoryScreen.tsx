import { useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { HelpRequest } from '../types'
import { Header } from '../components/Header'
import { Screen } from '../components/Screen'

const ACTIVE_STATUSES = ['open', 'accepted', 'on_the_way', 'arrived']

const serviceLabelKeys: Record<string, string> = {
  battery: 'request.battery',
  tire: 'request.tire',
  fuel: 'request.fuel',
  locked_car: 'request.lockedCar',
  other: 'request.other'
}

export function HistoryScreen({ userId, onBack, onOpen }: { userId: string; onBack: () => void; onOpen: (request: HelpRequest) => void }) {
  const { t, i18n } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const [items, setItems] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString(i18n.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    supabase
      .from('help_requests')
      .select('*')
      .or(`requester_id.eq.${userId},volunteer_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) Alert.alert(t('common.error'), error.message)
        else setItems((data ?? []) as HelpRequest[])
        setLoading(false)
      })
  }, [userId, t])

  return (
    <Screen>
      <Header title={t('activity.title')} subtitle={t('activity.subtitle')} onBack={onBack} />

      {loading ? <Text style={styles.empty}>{t('common.loading')}</Text> : null}

      {!loading && items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🕘</Text>
          <Text style={styles.emptyTitle}>{t('activity.empty')}</Text>
        </View>
      ) : null}

      {items.map(item => {
        const role = item.requester_id === userId ? 'requester' : 'volunteer'
        const active = ACTIVE_STATUSES.includes(item.status)
        return (
          <Pressable key={item.id} onPress={() => onOpen(item)} style={styles.card}>
            <View style={[styles.cardTop, dir.row]}>
              <Text style={styles.roleBadge}>{role === 'requester' ? t('activity.roleRequester') : t('activity.roleVolunteer')}</Text>
              {active ? <Text style={styles.activeBadge}>{t('activity.activeNow')}</Text> : null}
            </View>
            <Text style={[styles.service, dir.textStart]}>{t(serviceLabelKeys[item.service_type] ?? 'request.other')}</Text>
            <Text style={[styles.status, dir.textStart]}>{t(`activity.status.${item.status}`)}</Text>
            <Text style={[styles.date, dir.textStart]}>{formatDate(item.created_at)}</Text>
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
  cardTop: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  roleBadge: { color: colors.blueDark, backgroundColor: colors.blueSoft, fontWeight: '800', fontSize: 12, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8 },
  activeBadge: { color: colors.green, backgroundColor: colors.greenSoft, fontWeight: '800', fontSize: 12, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8 },
  service: { color: colors.text, fontWeight: '900', fontSize: 16 },
  status: { color: colors.muted, marginTop: 4 },
  date: { color: colors.muted, marginTop: 6, fontSize: 12 }
})
