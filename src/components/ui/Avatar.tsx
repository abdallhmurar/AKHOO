import { Image, StyleSheet, Text, View } from 'react-native'
import { useSanadTheme } from '../../lib/theme'
import { useAppFont } from '../../lib/typography'

export function Avatar({ name, uri, size = 44, tone = 'primary' }: { name: string; uri?: string | null; size?: number; tone?: 'primary' | 'community' | 'reward' }) {
  const theme = useSanadTheme()
  const fontFamily = useAppFont('bold')
  const fills = { primary: theme.colors.primarySoft, community: theme.colors.communitySoft, reward: theme.colors.rewardSoft }
  const inks = { primary: theme.colors.primary, community: theme.colors.community, reward: theme.colors.rewardPressed }
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'S'
  if (uri) return <Image accessibilityLabel={name} source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
  return <View accessibilityLabel={name} style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: fills[tone] }]}><Text style={{ color: inks[tone], fontFamily, fontSize: size * 0.34 }}>{initials}</Text></View>
}

const styles = StyleSheet.create({ base: { alignItems: 'center', justifyContent: 'center' } })
