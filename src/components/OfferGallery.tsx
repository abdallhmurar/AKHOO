import { useState } from 'react'
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useIsRTL, dirStyles } from '../lib/direction'
import { radius, space, useSanadTheme } from '../lib/theme'
import { useAppTypography } from '../lib/typography'
import { Button } from './ui'

export function OfferGallery({ images, title }: { images: string[]; title: string }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const { t } = useTranslation()
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const active = selected && images.includes(selected) ? selected : images[0]
  const thumbnails = images.length > 1 ? (
    <View style={[styles.thumbnails, dirStyles(isRTL).row]}>
      {images.map((url, index) => <Pressable key={`${url}-${index}`} accessibilityRole="button" accessibilityLabel={t('perks.gallery.imageNumber', { number: index + 1 })} accessibilityState={{ selected: active === url }} onPress={() => setSelected(url)} style={[styles.thumbnail, { borderColor: active === url ? theme.colors.primary : theme.colors.border }]}>
        <Image source={{ uri: url }} style={styles.image} resizeMode="contain" accessible={false} />
      </Pressable>)}
    </View>
  ) : null

  if (!active) return null
  return <View style={styles.container}>
    <Pressable onPress={() => setExpanded(true)} accessibilityRole="button" accessibilityLabel={t('perks.gallery.enlarge', { title })} style={styles.hero}>
      <Image source={{ uri: active }} style={styles.image} resizeMode="contain" accessible={false} />
    </Pressable>
    <Text style={[typography.caption, { color: theme.colors.textSecondary, textAlign: 'center' }]}>{t('perks.gallery.hint', { current: images.indexOf(active) + 1, total: images.length })}</Text>
    {thumbnails}
    <Modal visible={expanded} onRequestClose={() => setExpanded(false)} animationType="fade">
      <SafeAreaView style={[styles.expanded, { backgroundColor: theme.colors.surface }]}>
        <Button label={t('perks.gallery.close')} variant="outline" onPress={() => setExpanded(false)} />
        <Image source={{ uri: active }} style={styles.expandedImage} resizeMode="contain" accessibilityLabel={title} />
        {thumbnails}
      </SafeAreaView>
    </Modal>
  </View>
}

const styles = StyleSheet.create({
  container: { gap: space.sm },
  hero: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: '#fff' },
  image: { width: '100%', height: '100%' },
  thumbnails: { flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  thumbnail: { width: 52, height: 52, padding: 2, borderWidth: 2, borderRadius: radius.sm, backgroundColor: '#fff', overflow: 'hidden' },
  expanded: { flex: 1, padding: space.md, gap: space.md },
  expandedImage: { flex: 1, width: '100%', minHeight: 0 }
})
