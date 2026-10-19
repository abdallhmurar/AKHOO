import { useEffect, useRef, useState } from 'react'
import { Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { CaretLeft, CaretRight } from 'phosphor-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useIsRTL, dirStyles } from '../lib/direction'
import { radius, space, useSanadTheme } from '../lib/theme'
import { useAppTypography } from '../lib/typography'
import { Button } from './ui'

export function OfferGallery({ images, title, aspectRatio = 1 }: { images: string[]; title: string; aspectRatio?: number }) {
  const [selected, setSelected] = useState(0)
  const [width, setWidth] = useState(0)
  const scroll = useRef<ScrollView>(null)
  const selectedRef = useRef(0)
  const [expanded, setExpanded] = useState(false)
  const { t } = useTranslation()
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const index = Math.min(selected, Math.max(images.length - 1, 0))
  const active = images[index]
  const imageSet = JSON.stringify(images)
  useEffect(() => { selectedRef.current = 0; setSelected(0); scroll.current?.scrollTo({ x: 0, animated: false }) }, [imageSet])
  useEffect(() => { scroll.current?.scrollTo({ x: selectedRef.current * width, animated: false }) }, [width])
  const select = (next: number) => {
    if (next < 0 || next >= images.length) return
    selectedRef.current = next
    scroll.current?.scrollTo({ x: next * width, animated: false })
    setSelected(next)
  }
  const Previous = isRTL ? CaretRight : CaretLeft
  const Next = isRTL ? CaretLeft : CaretRight
  const thumbnails = images.length > 1 ? (
    <View style={[styles.thumbnails, dirStyles(isRTL).row]}>
      {images.map((url, number) => <Pressable key={`${url}-${number}`} accessibilityRole="button" accessibilityLabel={t('perks.gallery.imageNumber', { number: number + 1 })} accessibilityState={{ selected: index === number }} onPress={() => select(number)} style={[styles.thumbnail, { borderColor: index === number ? theme.colors.primary : theme.colors.border, backgroundColor: theme.colors.surfaceMuted }]}>
        <Image source={{ uri: url }} style={styles.image} resizeMode="contain" accessible={false} />
      </Pressable>)}
    </View>
  ) : null

  if (!active) return null
  return <View style={styles.container}>
    <View {...(Platform.OS === 'web' ? { dir: 'ltr' } : {})} onLayout={event => setWidth(event.nativeEvent.layout.width)} style={[styles.hero, { aspectRatio, backgroundColor: theme.colors.surfaceMuted }, Platform.OS !== 'web' && { direction: 'ltr' }]}>
      {width > 0 ? <ScrollView ref={scroll} horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.pager} contentContainerStyle={styles.pages}
        scrollEventThrottle={16} onScroll={event => {
          const next = Math.max(0, Math.min(images.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)))
          selectedRef.current = next
          setSelected(next)
        }}>
        {images.map((url, number) => <Pressable key={`${url}-${number}`} disabled={index !== number} onPress={() => setExpanded(true)} accessibilityRole={index === number ? 'button' : undefined} accessibilityLabel={t('perks.gallery.enlarge', { title })} aria-hidden={index !== number} tabIndex={index === number ? 0 : -1} accessibilityElementsHidden={index !== number} importantForAccessibility={index !== number ? 'no-hide-descendants' : 'auto'} style={{ width, height: '100%' }}>
          <Image source={{ uri: url }} style={styles.image} resizeMode="contain" accessible={false} />
        </Pressable>)}
      </ScrollView> : null}
    </View>
    <View style={[styles.controls, dirStyles(isRTL).row]}>
      {images.length > 1 ? <Button label={t('perks.gallery.previous')} size="sm" variant="outline" fullWidth={false} disabled={index === 0} leading={<Previous size={16} color={index === 0 ? theme.colors.disabledContent : theme.colors.primary} />} onPress={() => select(index - 1)} style={styles.control} /> : null}
      <Text accessibilityLiveRegion="polite" style={[typography.caption, styles.counter, { color: theme.colors.textSecondary }]}>{t('perks.gallery.hint', { current: index + 1, total: images.length })}</Text>
      {images.length > 1 ? <Button label={t('perks.gallery.next')} size="sm" variant="outline" fullWidth={false} disabled={index === images.length - 1} trailing={<Next size={16} color={index === images.length - 1 ? theme.colors.disabledContent : theme.colors.primary} />} onPress={() => select(index + 1)} style={styles.control} /> : null}
    </View>
    {thumbnails}
    <Modal visible={expanded} onRequestClose={() => setExpanded(false)} onDismiss={() => scroll.current?.scrollTo({ x: index * width, animated: false })} animationType="fade">
      <SafeAreaView style={[styles.expanded, Platform.OS === 'ios' && { direction: 'ltr' }, { backgroundColor: theme.colors.surface }]}>
        <Button label={t('perks.gallery.close')} variant="outline" onPress={() => setExpanded(false)} />
        <Image source={{ uri: active }} style={styles.expandedImage} resizeMode="contain" accessibilityLabel={title} />
        {thumbnails}
      </SafeAreaView>
    </Modal>
  </View>
}

const styles = StyleSheet.create({
  container: { gap: space.sm },
  hero: { width: '100%', borderRadius: 22, overflow: 'hidden' },
  pager: { flex: 1 }, pages: { flexDirection: 'row' },
  controls: { alignItems: 'center', gap: 6 }, control: { paddingHorizontal: 10 }, counter: { flex: 1, textAlign: 'center' },
  image: { width: '100%', height: '100%' },
  thumbnails: { flexWrap: 'wrap', justifyContent: 'center', gap: space.sm },
  thumbnail: { width: 52, height: 52, padding: 2, borderWidth: 2, borderRadius: radius.sm, overflow: 'hidden' },
  expanded: { flex: 1, padding: space.md, gap: space.md },
  expandedImage: { flex: 1, width: '100%', minHeight: 0 }
})
