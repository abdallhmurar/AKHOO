import { CaretLeft, CaretRight, Gift } from 'phosphor-react-native'
import { getFontFamily } from '../../lib/typography'
import { useSanadTheme } from '../../lib/theme'

type Locale = 'ar' | 'he' | 'en'

type Props = {
  locale?: Locale
  title: string
  description?: string
  onPress: () => void
}

// This compact points link is web-only. Native retains its illustrated card.
const LABELS: Record<Locale, string> = {
  ar: 'استخدم نقاط مساعداتك بعروض «مزايا أخو»',
  he: 'השתמשו בנקודות העזרה שלכם בהטבות AKHOO',
  en: 'Use your helping points for AKHOO Perks offers',
}

export default function DiscoverCard({ locale = 'ar', onPress }: Props) {
  const theme = useSanadTheme()
  const isRTL = locale !== 'en'
  const Arrow = isRTL ? CaretLeft : CaretRight

  return (
    <button
      type="button"
      dir={isRTL ? 'rtl' : 'ltr'}
      onClick={onPress}
      style={{
        width: '100%',
        minHeight: 64,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        border: `1px solid ${theme.isDark ? theme.colors.community : '#ADEBDD'}`,
        borderRadius: 22,
        background: theme.isDark ? theme.colors.communitySoft : 'linear-gradient(110deg, #EFFCF7, #F3FDFB)',
        color: theme.colors.community,
        fontFamily: getFontFamily(locale, 'semibold'),
        fontSize: 15,
        lineHeight: 1.6,
        textAlign: 'start',
        cursor: 'pointer',
        outlineOffset: 4,
        boxShadow: theme.isDark ? 'none' : '0 5px 18px rgba(20, 125, 98, 0.035)',
      }}
    >
      <span aria-hidden="true" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: theme.isDark ? theme.colors.surface : '#D6F5EB',
      }}>
        <Gift size={26} color={theme.colors.community} weight="regular" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{LABELS[locale]}</span>
      <span
        aria-hidden="true"
        style={{
          width: 32,
          height: 32,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: theme.isDark ? theme.colors.surface : '#D4F6E9',
        }}
      >
        <Arrow size={18} color={theme.colors.community} weight="bold" />
      </span>
    </button>
  )
}
