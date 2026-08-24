import { useEffect, useRef } from 'react'
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native'
import { ArrowLeft, ArrowRight, CarProfile, GearSix, HandHeart, Storefront, UserCircle } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, radius, shadow, space, type } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { Screen } from '../components/Screen'
import { Surface } from '../components/Surface'
import { StatusPill } from '../components/StatusPill'
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

      <Text style={[type.eyebrow, styles.eyebrow, dir.textStart]}>{t('home.title')}</Text>

      {/* Hero action - the one thing this screen exists to answer within a
          couple of seconds (reference board: Home takeaway #1, "one
          dominant hero action, not two equal cards"). Deliberately much
          larger than the old ActionCard treatment: bigger icon, hero-scale
          type, a full-width forward affordance instead of a small pill. */}
      <Tactile
        onPress={activeKind === 'request' ? onResumeActive : onRequester}
        style={styles.hero}
        scaleTo={0.985}
      >
        <View style={[styles.heroTop, dir.row]}>
          <View style={styles.heroIconWrap}>
            <CarProfile size={34} color={colors.sand} weight="duotone" />
          </View>
          <View style={styles.heroForward}>
            <ForwardIcon size={18} color="#fff" />
          </View>
        </View>
        <Text style={[type.hero, styles.heroTitle, dir.textStart]}>{t('home.needHelp.title')}</Text>
        <Text style={[styles.heroText, dir.textStart]}>{t('home.needHelp.text')}</Text>
      </Tactile>

      {/* Help Mode and the perks/business discovery link now share one
          demoted, compact-row treatment underneath the hero (reference
          board: "Help Mode drops to a compact secondary strip" /
          "Discovery becomes a horizontal strip") - previously Help Mode was
          a second full ActionCard reading as equal weight to the hero. */}
      <View style={styles.secondaryCluster}>
        <CompactRow
          Icon={HandHeart}
          title={t('home.wantToHelp.title')}
          text={t('home.wantToHelp.text')}
          onPress={onVolunteer}
          ForwardIcon={ForwardIcon}
        />
        <CompactRow
          Icon={Storefront}
          title={t('home.discoverPerks.title')}
          text={t('home.discoverPerks.text')}
          onPress={onDiscoverPerks}
          ForwardIcon={ForwardIcon}
        />
      </View>

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

function CompactRow({
  Icon,
  title,
  text,
  onPress,
  ForwardIcon
}: {
  Icon: typeof HandHeart
  title: string
  text: string
  onPress: () => void
  ForwardIcon: typeof ArrowRight
}) {
  const dir = dirStyles(useIsRTL())
  return (
    <Tactile onPress={onPress} style={[styles.row, dir.row]} scaleTo={0.98}>
      <View style={styles.rowIconWrap}>
        <Icon size={19} color={colors.forest} weight="duotone" />
      </View>
      <View style={[styles.rowTextWrap, dir.alignStart]}>
        <Text style={[styles.rowTitle, dir.textStart]}>{title}</Text>
        <Text style={[styles.rowText, dir.textStart]} numberOfLines={1}>{text}</Text>
      </View>
      <ForwardIcon size={15} color={colors.muted} />
    </Tactile>
  )
}

const styles = StyleSheet.create({
  top: { justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl },
  identity: { alignItems: 'center', gap: space.md },
  avatarWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', width: 44, height: 44, borderRadius: 22, backgroundColor: colors.forest },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border },
  avatarFallback: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  brand: { fontSize: 19, fontFamily: font.extraBold, color: colors.text },
  greeting: { color: colors.muted, fontFamily: font.regular, fontSize: 13, marginTop: 2 },

  resumeCard: { backgroundColor: colors.forest, borderRadius: radius.md, padding: space.lg, marginBottom: space.xl, gap: space.sm },
  resumeTop: { justifyContent: 'space-between', alignItems: 'center' },
  resumeText: { color: '#fff', fontFamily: font.bold, fontSize: 15 },

  eyebrow: { color: colors.sage, marginBottom: space.md, textTransform: 'uppercase' },

  hero: { backgroundColor: colors.forest, borderRadius: radius.xl, padding: space.xxl, marginBottom: space.lg, ...shadow.elevated },
  heroTop: { justifyContent: 'space-between', alignItems: 'center', marginBottom: space.lg },
  heroIconWrap: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: '#FFFFFF1A', alignItems: 'center', justifyContent: 'center' },
  heroForward: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: '#FFFFFF26', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#fff' },
  heroText: { color: '#FFFFFFD0', fontFamily: font.regular, fontSize: 14.5, lineHeight: 21, marginTop: 6, maxWidth: '92%' },

  secondaryCluster: { gap: space.sm, marginBottom: space.lg },
  row: { alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: space.md },
  rowIconWrap: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  rowTextWrap: { flex: 1, gap: 1 },
  rowTitle: { color: colors.text, fontFamily: font.bold, fontSize: 14 },
  rowText: { color: colors.muted, fontFamily: font.regular, fontSize: 12 },

  adminRow: { alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: space.md, marginBottom: space.sm },
  adminText: { color: colors.muted, fontFamily: font.medium, fontSize: 13 },
  notice: { marginTop: space.xs },
  noticeText: { color: colors.forest, fontSize: 12, fontFamily: font.regular, lineHeight: 18 }
})
