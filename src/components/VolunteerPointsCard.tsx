import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Heart } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors, font, radius, shadow, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { Tactile } from './Tactile'
import { VolunteerActivityBadge } from './VolunteerActivityBadge'

export function VolunteerPointsCard({ userId, memberSince, onViewActivity }: { userId: string; memberSince?: string; onViewActivity?: () => void }) {
  const { t, i18n } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const [stats, setStats] = useState<{ points: number; completedCount: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: volunteerProfile } = await supabase.from('volunteer_profiles').select('user_id').eq('user_id', userId).maybeSingle()
      if (!volunteerProfile || cancelled) return

      const [{ data: pointsRows }, { data: completedCount }] = await Promise.all([
        supabase.from('volunteer_point_transactions').select('points').eq('volunteer_id', userId),
        supabase.rpc('get_volunteer_completed_count', { p_volunteer_id: userId })
      ])
      if (cancelled) return
      const rows = (pointsRows ?? []) as { points: number }[]
      setStats({ points: rows.reduce((sum, row) => sum + row.points, 0), completedCount: (completedCount as number | null) ?? 0 })
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
          <VolunteerActivityBadge completedCount={stats.completedCount} compact={false} showLabel />
        </View>
      </View>

      <Text style={[styles.points, dir.textStart]}>{stats.points}</Text>
      <Text style={[styles.completedCount, dir.textStart]}>{t('points.completedCount', { count: stats.completedCount })}</Text>

      {memberSince ? (
        <Text style={[styles.memberSince, dir.textStart]}>
          {t('account.memberSince', { date: new Date(memberSince).toLocaleDateString(i18n.language, { year: 'numeric', month: 'long' }) })}
        </Text>
      ) : null}

      {onViewActivity ? (
        <Tactile onPress={onViewActivity} style={styles.viewActivity}>
          <Text style={styles.viewActivityText}>{t('account.viewActivity')}</Text>
        </Tactile>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg, marginBottom: space.lg, ...shadow.soft },
  top: { alignItems: 'center', gap: space.md },
  iconWrap: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  topText: { flex: 1, gap: 4 },
  title: { color: colors.text, fontFamily: font.extraBold, fontSize: 15 },
  points: { color: colors.forest, fontFamily: font.extraBold, fontSize: 34, marginTop: space.md },
  completedCount: { color: colors.muted, fontFamily: font.regular, fontSize: 12.5, marginTop: 2 },
  memberSince: { color: colors.muted, fontFamily: font.regular, fontSize: 11.5, marginTop: space.sm },
  viewActivity: { alignSelf: 'flex-start', marginTop: space.md },
  viewActivityText: { color: colors.forest, fontFamily: font.bold, fontSize: 13 }
})
