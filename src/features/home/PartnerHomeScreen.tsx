import { useState } from 'react'
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppScreen } from '../../components/v2'
import { useAppTypography, normalizeTypographyLanguage } from '../../lib/typography'
import { useIsRTL, dirStyles } from '../../lib/direction'
import { useSanadTheme } from '../../lib/theme'
import { useMission } from '../../providers'
import { AnnouncementBell } from '../announcements/AnnouncementBell'
import { GuideTarget, useGuidePage } from '../guide/GuideProvider'
import { homeCopy } from './homeCopy.ios'
import { partnerBetaCopy } from './partnerBetaCopy'
import { partnerHomeLayout } from './partnerBetaModel'
import { PartnerEnrollment } from './PartnerEnrollment'
import { PartnerScene as MotionScene } from './PartnerMotion'

// Fades the art into the card without a mask: the same colour at zero alpha, so no grey band appears mid-gradient.
const clear = (hex: string) => (/^#[0-9a-fA-F]{6}$/.test(hex) ? hex + '00' : '#00000000')

// The partner / home layout of the iPhone build 2.0.4 (31), for Android. Same copy, layout model and behaviour as
// `PartnerHomeScreen.ios.tsx`; the scenes come from `PartnerMotion.tsx` and the feather uses a gradient overlay.
export function PartnerHomeScreen() {
  const { t, i18n } = useTranslation()
  const language = normalizeTypographyLanguage(i18n.language)
  const copy = partnerBetaCopy[language], home = homeCopy[language]
  const type = useAppTypography(), theme = useSanadTheme(), rtl = useIsRTL()
  const { fontScale } = useWindowDimensions()
  const router = useRouter()
  const { activeMission, isRequester } = useMission()
  const [height, setHeight] = useState(600)
  const [partnerOpen, setPartnerOpen] = useState(false)
  useGuidePage('home', !partnerOpen)
  const layout = partnerHomeLayout(height, Boolean(activeMission), fontScale)
  const textAlign = rtl ? 'right' : 'left'
  const resume = () => { if (activeMission) router.push({ pathname: '/mission/[missionId]', params: { missionId: activeMission.id } }) }
  const request = () => activeMission && isRequester ? resume() : router.push('/requester')
  const help = () => activeMission ? resume() : router.push('/helper')
  const perks = () => router.push('/(tabs)/community')
  return <AppScreen scroll={false} unsafeBottom contentStyle={styles.content}>
    <View style={[styles.stack, { gap: layout.gap }]} onLayout={event => setHeight(event.nativeEvent.layout.height)}>
      <View style={[styles.banner, { height: layout.banner }]}>
        <View style={StyleSheet.absoluteFill}><MotionScene name="partner-home" paused={partnerOpen} style={{ height: '100%', borderRadius: 22 }} /></View>
        <View style={styles.bell}><AnnouncementBell /></View>
        <View style={[styles.bannerCopy, { gap: layout.compact ? 0 : 2 }]}>
          {!layout.compact ? <Text maxFontSizeMultiplier={1.2} style={[type.caption, styles.white, { textAlign, fontSize: 10 }]}>{copy.brand}</Text> : null}
          {!layout.minimal ? <Text maxFontSizeMultiplier={1.2} style={[type.h3, styles.white, { textAlign, fontSize: layout.compact ? 16 : 18, lineHeight: layout.compact ? 23 : 26 }]}>{copy.bannerTitle}</Text> : null}
          {!layout.compact ? <Text maxFontSizeMultiplier={1.1} style={[type.caption, styles.white, { textAlign, fontSize: 9, lineHeight: 15 }]}>{copy.bannerText}</Text> : null}
          <Pressable accessibilityRole="button" onPress={() => setPartnerOpen(true)} style={({ pressed }) => [styles.join, pressed && styles.pressed]}>
            <Text maxFontSizeMultiplier={1.3} style={[type.button, { color: '#0056c9', textAlign: 'center', fontSize: 11, lineHeight: 17 }]}>{copy.join}</Text>
          </Pressable>
        </View>
      </View>

      {activeMission ? <Pressable onPress={resume} accessibilityRole="button" style={[styles.resume, { height: layout.resume, backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <Text maxFontSizeMultiplier={1.3} style={[type.bodyMedium, { textAlign, color: theme.colors.community }]}>{t(isRequester ? 'home.resumeRequest' : 'home.resumeJob')} {rtl ? '←' : '→'}</Text>
      </Pressable> : null}

      <GuideTarget id="home.request" style={styles.grow}>
        <Pressable accessibilityRole="button" accessibilityLabel={`${home.requestTitle}. ${home.requestAction}`} onPress={request} style={({ pressed }) => [styles.helpCard, styles.grow, pressed && styles.pressed]}>
          <LinearGradient pointerEvents="none" colors={['#ff504b', '#b20d4c', '#970d43']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          {!layout.minimal ? <>
            <View pointerEvents="none" style={styles.requestArt}><MotionScene name="help-rose" fit="contain" paused={partnerOpen} style={{ height: '100%', borderRadius: 0 }} /></View>
            <LinearGradient pointerEvents="none" colors={['#a90e4800', '#a90e48e6', '#9d1048']} locations={[0, .62, 1]} start={{ x: .5, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <View pointerEvents="none" style={styles.requestCopy}><Text maxFontSizeMultiplier={1.25} style={[type.h2, styles.white, { textAlign, fontSize: layout.compact ? 17 : 20 }]}>{home.requestTitle}</Text>
              {!layout.compact ? <Text maxFontSizeMultiplier={1.2} style={[type.small, styles.white, { textAlign }]}>{home.requestText}</Text> : null}
            </View>
          </> : null}
          <View pointerEvents="none" style={[styles.action, !layout.minimal && styles.whiteAction, layout.minimal && styles.minimalAction]}>
            <Text maxFontSizeMultiplier={1.4} style={[type.button, { color: layout.minimal ? '#fff' : '#a20c43', textAlign: 'center' }]}>{home.requestAction}</Text>
          </View>
        </Pressable>
      </GuideTarget>

      <GuideTarget id="home.help" style={styles.grow}>
        <View style={[styles.helperCard, styles.grow, { backgroundColor: theme.colors.surface }]}>
          {!layout.minimal ? <>
            <View style={styles.helperArt}>
              <MotionScene name="helper-home" fit="contain" paused={partnerOpen} style={{ height: '100%', borderRadius: 0 }} />
              <LinearGradient pointerEvents="none" colors={[clear(theme.colors.surface), theme.colors.surface]} locations={[.7, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            </View>
            <View style={styles.helpCopy}>
              {!layout.compact ? <Text maxFontSizeMultiplier={1.2} style={[type.caption, { textAlign, color: theme.colors.community }]}>{home.points}</Text> : null}
              <Text maxFontSizeMultiplier={1.25} style={[type.h3, { textAlign, color: theme.colors.community }]}>{home.helperTitle}</Text>
            </View>
          </> : null}
          <Pressable accessibilityRole="button" onPress={help} style={({ pressed }) => [styles.action, styles.greenAction, layout.minimal && styles.minimalAction, pressed && styles.pressed]}>
            <Text maxFontSizeMultiplier={1.4} style={[type.button, styles.white, { textAlign: 'center' }]}>{home.helperAction}</Text>
          </Pressable>
        </View>
      </GuideTarget>

      <GuideTarget id="home.perks">
        <Pressable accessibilityRole="button" accessibilityLabel={`${copy.rewardsTitle}. ${copy.rewardsText}. ${copy.explore}`} onPress={perks} style={({ pressed }) => [styles.ticket, { height: layout.rewards }, pressed && styles.pressed]}>
          <LinearGradient colors={['#064ca9', '#0c7fff']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} style={[styles.ticketInner, dirStyles(rtl).row]}>
            {!layout.minimal ? <View style={styles.coupons} accessibilityElementsHidden>
              <View style={[styles.coupon, styles.couponBack]} />
              <View style={styles.coupon}><Text style={styles.percent}>%</Text></View>
            </View> : null}
            <View style={styles.rewardCopy}>
              <Text maxFontSizeMultiplier={1.3} style={[type.bodyMedium, styles.white, { textAlign, fontSize: 14 }]}>{copy.rewardsTitle}</Text>
              {!layout.minimal ? <Text maxFontSizeMultiplier={1.1} style={[type.caption, { textAlign, color: '#d7eeff', fontSize: 10 }]}>{copy.rewardsText}</Text> : null}
            </View>
            <View style={[styles.stub, rtl ? styles.stubRTL : styles.stubLTR]}>
              <Text maxFontSizeMultiplier={1.2} style={[type.caption, styles.white, { textAlign: 'center' }]}>{copy.explore}</Text>
              <Text style={styles.arrow}>{rtl ? '←' : '→'}</Text>
            </View>
          </LinearGradient>
        </Pressable>
      </GuideTarget>
    </View>
    {partnerOpen ? <PartnerEnrollment onClose={() => setPartnerOpen(false)} /> : null}
  </AppScreen>
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 8, paddingTop: 4, paddingBottom: 2, gap: 0 },
  stack: { flex: 1 }, grow: { flex: 1, minHeight: 44 }, white: { color: '#fff' }, pressed: { opacity: .8 },
  banner: { borderRadius: 22, backgroundColor: '#0055b8', overflow: 'hidden' },
  bannerCopy: { width: '47%', alignSelf: 'flex-end', paddingHorizontal: 10, flex: 1, justifyContent: 'center' },
  bell: { position: 'absolute', left: 8, top: 8 },
  join: { minHeight: 44, backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: 5, justifyContent: 'center' },
  resume: { borderRadius: 16, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1 },
  helpCard: { overflow: 'hidden', borderRadius: 22, backgroundColor: '#a90e48' },
  requestArt: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 48 },
  requestCopy: { marginLeft: '55%', marginRight: 14, flex: 1, justifyContent: 'center', gap: 5, paddingTop: 6, paddingBottom: 58 },
  helpCopy: { marginLeft: '51%', marginRight: 12, flex: 1, justifyContent: 'center', gap: 4, paddingTop: 4, paddingBottom: 52 },
  action: { position: 'absolute', bottom: 10, left: 10, right: 10, borderRadius: 15, minHeight: 44, paddingVertical: 4, justifyContent: 'center' },
  whiteAction: { backgroundColor: '#fff' }, greenAction: { backgroundColor: '#087c69' },
  minimalAction: { top: 0, bottom: 0, left: 0, right: 0 },
  helperCard: { borderRadius: 22, borderWidth: 1, borderColor: '#91e7d8', overflow: 'hidden' },
  helperArt: { position: 'absolute', left: 0, top: 0, bottom: 42, width: '58%' },
  ticket: { borderRadius: 20, overflow: 'hidden' },
  ticketInner: { flex: 1, alignItems: 'center', gap: 7, paddingHorizontal: 12 },
  coupons: { width: 48, height: 46, justifyContent: 'center', alignItems: 'center' },
  coupon: { position: 'absolute', width: 32, height: 40, borderRadius: 7, backgroundColor: '#fff', transform: [{ rotate: '-12deg' }], alignItems: 'center', justifyContent: 'center', shadowColor: '#002c72', shadowOpacity: .25, shadowOffset: { width: 0, height: 3 }, shadowRadius: 4 },
  couponBack: { backgroundColor: '#38dacb', transform: [{ rotate: '15deg' }, { translateX: 7 }], top: 0 },
  percent: { fontSize: 23, fontWeight: '800', color: '#1372e8' }, rewardCopy: { flex: 1, minWidth: 0, gap: 2 },
  stub: { width: 62, alignSelf: 'stretch', justifyContent: 'center', paddingHorizontal: 5, borderColor: '#77b8f8', borderStyle: 'dashed' },
  stubRTL: { borderRightWidth: 1 }, stubLTR: { borderLeftWidth: 1 }, arrow: { color: '#fff', fontSize: 22, textAlign: 'center', lineHeight: 25 },
})
