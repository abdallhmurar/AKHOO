import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../lib/theme'

export function Header({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {onBack ? (
        <Pressable style={styles.back} onPress={onBack}>
          <Text style={styles.backText}>رجوع ←</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  textWrap: { flex: 1 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', textAlign: 'right' },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 5, textAlign: 'right', lineHeight: 21 },
  back: { backgroundColor: colors.blueSoft, borderRadius: 13, paddingVertical: 9, paddingHorizontal: 12 },
  backText: { color: colors.blueDark, fontWeight: '800' }
})
