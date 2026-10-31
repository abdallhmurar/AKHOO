import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View, type ImageProps } from 'react-native'
import { useTranslation } from 'react-i18next'
import { requestPhotoCopy } from '../../shared/requestPhotos'
import { useRequestPhoto } from '../../shared/useRequestPhoto'
import { useAuth } from '../providers/AuthProvider'
import { supabase } from '../lib/supabase'
import { useSanadTheme } from '../lib/theme'
import { useAppTypography } from '../lib/typography'

type Props = { reference: string; style?: ImageProps['style']; resizeMode?: ImageProps['resizeMode'] }

export function RequestPhoto({ reference, style, resizeMode = 'cover' }: Props) {
  const { session, status } = useAuth()
  const { i18n } = useTranslation()
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const copy = requestPhotoCopy(i18n.resolvedLanguage ?? i18n.language)
  const photo = useRequestPhoto(supabase, process.env.EXPO_PUBLIC_SUPABASE_URL ?? '', reference, status === 'signed-in' ? session?.user.id ?? null : null)
  if (status !== 'signed-in') return null
  if (photo.url) return <Image key={photo.url} source={{ uri: photo.url }} style={style} resizeMode={resizeMode} accessibilityLabel={copy.label} onError={photo.onImageError} />
  return (
    <View style={[style, styles.placeholder, { backgroundColor: theme.colors.surface }]}>
      {photo.loading ? <ActivityIndicator accessibilityLabel={copy.loading} color={theme.colors.primary} /> : <>
        <Text style={[typography.caption, { color: theme.colors.textMuted, textAlign: 'center' }]}>{copy.unavailable}</Text>
        <Pressable accessibilityRole="button" onPress={photo.retry} style={styles.retry}>
          <Text style={[typography.caption, { color: theme.colors.primary }]}>{copy.retry}</Text>
        </Pressable>
      </>}
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: { justifyContent: 'center', alignItems: 'center', minHeight: 96, padding: 12 },
  retry: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: 12 }
})
