import { useRef, useState } from 'react'
import { Keyboard, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { MotionScene } from '../../components/motion/Motion.ios'
import { useAppTypography, normalizeTypographyLanguage } from '../../lib/typography'
import { useIsRTL, dirStyles } from '../../lib/direction'
import { useSanadTheme } from '../../lib/theme'
import { partnerBetaCopy } from './partnerBetaCopy'
import { emptyPartnerDraft, normalizePartnerPhone, partnerDraftErrors, type PartnerDraft } from './partnerBetaModel'
import { submitPartnerApplication } from './partnerApplication'

// The request is sent through `submitPartnerApplication`; nothing is stored on the phone.
export function PartnerEnrollment({ onClose }: { onClose: () => void }) {
  const { i18n } = useTranslation()
  const language = normalizeTypographyLanguage(i18n.language)
  const copy = partnerBetaCopy[language]
  const type = useAppTypography(), theme = useSanadTheme(), rtl = useIsRTL()
  const inset = useSafeAreaInsets()
  const [draft, setDraft] = useState<PartnerDraft>({ ...emptyPartnerDraft })
  const [stage, setStage] = useState<'details' | 'review' | 'done'>('details')
  const [faq, setFaq] = useState<number | null>(0)
  const [attempted, setAttempted] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<'rate_limited' | 'failed' | null>(null)
  const scroll = useRef<ScrollView>(null)
  const inputRefs = useRef<Partial<Record<keyof PartnerDraft, TextInput | null>>>({})
  const errors = attempted ? partnerDraftErrors(draft) : []
  const align = { textAlign: rtl ? 'right' as const : 'left' as const }
  const ink = { color: theme.colors.textPrimary }
  const secondary = { color: theme.colors.textSecondary }
  const panel = { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
  const next = () => {
    setAttempted(true)
    const invalid = partnerDraftErrors(draft)
    if (invalid.length) { const first = invalid[0]; if (first) inputRefs.current[first]?.focus(); return }
    Keyboard.dismiss()
    setStage('review')
    scroll.current?.scrollTo({ y: 0, animated: false })
  }
  const back = () => {
    if (stage === 'details' || stage === 'done') onClose()
    else { setStage('details'); setSendError(null); scroll.current?.scrollTo({ y: 0, animated: false }) }
  }
  const submit = async () => {
    if (sending) return
    setSending(true)
    setSendError(null)
    const result = await submitPartnerApplication(draft, language, 'ios')
    setSending(false)
    if (result === 'sent') { setStage('done'); scroll.current?.scrollTo({ y: 0, animated: false }) }
    else setSendError(result === 'rate_limited' ? 'rate_limited' : 'failed')
  }
  const set = (key: keyof PartnerDraft, value: string | number) => setDraft(current => ({ ...current, [key]: value }))
  const fields = ['business', 'city', 'phone', 'offer'] as const

  return <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={back}>
    <KeyboardAvoidingView behavior="padding" style={[styles.root, { backgroundColor: theme.colors.background, paddingTop: inset.top }]}>
      <View style={[styles.header, dirStyles(rtl).row, { borderColor: theme.colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.back} onPress={back} style={[styles.back, panel]}><Text style={[type.h2, ink]}>{rtl ? '→' : '←'}</Text></Pressable>
        <Text accessibilityRole="header" style={[type.h3, ink, align, styles.flex]}>{copy.brand}</Text>
      </View>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.body, { paddingBottom: inset.bottom + 24 }]}>
        {stage === 'details' ? <>
          <View style={styles.heroArt}><MotionScene name="partner-home" style={{ aspectRatio: 1648 / 544, borderRadius: 20 }} /></View>
          <View style={styles.copy}>
            <Text style={[type.smallMedium, align, { color: theme.colors.community }]}>{copy.intro}</Text>
            <Text accessibilityRole="header" style={[type.h1, ink, align]}>{copy.heading}</Text>
            <Text style={[type.body, secondary, align]}>{copy.description}</Text>
          </View>
          <View style={[styles.panel, panel]}>
            <Text style={[type.caption, align, { color: theme.colors.community }]}>{copy.faqLabel}</Text>
            <Text accessibilityRole="header" style={[type.h3, ink, align]}>{copy.faqTitle}</Text>
            {copy.faq.map((item, index) => <View key={item.q} style={[styles.question, { borderColor: theme.colors.border }]}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: faq === index }} onPress={() => setFaq(faq === index ? null : index)} style={[styles.questionButton, dirStyles(rtl).row]}>
                <Text style={[type.bodyMedium, ink, align, styles.flex]}>{item.q}</Text><Text style={[type.h3, secondary]}>{faq === index ? '−' : '+'}</Text>
              </Pressable>
              {faq === index ? <Text style={[type.body, secondary, align, styles.answer]}>{item.a}</Text> : null}
            </View>)}
          </View>
          <View style={[styles.steps, dirStyles(rtl).row]}><Text style={[type.smallMedium, { color: theme.colors.primary }]}>1 · {copy.details}</Text><Text style={[type.small, secondary]}>2 · {copy.review}</Text></View>
          <View style={[styles.panel, panel]}>
            {fields.map(field => <View key={field} style={styles.field}>
              <Text style={[type.smallMedium, ink, align]}>{copy[field]}</Text>
              <TextInput ref={ref => { inputRefs.current[field] = ref }} accessibilityLabel={copy[field]} value={draft[field]} onChangeText={value => set(field, value)}
                maxLength={field === 'business' ? 80 : field === 'city' ? 60 : field === 'phone' ? 24 : 280}
                keyboardType={field === 'phone' ? 'phone-pad' : 'default'} autoComplete={field === 'phone' ? 'tel' : 'off'}
                multiline={field === 'offer'} style={[styles.input, type.body, ink, align, { borderColor: field !== 'offer' && errors.includes(field) ? '#c33e3e' : theme.colors.border }, field === 'phone' && styles.phone, field === 'offer' && styles.offer]} />
              {field !== 'offer' && errors.includes(field) ? <Text accessibilityRole="alert" style={[type.caption, align, styles.error]}>{copy.errors[field]}</Text> : null}
              {field === 'offer' ? <Text style={[type.caption, secondary, align]}>{draft.offer.length}/280</Text> : null}
            </View>)}
            <Text style={[type.smallMedium, ink, align]}>{copy.category}</Text>
            <View style={[styles.categories, dirStyles(rtl).row]}>
              {copy.categories.map((label, index) => <Pressable key={label} accessibilityRole="radio" accessibilityState={{ checked: draft.category === index }} onPress={() => set('category', index)} style={[styles.chip, { borderColor: draft.category === index ? '#1671ee' : theme.colors.border, backgroundColor: draft.category === index ? '#e7f2ff' : theme.colors.surface }]}>
                <Text style={[type.small, { color: draft.category === index ? '#064fae' : theme.colors.textPrimary }]}>{label}</Text>
              </Pressable>)}
            </View>
            {errors.includes('category') ? <Text accessibilityRole="alert" style={[type.caption, align, styles.error]}>{copy.errors.category}</Text> : null}
            <Text style={[type.small, secondary, align]}>{copy.notice}</Text>
            <Pressable accessibilityRole="button" onPress={next} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={[type.button, styles.white]}>{copy.next}</Text></Pressable>
          </View>
        </> : stage === 'review' ? <>
          <Text accessibilityRole="header" style={[type.h1, ink, align]}>{copy.review}</Text>
          <View style={[styles.panel, panel]}>
            {(['business', 'category', 'city', 'phone', 'offer'] as const).map(field => <View key={field} style={[styles.reviewRow, { borderColor: theme.colors.border }]}>
              <Text style={[type.caption, secondary, align]}>{copy[field]}</Text>
              <Text style={[type.bodyMedium, ink, align, field === 'phone' && styles.phone]}>{field === 'category' ? copy.categories[draft.category] : field === 'phone' ? normalizePartnerPhone(draft.phone) : draft[field].trim() || '—'}</Text>
            </View>)}
          </View>
          <Text style={[type.body, secondary, align]}>{copy.notice}</Text>
          {sendError ? <Text accessibilityRole="alert" style={[type.caption, align, styles.error]}>{sendError === 'rate_limited' ? copy.sendLimited : copy.sendFailed}</Text> : null}
          <Pressable accessibilityRole="button" disabled={sending} accessibilityState={{ busy: sending, disabled: sending }} onPress={submit} style={({ pressed }) => [styles.primary, (pressed || sending) && styles.pressed]}><Text style={[type.button, styles.white]}>{sending ? copy.sending : copy.send}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={back} style={[styles.secondary, panel]}><Text style={[type.button, ink]}>{copy.edit}</Text></Pressable>
        </> : <View style={[styles.panel, panel]}>
          <Text style={styles.check} accessibilityElementsHidden>✓</Text>
          <Text accessibilityRole="header" style={[type.h1, ink, align]}>{copy.done}</Text>
          <Text style={[type.body, secondary, align]}>{copy.doneText}</Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.primary}><Text style={[type.button, styles.white]}>{copy.close}</Text></Pressable>
        </View>}
      </ScrollView>
    </KeyboardAvoidingView>
  </Modal>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, flex: { flex: 1 }, header: { paddingHorizontal: 16, paddingVertical: 8, gap: 12, alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  back: { minWidth: 44, minHeight: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, gap: 20, maxWidth: 560, width: '100%', alignSelf: 'center' }, heroArt: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#0759ad' },
  copy: { gap: 7 }, panel: { borderRadius: 22, borderWidth: 1, padding: 18, gap: 12 },
  question: { borderTopWidth: StyleSheet.hairlineWidth }, questionButton: { minHeight: 48, paddingVertical: 8, gap: 12, alignItems: 'center' }, answer: { paddingBottom: 12 },
  steps: { justifyContent: 'space-evenly', flexWrap: 'wrap', gap: 12 }, field: { gap: 6 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 48, paddingHorizontal: 12, paddingVertical: 10 }, phone: { textAlign: 'left', writingDirection: 'ltr' }, offer: { minHeight: 100, textAlignVertical: 'top' },
  categories: { flexWrap: 'wrap', gap: 8 }, chip: { borderWidth: 1, borderRadius: 12, minHeight: 44, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' },
  primary: { backgroundColor: '#146cf0', minHeight: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', padding: 12 },
  secondary: { minHeight: 50, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center', padding: 12 },
  white: { color: '#fff', textAlign: 'center' }, pressed: { opacity: .8 }, error: { color: '#c33e3e' },
  reviewRow: { borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 12, gap: 5 }, check: { color: '#087c69', fontSize: 40, textAlign: 'center' },
})
