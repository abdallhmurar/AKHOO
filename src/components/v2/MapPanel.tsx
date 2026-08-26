import { useState } from 'react'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Crosshair, MapPin, ShieldCheck } from 'phosphor-react-native'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useIsRTL } from '../../lib/direction'
import { useLanguageDirection } from '../../providers/LanguageDirectionProvider'
import { SanadMap } from '../SanadMap'
import type { SanadMapMarker } from '../SanadMap.types'
import { IconButton, StatusBadge } from '../ui'

export function MapPanel({ latitude = 31.7784, longitude = 35.2066, markers = [], selectedId, onMarkerPress, height = 310, overlay, interactive = true }: { latitude?: number; longitude?: number; markers?: SanadMapMarker[]; selectedId?: string | null; onMarkerPress?: (id: string) => void; height?: number; overlay?: ReactNode; interactive?: boolean }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { language } = useLanguageDirection()
  const [mapKey, setMapKey] = useState(0)
  const tr = (ar: string, he: string, en: string) => language === 'en' ? en : language === 'he' ? he : ar
  return (
    <View style={[styles.wrap, shadow.soft, { height, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceMuted }]}>
      <SanadMap key={mapKey} latitude={latitude} longitude={longitude} zoom={13} interactive={interactive} markers={markers} selectedId={selectedId} onMarkerPress={onMarkerPress} style={styles.map} />
      <View style={[styles.top, isRTL ? styles.topRTL : styles.topLTR]}><StatusBadge label={tr('منطقة خدمة القدس', 'אזור השירות בירושלים', 'Jerusalem service area')} tone="success" dot /></View>
      <View style={[styles.controls, isRTL ? styles.controlsRTL : styles.controlsLTR]}><IconButton label={tr('إعادة توسيط الخريطة', 'מרכוז המפה מחדש', 'Recenter map')} icon={<Crosshair size={20} color={theme.colors.primary} />} onPress={() => setMapKey(value => value + 1)} /></View>
      {overlay ? <View style={[styles.overlay, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>{overlay}</View> : (
        <View style={[styles.overlay, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.overlayIcon, { backgroundColor: theme.colors.primarySoft }]}><MapPin size={18} color={theme.colors.primary} weight="fill" /></View>
          <View style={styles.overlayCopy}><Text style={[typography.smallMedium, { color: theme.colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{tr('موقعك التقريبي', 'המיקום המשוער שלך', 'Your approximate location')}</Text><Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{tr('يُشارك فقط أثناء طلب نشط', 'משותף רק במהלך בקשה פעילה', 'Shared only during an active request')}</Text></View>
          <ShieldCheck size={20} color={theme.colors.community} weight="duotone" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.xl, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  map: { flex: 1, marginTop: 0, borderRadius: 0, borderWidth: 0 },
  top: { position: 'absolute', top: space.md },
  topLTR: { left: space.md },
  topRTL: { right: space.md },
  controls: { position: 'absolute', top: space.md },
  controlsLTR: { right: space.md },
  controlsRTL: { left: space.md },
  overlay: { position: 'absolute', left: space.md, right: space.md, bottom: space.md, minHeight: 66, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md },
  overlayIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  overlayCopy: { flex: 1, gap: 1 }
})
