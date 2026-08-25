import type { ComponentType } from 'react'
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Clock, MapPin } from 'phosphor-react-native'
import type { IconProps } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { colors, font, radius, space, type } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import { formatElapsed } from '../lib/time'
import { PrimaryButton } from './PrimaryButton'
import { StatusPill } from './StatusPill'

// Nearby-request accept sheet, extracted out of VolunteerScreen.tsx.
// Anatomy inspired by 21st.dev's job/opportunity card family (Job Listing,
// JobCard, Opportunity Card - previews inspected via `search`; the actual
// source hit 21st's daily get_component retrieval limit after 2 successful
// fetches elsewhere this round, so this one is composition-only, not a
// direct code port: icon block, headline, and a real multi-chip tag row
// (distance + time-posted) instead of one lone distance chip) plus a live
// "new nearby" status eyebrow (Card Status List's status-indicator idea,
// same StatusPill component the rest of SANAD already uses).
export function SanadRequestSheet({
  Icon,
  serviceLabel,
  createdAt,
  now,
  distanceKm,
  note,
  photoUrl,
  latitude,
  longitude,
  onAccept,
  loading
}: {
  Icon: ComponentType<IconProps>
  serviceLabel: string
  createdAt: string
  now: number
  distanceKm: number
  note: string | null
  photoUrl: string | null
  latitude: number
  longitude: number
  onAccept: () => void
  loading: boolean
}) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())

  return (
    <>
      <StatusPill label={t('volunteer.sheet.newNearby')} tone="success" pulse />

      <View style={[styles.top, dir.row]}>
        <View style={styles.iconWrap}>
          <Icon size={26} color={colors.forest} weight="duotone" />
        </View>
        <Text style={[styles.title, dir.textStart]}>{serviceLabel}</Text>
      </View>

      <View style={[styles.tagsRow, dir.row]}>
        <View style={[styles.tag, dir.row]}>
          <MapPin size={12} color={colors.forest} weight="fill" />
          <Text style={styles.tagText}>{t('volunteer.distanceKm', { distance: distanceKm.toFixed(1) })}</Text>
        </View>
        <View style={[styles.tag, dir.row]}>
          <Clock size={12} color={colors.forest} weight="fill" />
          <Text style={styles.tagText}>{formatElapsed(now - new Date(createdAt).getTime(), t)}</Text>
        </View>
      </View>

      {note ? <Text style={[styles.note, dir.textStart]}>{note}</Text> : null}
      {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.photo} /> : null}

      <View style={[styles.actions, dir.row]}>
        <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)} style={[styles.mapButton, dir.row]}>
          <MapPin size={16} color={colors.forest} />
          <Text style={styles.mapText}>{t('volunteer.openExternal')}</Text>
        </Pressable>
        <PrimaryButton title={t('volunteer.accept')} onPress={onAccept} loading={loading} style={styles.acceptButton} />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  top: { alignItems: 'center', gap: space.md, marginTop: space.md },
  iconWrap: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.sageSoft, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.h3, color: colors.text, flex: 1 },

  tagsRow: { gap: space.sm, marginTop: space.md, flexWrap: 'wrap' },
  tag: { alignItems: 'center', gap: 5, backgroundColor: colors.sageSoft, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: space.md },
  tagText: { color: colors.forest, fontFamily: font.bold, fontSize: 12.5 },

  note: { color: colors.text, fontFamily: font.regular, fontSize: 14, lineHeight: 21, marginTop: space.md },
  photo: { width: '100%', height: 150, borderRadius: radius.md, marginTop: space.md },
  actions: { gap: space.sm, marginTop: space.lg },
  acceptButton: { flex: 1.6 },
  mapButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.sageSoft, borderRadius: radius.sm, minHeight: 54 },
  mapText: { color: colors.forest, fontFamily: font.bold, fontSize: 13 }
})
