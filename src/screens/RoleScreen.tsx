import { useEffect, useRef } from 'react'
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight, CarProfile, GearSix, HandHeart, Storefront, UserCircle } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, radius, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { Screen } from '../components/Screen'
import { Surface } from '../components/Surface'
import { StatusPill } from '../components/StatusPill'
import { ActionCard } from '../components/ActionCard'
import { Tactile } from '../components/Tactile'

export function RoleScreen({
  name,
  avatarUrl,
  isAdmin,
  activeKind,
  onRequester,
  onVolunteer,
  onAdmin,
  onResumeActive,
  onDiscoverPerks
}: {
  name: string
  avatarUrl: string | null
  isAdmin: boolean
  activeKind: 'request' | 'job' | null
  onRequester: () => void
  onVolunteer: () => void
  onAdmin: () => void
  onResumeActive: () => void
  onDiscoverPerks: () => void
}) {
  const { t } = useTranslation()
  const isRTL = useIsRTL()
  const dir = dirStyles(isRTL)
  const ForwardIcon = isRTL ? ArrowLeft : ArrowRight
  const pulse = useRef(new Animated.Value(0)).current

  // A gentle, continuous ambient pulse behind the identity mark - not a
  // one-time reveal, just a quiet sign of life while Home is on screen
  // (design brief section 49: "subtle network pulse", selective not
  // constant elsewhere).
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [pulse])

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] })
  const ringOpacity = pulse.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.35, 0.08, 0] })

  return (
    <Screen>
      <View style={[styles.top, dir.row]}>
        <View style={[styles.identity, dir.row]}>
          <View style={styles.avatarWrap}>
            <Animated.View style={[styles.pulseRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}><UserCircle size={22} color={colors.muted} weight="light" /></View>
            )}
          </View>
          <View>
            <Text style={[styles.brand, dir.textStart]}>{t('home.brand')}</Text>
            <Text style={[styles.greeting, dir.textStart]}>{t('home.greeting', { name: name || t('home.guestName') })}</Text>
          </View>
        </View>
      </View>

      {activeKind ? (
        <Tactile onPress={onResumeActive} style={styles.resumeCard} scaleTo={0.98}>
          <View style={[styles.resumeTop, dir.row]}>
            <StatusPill label={t('home.liveNow')} tone="success" pulse />
            <ForwardIcon size={18} color="#fff" />
          </View>
          <Text style={[styles.resumeText, dir.textStart]}>
            {activeKind === 'request' ? t('home.resumeRequest') : t('home.resumeJob')}
          </Text>
        </Tactile>
      ) : null}

      <Text style={[styles.title, dir.textStart]}>{t('home.title')}</Text>
      <Text style={[styles.subtitle, dir.textStart]}>{t('home.subtitle')}</Text>

      <ActionCard
        variant="primary"
        Icon={CarProfile}
        title={t('home.needHelp.title')}
        text={t('home.needHelp.text')}
        onPress={activeKind === 'request' ? onResumeActive : onRequester}
      />

      <ActionCard
        variant="secondary"
        Icon={HandHeart}
        title={t('home.wantToHelp.title')}
        text={t('home.wantToHelp.text')}
        onPress={onVolunteer}
      />

      {/* Deliberately a slim row, not a third ActionCard - Request Help and
          Help Mode are the two decisions this screen exists to present;
          Businesses/Offers is real and worth surfacing (design brief for
          this round: Home should hint at "what else SANAD provides" within
          a couple of seconds) but must read as a lighter-weight discovery
          link underneath them, not a third equally-weighted card. */}
      <Tactile onPress={onDiscoverPerks} style={[styles.perksRow, dir.row]} scaleTo={0.98}>
        <View style={styles.perksIconWrap}>
          <Storefront size={18} color={colors.forest} weight="duotone" />
        </View>
        <View style={[styles.perksTextWrap, dir.alignStart]}>
          <Text style={[styles.perksTitle, dir.textStart]}>{t('home.discoverPerks.title')}</Text>
          <Text style={[styles.perksText, dir.textStart]}>{t('home.discoverPerks.text')}</Text>
        </View>
        <ForwardIcon size={16} color={colors.muted} />
      </Tactile>

      {isAdmin ? (
        <Tactile onPress={onAdmin} style={[styles.adminRow, dir.row]}>
          <GearSix size={16} color={colors.muted} />
          <Text style={styles.adminText}>{t('home.adminLink')}</Text>
        </Tactile>
      ) : null}

      <Surface tone="muted" elevation="none" padding="lg" style={styles.notice}>
        <Text style={[styles.noticeText, dir.textStart]}>{t('home.notice')}</Text>
      </Surface>
    </Screen>
  )
}

const styles = StyleSheet.create({
  top: { justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xxl },
  identity: { alignItems: 'center', gap: space.md },
  avatarWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.forest },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border },
  avatarFallback: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 20, fontFamily: font.extraBold, color: colors.text },
  greeting: { color: colors.muted, fontFamily: font.regular, fontSize: 13, marginTop: 2 },

  resumeCard: { backgroundColor: colors.forest, borderRadius: radius.md, padding: space.lg, marginBottom: space.xl, gap: space.sm },
  resumeTop: { justifyContent: 'space-between', alignItems: 'center' },
  resumeText: { color: '#fff', fontFamily: font.bold, fontSize: 15 },

  title: { color: colors.text, fontSize: 28, fontFamily: font.extraBold },
  subtitle: { color: colors.muted, fontSize: 14.5, fontFamily: font.regular, marginTop: 6, marginBottom: space.xxl },

  perksRow: { alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.md, marginBottom: space.md },
  perksIconWrap: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  perksTextWrap: { flex: 1, gap: 1 },
  perksTitle: { color: colors.text, fontFamily: font.bold, fontSize: 14 },
  perksText: { color: colors.muted, fontFamily: font.regular, fontSize: 12 },

  adminRow: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: space.md, marginBottom: space.sm },
  adminText: { color: colors.muted, fontFamily: font.medium, fontSize: 13 },
  notice: { marginTop: space.xs },
  noticeText: { color: colors.forest, fontSize: 12, fontFamily: font.regular, lineHeight: 18 }
})
