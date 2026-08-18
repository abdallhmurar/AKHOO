import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { HelpRequest, Profile, VolunteerProfile } from '../types'
import { Header } from '../components/Header'
import { Screen } from '../components/Screen'

type Tab = 'requests' | 'users' | 'volunteers'

export function AdminScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const [tab, setTab] = useState<Tab>('requests')
  const [requests, setRequests] = useState<HelpRequest[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [volunteers, setVolunteers] = useState<VolunteerProfile[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    if (tab === 'requests') {
      const { data, error } = await supabase.from('help_requests').select('*').order('created_at', { ascending: false }).limit(100)
      if (error) Alert.alert(t('common.error'), error.message)
      else setRequests(data as HelpRequest[])
    } else if (tab === 'users') {
      const { data, error } = await supabase.from('profiles').select('id,full_name,phone,avatar_url,is_admin,is_banned').order('created_at', { ascending: false }).limit(100)
      if (error) Alert.alert(t('common.error'), error.message)
      else setUsers(data as Profile[])
    } else {
      const { data, error } = await supabase.from('volunteer_profiles').select('*').eq('is_verified', false).limit(100)
      if (error) Alert.alert(t('common.error'), error.message)
      else setVolunteers(data as VolunteerProfile[])
    }
    setLoading(false)
  }, [tab, t])

  useEffect(() => {
    load()
  }, [load])

  async function cancelRequest(id: string) {
    const { error } = await supabase.rpc('admin_cancel_help_request', { p_request_id: id })
    if (error) Alert.alert(t('common.error'), error.message)
    else load()
  }

  async function setBanned(userId: string, banned: boolean) {
    const { error } = await supabase.rpc('admin_set_user_banned', { p_user_id: userId, p_banned: banned })
    if (error) Alert.alert(t('common.error'), error.message)
    else load()
  }

  async function verifyVolunteer(userId: string) {
    const { error } = await supabase.rpc('admin_set_volunteer_verified', { p_user_id: userId, p_verified: true })
    if (error) Alert.alert(t('common.error'), error.message)
    else load()
  }

  return (
    <Screen>
      <Header title={t('admin.title')} subtitle={t('admin.subtitle')} onBack={onBack} />

      <View style={[styles.tabs, dir.row]}>
        <Pressable onPress={() => setTab('requests')} style={[styles.tab, tab === 'requests' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'requests' && styles.tabTextActive]}>{t('admin.tabs.requests')}</Text>
        </Pressable>
        <Pressable onPress={() => setTab('users')} style={[styles.tab, tab === 'users' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'users' && styles.tabTextActive]}>{t('admin.tabs.users')}</Text>
        </Pressable>
        <Pressable onPress={() => setTab('volunteers')} style={[styles.tab, tab === 'volunteers' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'volunteers' && styles.tabTextActive]}>{t('admin.tabs.volunteers')}</Text>
        </Pressable>
      </View>

      {loading ? <Text style={styles.loading}>{t('admin.loading')}</Text> : null}

      {!loading && tab === 'requests' ? requests.map(r => (
        <View key={r.id} style={styles.card}>
          <Text style={[styles.cardTitle, dir.textStart]}>{r.id.slice(0, 8).toUpperCase()} · {t(`admin.status.${r.status}`)}</Text>
          <Text style={[styles.cardMeta, dir.textStart]}>{t('admin.requesterLabel', { id: r.requester_id.slice(0, 8) })}</Text>
          {r.volunteer_id ? <Text style={[styles.cardMeta, dir.textStart]}>{t('admin.volunteerLabel', { id: r.volunteer_id.slice(0, 8) })}</Text> : null}
          {r.status !== 'completed' && r.status !== 'cancelled' ? (
            <Pressable onPress={() => cancelRequest(r.id)} style={styles.dangerButton}>
              <Text style={styles.dangerText}>{t('admin.cancelRequest')}</Text>
            </Pressable>
          ) : null}
        </View>
      )) : null}

      {!loading && tab === 'users' ? users.map(u => (
        <View key={u.id} style={styles.card}>
          <Text style={[styles.cardTitle, dir.textStart]}>{u.full_name || t('admin.noName')} {u.is_banned ? t('admin.banned') : ''}</Text>
          <Text style={[styles.cardMeta, dir.textStart]}>{u.phone ?? t('admin.noPhone')}</Text>
          <Pressable onPress={() => setBanned(u.id, !u.is_banned)} style={u.is_banned ? styles.button : styles.dangerButton}>
            <Text style={u.is_banned ? styles.buttonText : styles.dangerText}>{u.is_banned ? t('admin.unban') : t('admin.ban')}</Text>
          </Pressable>
        </View>
      )) : null}

      {!loading && tab === 'volunteers' ? (
        volunteers.length === 0 ? <Text style={styles.loading}>{t('admin.noVolunteersPending')}</Text> :
        volunteers.map(v => (
          <View key={v.user_id} style={styles.card}>
            <Text style={[styles.cardTitle, dir.textStart]}>{v.user_id.slice(0, 8).toUpperCase()}</Text>
            <Text style={[styles.cardMeta, dir.textStart]}>{t('admin.servicesLabel', { services: v.services.length ? v.services.join(', ') : t('admin.servicesUnset') })}</Text>
            <Pressable onPress={() => verifyVolunteer(v.user_id)} style={styles.button}>
              <Text style={styles.buttonText}>{t('admin.verifyVolunteer')}</Text>
            </Pressable>
          </View>
        ))
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  tabs: { gap: 8, marginBottom: 18 },
  tab: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  tabText: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  tabTextActive: { color: '#fff' },
  loading: { color: colors.muted, textAlign: 'center', marginTop: 20 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 14, marginBottom: 10 },
  cardTitle: { color: colors.text, fontWeight: '900', fontSize: 15 },
  cardMeta: { color: colors.muted, marginTop: 4, fontSize: 13 },
  button: { backgroundColor: colors.blueSoft, borderRadius: 12, alignItems: 'center', paddingVertical: 10, marginTop: 10 },
  buttonText: { color: colors.blueDark, fontWeight: '800' },
  dangerButton: { backgroundColor: colors.redSoft, borderRadius: 12, alignItems: 'center', paddingVertical: 10, marginTop: 10 },
  dangerText: { color: colors.red, fontWeight: '800' }
})
