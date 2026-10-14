import { GuideTarget, useGuidePage } from '../guide/GuideProvider'
import { StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'phosphor-react-native'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useMission } from '../../providers'
import { AppScreen } from '../../components/v2'
import { AnnouncementBell } from '../announcements/AnnouncementBell'
import { Card, StatusBadge } from '../../components/ui'
import HelpCardLottie from '../../components/help-card/HelpCardLottie'
import WantToHelpCard from '../../components/want-to-help-card/WantToHelpCard'
import DiscoverCard from '../../components/discover-card/DiscoverCard'

// Keep web layout changes separate from the Android/iOS HomeScreen.
// Request/help actions and mission routing stay identical to native.
export function HomeScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t, i18n } = useTranslation()
  const helpCardLocale = i18n.language.startsWith('he') ? 'he' : i18n.language.startsWith('en') ? 'en' : 'ar'
  const router = useRouter()
  const { activeMission, isRequester } = useMission()

  useGuidePage('home')
  const activeKind: 'request' | 'job' | null = !activeMission ? null : isRequester ? 'request' : 'job'

  function resumeActive() {
    if (!activeMission) return
    router.push({ pathname: '/mission/[missionId]', params: { missionId: activeMission.id } })
  }

  return (
    <AppScreen background={theme.isDark ? theme.colors.background : '#F5F8FC'} contentStyle={styles.content}>
      <View style={[styles.topBar, dirStyles(isRTL).row]}>
        <View style={styles.topBarSpacer} />
        <AnnouncementBell />
      </View>

      {activeKind ? (
        <Card tone="primary" bordered={false} elevation="soft" onPress={resumeActive} style={styles.resumeCard}>
          <View style={[styles.resumeTop, dirStyles(isRTL).row]}>
            <StatusBadge label={t('home.liveNow')} tone="success" dot />
          </View>
          <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
            {activeKind === 'request' ? t('home.resumeRequest') : t('home.resumeJob')}
          </Text>
        </Card>
      ) : null}

      <View style={styles.heroCopy}>
        <Text style={[typography.hero, styles.heroLine, { color: theme.colors.textPrimary }]}>{t('home.title.main')}</Text>
        <Text style={[typography.hero, styles.heroLine, { color: theme.colors.primary }]}>{t('home.title.accent')}</Text>
      </View>

      <View style={styles.stack}>
        <GuideTarget id="home.request"><HelpCardLottie
          locale={helpCardLocale}
          onPress={() => (activeKind === 'request' ? resumeActive() : router.push('/requester'))}
        /></GuideTarget>
        <GuideTarget id="home.help"><WantToHelpCard
          locale={helpCardLocale}
          title={t('home.wantToHelp.title')}
          description={t('home.wantToHelp.text')}
          onPress={() => (activeKind ? resumeActive() : router.push('/helper'))}
        /></GuideTarget>
        <GuideTarget id="home.perks"><DiscoverCard
          locale={helpCardLocale}
          title={t('home.discoverPerks.title')}
          description={t('home.discoverPerks.text')}
          onPress={() => router.push('/(tabs)/community')}
        /></GuideTarget>
      </View>

      <View style={[styles.notice, dirStyles(isRTL).row]}>
        <Text style={[typography.smallMedium, styles.noticeText, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('home.notice')}</Text>
        <ShieldCheck size={26} color={theme.colors.community} weight="regular" style={styles.noticeIcon} aria-hidden />
      </View>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg, gap: space.lg },
  topBar: { alignItems: 'center', marginBottom: -space.sm },
  topBarSpacer: { flex: 1 },
  resumeCard: { gap: space.sm },
  resumeTop: { alignItems: 'center' },
  heroCopy: { alignItems: 'center', marginTop: space.xs },
  heroLine: { textAlign: 'center', fontSize: 29, lineHeight: 39 },
  stack: { gap: space.lg },
  notice: { alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingHorizontal: space.sm, paddingVertical: space.lg },
  noticeIcon: { flexShrink: 0 },
  noticeText: { flexShrink: 1, fontSize: 13, lineHeight: 22 }
})
