import { LinearGradient } from 'expo-linear-gradient'
import type { Icon } from 'phosphor-react-native'
import { StyleSheet } from 'react-native'
import { ArtIcon } from '../motion/Motion'
import { useSanadTheme } from '../../lib/theme'

/** A shared frame keeps the approved artwork and utility glyphs visually balanced. */
export function SettingsIcon({ Icon, artwork, color, pressed }: { Icon: Icon; artwork: string | null; color: string; pressed: boolean }) {
  const theme = useSanadTheme()
  return <LinearGradient colors={[theme.colors.surfaceElevated, `${color}${pressed ? '32' : '1c'}`]} style={[styles.frame, { borderColor: `${color}28`, shadowColor: theme.colors.shadow }]}>
    {artwork ? <ArtIcon name={artwork} size={28} /> : <Icon size={27} color={color} weight="duotone" />}
  </LinearGradient>
}

const styles = StyleSheet.create({ frame: { width: 42, height: 42, flexShrink: 0, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 3 } })
