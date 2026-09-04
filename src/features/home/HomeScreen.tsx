import { StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useAuth, useMission } from '../../providers'
import { ActionCard, AppScreen } from '../../components/v2'
import { Avatar, Card, StatusBadge, Surface } from '../../components/ui'
import HelpCardLottie from '../../components/help-card/HelpCardLottie'
import WantToHelpCard from '../../components/want-to-help-card/WantToHelpCard'

const discoverIllustration = require('../../../assets/images/help-shop-illustration.png')
const discoverFullCard = require('../../../assets/images/help-shop.png')

// Real SANAD Home: two equal-weight core actions (Request Help / Help
// Mode), a light discovery link to Perks, and the real "no call center"
// notice - not ccodex's civic-platform reimagining (no emergency dispatch
// UI, no invented copy system). Business logic comes from the real
// providers (useAuth/useMission, which already fall back to the live
// help_requests table).
export function HomeScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { t, i18n } = useTranslation()
  const helpCardLocale = i18n.language.startsWith('he') ? 'he' : i18n.language.startsWith('en') ? 'en' : 'ar'
  const router = useRouter()
  const { profile } = useAuth()
  const { activeMission, isRequester } = useMission()

  const activeKind: 'request' | 'job' | null = !activeMission ? null : isRequester ? 'request' : 'job'

  function resumeActive() {
    if (!activeMission) return
    router.push({ pathname: '/mission/[missionId]', params: { missionId: activeMission.id } })
  }

  return (
    <AppScreen contentStyle={styles.content}>
      <View style={[styles.top, dirStyles(isRTL).row]}>
        <View style={[styles.identity, dirStyles(isRTL).row]}>
          <Avatar name={profile?.full_name || 'AKHOO'} uri={profile?.avatar_url} size={44} />
          <View>
            <Text style={[typography.h3, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t('home.brand')}</Text>
            <Text style={[typography.small, { color: theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('home.greeting', { name: profile?.full_name?.trim().split(/\s+/)[0] || t('home.guestName') })}</Text>
          </View>
        </View>
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
        <Text style={[typography.eyebrow, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('home.title')}</Text>
      </View>

      <View style={styles.stack}>
        <HelpCardLottie
          locale={helpCardLocale}
          onPress={() => (activeKind === 'request' ? resumeActive() : router.push('/requester'))}
        />
        <WantToHelpCard
          title={t('home.wantToHelp.title')}
          description={t('home.wantToHelp.text')}
          onPress={() => (activeKind === 'job' ? resumeActive() : router.push('/helper'))}
        />
        <ActionCard
          illustration={discoverIllustration}
          fullCard={discoverFullCard}
          tone="neutral"
          title={t('home.discoverPerks.title')}
          description={t('home.discoverPerks.text')}
          onPress={() => router.push('/community')}
        />
      </View>

      <Surface tone="muted" bordered={false} padding="lg" style={styles.notice}>
        <Text style={[typography.caption, { color: theme.colors.community, textAlign: isRTL ? 'right' : 'left' }]}>{t('home.notice')}</Text>
      </Surface>
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: { paddingTop: space.lg, gap: space.lg },
  top: { alignItems: 'center' },
  identity: { alignItems: 'center', gap: space.md },
  resumeCard: { gap: space.sm },
  resumeTop: { alignItems: 'center' },
  heroCopy: { marginTop: space.xs },
  stack: { gap: space.md },
  notice: { marginTop: space.xs, borderRadius: radius.lg }
})
