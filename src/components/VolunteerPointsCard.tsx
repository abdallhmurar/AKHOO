import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Heart } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors, font, radius, shadow, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'

export function VolunteerPointsCard({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const [stats, setStats] = useState<{ points: number; missions: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: volunteerProfile } = await supabase.from('volunteer_profiles').select('user_id').eq('user_id', userId).maybeSingle()
      if (!volunteerProfile || cancelled) return

      const { data } = await supabase.from('volunteer_point_transactions').select('points').eq('volunteer_id', userId)
      if (cancelled) return
      const rows = (data ?? []) as { points: number }[]
      setStats({ points: rows.reduce((sum, row) => sum + row.points, 0), missions: rows.length })
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  if (!stats) return null

  return (
    <View style={styles.card}>
      <View style={[styles.top, dir.row]}>
        <View style={styles.iconWrap}>
          <Heart size={24} color={colors.forest} weight="duotone" />
        </View>
        <View style={[styles.topText, dir.alignStart]}>
          <Text style={[styles.title, dir.textStart]}>{t('points.title')}</Text>
          <Text style={[styles.subtitle, dir.textStart]}>{t('points.completedCount', { count: stats.missions })}</Text>
        </View>
      </View>
      <Text style={[styles.points, dir.textStart]}>{stats.points}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg, marginBottom: space.lg, ...shadow.soft },
  top: { alignItems: 'center', gap: space.md },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  topText: { flex: 1 },
  title: { color: colors.text, fontFamily: font.extraBold, fontSize: 15 },
  subtitle: { color: colors.muted, fontFamily: font.regular, fontSize: 12.5, marginTop: 2 },
  points: { color: colors.forest, fontFamily: font.extraBold, fontSize: 34, marginTop: space.md }
})
