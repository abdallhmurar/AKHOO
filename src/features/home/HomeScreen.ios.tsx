import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { GuideTarget, useGuidePage } from '../guide/GuideProvider'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { useSanadTheme } from '../../lib/theme'
import { normalizeTypographyLanguage, useAppTypography } from '../../lib/typography'
import { useMission } from '../../providers'
import { AppScreen } from '../../components/v2'
import { AnnouncementBell } from '../announcements/AnnouncementBell'
import { Card, StatusBadge } from '../../components/ui'
import { Button } from '../../components/ui/Button.ios'
import { MotionScene } from '../../components/motion/Motion.ios'
import { BlendedArt } from '../../components/motion/BlendedArt.ios'
import { RewardsGift } from './RewardsGift.ios'
import { motionImages } from '../../components/motion/media.ios'
import { homeCopy } from './homeCopy.ios'
import Constants from 'expo-constants'
import { PartnerHomeScreen } from './PartnerHomeScreen.ios'

export function HomeScreen() {
  return Constants.expoConfig?.extra?.partnerHomeBeta === true ? <PartnerHomeScreen /> : <ExistingHomeScreen />
}

function ExistingHomeScreen() {
  const theme = useSanadTheme(), type = useAppTypography(), isRTL = useIsRTL()
  const { t, i18n } = useTranslation()
  const copy = homeCopy[normalizeTypographyLanguage(i18n.language)]
  const router = useRouter()
  const { width } = useWindowDimensions()
  const frameWidth = Math.min(width, 480)
  const { activeMission, isRequester } = useMission()
  useGuidePage('home')
  const activeKind = !activeMission ? null : isRequester ? 'request' : 'job'
  const resume = () => { if (activeMission) router.push({ pathname: '/mission/[missionId]', params: { missionId: activeMission.id } }) }
  const align = { textAlign: isRTL ? 'right' as const : 'left' as const }
  return <AppScreen contentStyle={styles.content} scrollProps={{ contentContainerStyle: { paddingBottom: 12 } }}>
    <View style={[styles.header, { height: frameWidth / 3 }]} accessibilityLabel={copy.heading}>
      <BlendedArt edge="bottom" start={0.86}><Image source={motionImages.road} accessible={false} style={[styles.fill, theme.isDark && { opacity: 0.72 }]} resizeMode="cover" /></BlendedArt>
      <View style={styles.bell}><AnnouncementBell /></View>
    </View>
    <View style={styles.stack}>
      {activeKind ? <Card tone="primary" bordered={false} elevation="soft" onPress={resume}><StatusBadge label={t('home.liveNow')} tone="success" dot /><Text style={[type.bodyMedium, align, { color: theme.colors.textPrimary }]}>{t(activeKind === 'request' ? 'home.resumeRequest' : 'home.resumeJob')}</Text></Card> : null}
      <GuideTarget id="home.request"><View style={[styles.request, { minHeight: Math.max(218, (frameWidth - 28) * 0.61), backgroundColor: theme.isDark ? '#124276' : '#2386ff' }]}>
        <View style={StyleSheet.absoluteFill}><MotionScene name="help" style={{ height: '100%', borderRadius: 22 }} /></View>
        <LinearGradient pointerEvents="none" colors={theme.isDark ? ['#12427600', '#124276f0'] : ['#1c7bfa00', '#1c7bfaf0']} start={{ x: 0.35, y: 0 }} end={{ x: 1, y: 0 }} style={styles.requestShade} />
        <View style={[styles.requestCopy, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}><Text style={[type.h2, align, { color: '#fff', fontSize: Math.min(20, frameWidth * 0.055), alignSelf: 'stretch' }]}>{copy.requestTitle}</Text><Text style={[type.small, align, { color: '#fff', alignSelf: 'stretch' }]}>{copy.requestText}</Text></View>
        <View style={styles.requestButton}><Button label={copy.requestAction} variant="outline" labelColor="#1768E5" onPress={() => activeKind === 'request' ? resume() : router.push('/requester')} style={{ backgroundColor: '#fff', borderWidth: 0 }} /></View>
      </View></GuideTarget>
      <GuideTarget id="home.help"><View style={[styles.helper, { backgroundColor: theme.colors.surface, borderColor: theme.isDark ? theme.colors.border : '#91e7d8' }]}>
        <View style={styles.helperBody}>
          <View style={styles.helperArt}><BlendedArt start={0.74}><MotionScene name="helper-home" fit="contain" style={{ height: '100%', borderRadius: 0 }} /></BlendedArt></View>
          <View style={styles.helperCopy}><Text style={[type.caption, align, { color: theme.colors.community }]}>{copy.points}</Text><Text style={[type.h3, align, { color: theme.colors.community }]}>{copy.helperTitle}</Text></View>
        </View>
        <View style={styles.cardAction}><Button label={copy.helperAction} variant="community" onPress={() => activeKind ? resume() : router.push('/helper')} /></View>
      </View></GuideTarget>
      <GuideTarget id="home.perks"><LinearGradient colors={theme.isDark ? ['#253640', '#3a3528'] : ['#fffdf7', '#fff4d9']} style={[styles.rewards, dirStyles(isRTL).row, { borderColor: theme.isDark ? theme.colors.border : '#ffedc5' }]}>
        <RewardsGift label={copy.giftAction} onFallback={() => router.push('/(tabs)/community')} />
        <View style={styles.rewardCopy}>
          <Text style={[type.bodyMedium, align, { color: theme.colors.textPrimary }]}>{copy.rewardsTitle}</Text>
          <Text style={[type.caption, align, { color: theme.colors.textSecondary }]}>{copy.rewardsText}</Text>
          <Button label={copy.rewardsAction} size="sm" variant="outline" onPress={() => router.push('/(tabs)/community')} fullWidth={false} style={{ alignSelf: isRTL ? 'flex-end' : 'flex-start', paddingHorizontal: 20, marginTop: 4 }} />
        </View>
      </LinearGradient></GuideTarget>
    </View>
  </AppScreen>
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingTop: 0, gap: 0 },
  fill: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  header: { width: '100%', position: 'relative', marginBottom: -12 }, bell: { position: 'absolute', top: 10, left: 14 },
  stack: { paddingHorizontal: 14, gap: 12 }, request: { borderRadius: 22, overflow: 'hidden', backgroundColor: '#2386ff' },
  requestShade: { ...StyleSheet.absoluteFill, bottom: '28%' }, requestCopy: { marginLeft: '50%', marginRight: '4%', paddingTop: 16, paddingBottom: 18, gap: 5 },
  requestButton: { marginTop: 'auto', marginHorizontal: 12, marginBottom: 12 },
  helper: { borderWidth: 1, borderRadius: 22, overflow: 'hidden' },
  helperBody: { minHeight: 116, justifyContent: 'center' },
  helperArt: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '58%' },
  helperCopy: { width: '46%', marginLeft: 'auto', padding: 12, gap: 8 },
  cardAction: { marginHorizontal: 12, marginBottom: 12, marginTop: 4 },
  rewards: { borderWidth: 1, borderRadius: 22, padding: 12, gap: 12, alignItems: 'center' }, rewardCopy: { flex: 1, minWidth: 0, gap: 3 },
})
