import { useState } from 'react'
import type { CSSProperties } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { usePathname, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useGuide, useGuidePage } from '../guide/GuideProvider'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { space, useSanadTheme } from '../../lib/theme'
import { useAppFont, useAppTypography, normalizeTypographyLanguage } from '../../lib/typography'
import { useMission } from '../../providers'
import { AppScreen } from '../../components/v2'
import { AnnouncementBell } from '../announcements/AnnouncementBell'
import { Card, StatusBadge } from '../../components/ui'
import { PartnerEnrollment } from './PartnerEnrollment.web'
import { PartnerHomeVisuals } from './PartnerHomeVisuals.web'

// The web home follows the iPhone TestFlight 2.0.4 (31) layout: partner banner, rose help card, helper card, rewards
// ticket. Mission routing, announcements and guide targets continue to use the existing application providers.
export function HomeScreen() {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const bold = useAppFont('bold')
  const extra = useAppFont('extraBold')
  const isRTL = useIsRTL()
  const { t, i18n } = useTranslation()
  const locale = normalizeTypographyLanguage(i18n.language)
  const router = useRouter()
  const { activeMission, isRequester } = useMission()
  const focused = usePathname() === '/'
  const guide = useGuide()
  const [partnerOpen, setPartnerOpen] = useState(false)
  useGuidePage('home', !partnerOpen)
  const activeKind: 'request' | 'job' | null = !activeMission ? null : isRequester ? 'request' : 'job'

  function resumeActive() {
    if (!activeMission) return
    router.push({ pathname: '/mission/[missionId]', params: { missionId: activeMission.id } })
  }

  return (
    <AppScreen background={theme.isDark ? theme.colors.background : '#F2FBFF'} contentStyle={styles.content} scrollProps={{ contentContainerStyle: styles.scroll }}>
      <div className="akh-home" dir={isRTL ? 'rtl' : 'ltr'} lang={locale} data-dark={theme.isDark} style={{ '--akh-font': bold, '--akh-bold': bold, '--akh-extra': extra } as CSSProperties}>
        <PartnerHomeVisuals
          language={locale}
          rtl={isRTL}
          active={focused && !guide?.blocking && !partnerOpen}
          bell={<AnnouncementBell />}
          resume={activeKind ? (
          <div className="akh-home-resume">
            <Card tone="primary" bordered={false} elevation="soft" onPress={resumeActive} style={styles.resumeCard}>
              <View style={[styles.resumeTop, dirStyles(isRTL).row]}>
                <StatusBadge label={t('home.liveNow')} tone="success" dot />
              </View>
              <Text style={[typography.bodyMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {activeKind === 'request' ? t('home.resumeRequest') : t('home.resumeJob')}
              </Text>
            </Card>
          </div>
        ) : null}
          onJoin={() => setPartnerOpen(true)}
          onRequest={() => (activeKind === 'request' ? resumeActive() : router.push('/requester'))}
          onHelp={() => (activeKind ? resumeActive() : router.push('/helper'))}
          onPerks={() => router.push('/(tabs)/community')}
        />
      </div>
      {partnerOpen ? <PartnerEnrollment onClose={() => setPartnerOpen(false)} /> : null}
    </AppScreen>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingTop: 0, gap: 0, width: '100%', maxWidth: 480, alignSelf: 'center' },
  scroll: { paddingBottom: 0 },
  resumeCard: { gap: space.sm },
  resumeTop: { alignItems: 'center' }
})
