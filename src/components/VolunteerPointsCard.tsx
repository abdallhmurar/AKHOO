import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Heart } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { colors, font, radius, shadow, space, type } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { ACTIVITY_LEVEL_THRESHOLDS, getVolunteerActivityLevel } from '../lib/activityLevel'
import { Tactile } from './Tactile'
import { VolunteerActivityBadge } from './VolunteerActivityBadge'

const TOP_THRESHOLD = ACTIVITY_LEVEL_THRESHOLDS.green
const TIER_MARKS = [ACTIVITY_LEVEL_THRESHOLDS.bronze, ACTIVITY_LEVEL_THRESHOLDS.silver, ACTIVITY_LEVEL_THRESHOLDS.gold, ACTIVITY_LEVEL_THRESHOLDS.green]

export function VolunteerPointsCard({ userId, memberSince, onViewActivity }: { userId: string; memberSince?: string; onViewActivity?: () => void }) {
  const { t, i18n } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const [stats, setStats] = useState<{ points: number; completedCount: number } | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      // Every consumer account can both request and give help (there is no
      // separate "volunteer" population - see the product model), so this
      // card's real (possibly zero) points/activity numbers must show for
      // every profile, not only accounts that have already toggled
      // availability at least once. Previously this bailed out entirely
      // when volunteer_profiles had no row yet, hiding the whole card -
      // including the always-real completed count and points, not just the
      // star badge (which already correctly hides itself at 0-4 - see
      // VolunteerActivityBadge) - for anyone who had only ever requested
      // help.
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

  // Segmented progress toward the next Activity Star tier (reference board:
  // Activity/Account - "the number itself becomes the composition's focal
  // point" / "segmented progress bar toward the next tier"). The track
  // always spans 0-60 (the green threshold) with tick marks at every real
  // threshold from lib/activityLevel.ts, never a duplicated copy of them.
  const level = getVolunteerActivityLevel(stats.completedCount)
  const nextThreshold = TIER_MARKS.find(mark => mark > stats.completedCount) ?? null
  const progressFraction = Math.min(stats.completedCount, TOP_THRESHOLD) / TOP_THRESHOLD

  return (
    <View style={styles.card}>
      <View style={[styles.top, dir.row]}>
        <View style={styles.iconWrap}>
          <Heart size={22} color={colors.forest} weight="duotone" />
        </View>
        <View style={[styles.topText, dir.alignStart]}>
          <Text style={[styles.title, dir.textStart]}>{t('points.title')}</Text>
          <VolunteerActivityBadge completedCount={stats.completedCount} compact={false} showLabel />
        </View>
      </View>

      <Text style={[type.statLg, styles.points, dir.textStart]}>{stats.points}</Text>
      <Text style={[styles.completedCount, dir.textStart]}>{t('points.completedCount', { count: stats.completedCount })}</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, isRTL ? { right: 0 } : { left: 0 }, { width: `${progressFraction * 100}%` }]} />
        {TIER_MARKS.map(mark => (
          <View
            key={mark}
            style={[
              styles.progressTick,
              isRTL ? { right: `${(mark / TOP_THRESHOLD) * 100}%`, marginRight: -5 } : { left: `${(mark / TOP_THRESHOLD) * 100}%`, marginLeft: -5 },
              stats.completedCount >= mark && styles.progressTickDone
            ]}
          />
        ))}
      </View>
      {nextThreshold ? (
        <Text style={[styles.progressLabel, dir.textStart]}>{t('points.nextTier', { remaining: nextThreshold - stats.completedCount })}</Text>
      ) : level === 'green' ? (
        <Text style={[styles.progressLabel, dir.textStart]}>{t('points.topTier')}</Text>
      ) : null}

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
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.xl, marginBottom: space.lg, ...shadow.soft },
  top: { alignItems: 'center', gap: space.md },
  iconWrap: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  topText: { flex: 1, gap: 4 },
  title: { color: colors.text, fontFamily: font.extraBold, fontSize: 15 },
  points: { color: colors.forest, marginTop: space.lg },
  completedCount: { color: colors.muted, fontFamily: font.regular, fontSize: 12.5, marginTop: 2 },

  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceMuted, marginTop: space.lg, position: 'relative', overflow: 'visible' },
  progressFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3, backgroundColor: colors.sand },
  progressTick: { position: 'absolute', top: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.border },
  progressTickDone: { borderColor: colors.sand, backgroundColor: colors.sand },
  progressLabel: { color: colors.muted, fontFamily: font.medium, fontSize: 11.5, marginTop: space.md },

  memberSince: { color: colors.muted, fontFamily: font.regular, fontSize: 11.5, marginTop: space.sm },
  viewActivity: { alignSelf: 'flex-start', marginTop: space.md },
  viewActivityText: { color: colors.forest, fontFamily: font.bold, fontSize: 13 }
})
