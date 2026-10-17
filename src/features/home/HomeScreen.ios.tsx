import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'phosphor-react-native'
import Svg, { Path } from 'react-native-svg'
import { GuideTarget, useGuidePage } from '../guide/GuideProvider'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { useSanadTheme } from '../../lib/theme'
import { normalizeTypographyLanguage, useAppTypography } from '../../lib/typography'
import { useMission } from '../../providers'
import { AppScreen } from '../../components/v2'
import { AnnouncementBell } from '../announcements/AnnouncementBell'
import { Button, Card, StatusBadge } from '../../components/ui'
import { ArtIcon, MotionScene } from '../../components/motion/Motion.ios'
import { motionImages } from '../../components/motion/media.ios'
import { homeCopy } from './homeCopy.ios'

export function HomeScreen() {
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
      <Image source={motionImages.road} accessible={false} style={styles.fill} resizeMode="cover" />
      <View style={styles.bell}><AnnouncementBell /></View>
    </View>
    <View style={styles.stack}>
      {activeKind ? <Card tone="primary" bordered={false} elevation="soft" onPress={resume}><StatusBadge label={t('home.liveNow')} tone="success" dot /><Text style={[type.bodyMedium, align, { color: theme.colors.textPrimary }]}>{t(activeKind === 'request' ? 'home.resumeRequest' : 'home.resumeJob')}</Text></Card> : null}
      <GuideTarget id="home.request"><View style={[styles.request, { minHeight: Math.max(250, (frameWidth - 28) * 67 / 93) }]}>
        <View style={StyleSheet.absoluteFill}><MotionScene name="help" style={{ height: '100%', borderRadius: 22 }} /></View>
        <LinearGradient pointerEvents="none" colors={['#1c7bfa00', '#1c7bfaf0']} start={{ x: 0.35, y: 0 }} end={{ x: 1, y: 0 }} style={styles.requestShade} />
        <View style={[styles.requestCopy, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}><Svg width={44} height={39} viewBox="0 0 80 70" accessible={false}><Path d="M6 34h39l-6-13H15ZM5 34v22h8v-8h23M13 42h4m13 0h4M23 10V3M9 14l-5-5m34 4 5-6M58 24 38 59h40ZM58 37v9m0 6v1" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /></Svg><Text style={[type.h2, align, { color: '#fff', fontSize: Math.min(20, frameWidth * 0.055), alignSelf: 'stretch' }]}>{copy.requestTitle}</Text><Text style={[type.small, align, { color: '#fff', alignSelf: 'stretch' }]}>{copy.requestText}</Text></View>
        <View style={styles.requestButton}><Button label={copy.requestAction} variant="outline" onPress={() => activeKind === 'request' ? resume() : router.push('/requester')} style={{ backgroundColor: '#fff', borderRadius: 30, borderWidth: 0 }} /></View>
      </View></GuideTarget>
      <GuideTarget id="home.help"><View style={[styles.helper, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.helperArt}><MotionScene name="helper-home" style={{ height: '100%', borderRadius: 0 }} fit="contain" /></View>
        <View style={styles.helperCopy}><Text style={[type.caption, align, { color: theme.colors.community }]}>{copy.points}</Text><Text style={[type.h3, align, { color: theme.colors.community }]}>{copy.helperTitle}</Text><Button label={copy.helperAction} variant="community" size="sm" onPress={() => activeKind ? resume() : router.push('/helper')} style={{ paddingHorizontal: 10, borderRadius: 22 }} /></View>
      </View></GuideTarget>
      <GuideTarget id="home.perks"><LinearGradient colors={theme.isDark ? ['#253640', '#3a3528'] : ['#fffdf7', '#fff4d9']} style={[styles.rewards, dirStyles(isRTL).row]}>
        <ArtIcon name="gift" size={58} /><View style={styles.rewardCopy}><Text style={[type.bodyMedium, align, { color: theme.colors.textPrimary }]}>{copy.rewardsTitle}</Text><Text style={[type.caption, align, { color: theme.colors.textSecondary }]}>{copy.rewardsText}</Text></View><Button label={copy.rewardsAction} size="sm" variant="outline" onPress={() => router.push('/(tabs)/community')} fullWidth={false} style={{ paddingHorizontal: 12, borderRadius: 22 }} />
      </LinearGradient></GuideTarget>
      <View style={[styles.notice, dirStyles(isRTL).row]}><ShieldCheck size={19} color={theme.colors.community} /><Text style={[type.caption, { color: theme.colors.textMuted, textAlign: 'center', flex: 1 }]}>{copy.notice}</Text></View>
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
  helper: { borderWidth: 1, borderColor: '#91e7d8', borderRadius: 20, minHeight: 150, overflow: 'hidden' },
  helperArt: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '60%' },
  helperCopy: { width: '42%', marginLeft: 'auto', padding: 10, gap: 8 },
  rewards: { borderWidth: 1, borderColor: '#ffedc5', borderRadius: 18, padding: 10, gap: 8, alignItems: 'center' }, rewardCopy: { flex: 1, minWidth: 0, gap: 3 },
  notice: { paddingVertical: 5, alignItems: 'center', gap: 8 },
})
