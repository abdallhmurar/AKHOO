import { useEffect, useState } from 'react'
import { Pressable, Text, type StyleProp, type TextStyle } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useIsRTL } from '../lib/direction'
import { useSanadTheme } from '../lib/theme'
import { useAppTypography } from '../lib/typography'
import { translateUserText, type UserTextTranslation } from '../services/userTextTranslation'

type State = { phase: 'idle' } | { phase: 'loading' } | { phase: 'done'; result: UserTextTranslation; showOriginal: boolean }

// Text written by another user, with an on-demand "Translate" action under it.
// The text only leaves the device when the reader taps the action.
export function TranslatableText({ text, style, translatable = true }: { text: string; style: StyleProp<TextStyle>; translatable?: boolean }) {
  const { t, i18n } = useTranslation()
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const [state, setState] = useState<State>({ phase: 'idle' })
  useEffect(() => { setState({ phase: 'idle' }) }, [text, i18n.language])

  const canTranslate = translatable && text.trim().length >= 2 && /\p{L}/u.test(text)
  const translated = state.phase === 'done' && state.result.status === 'translated' && !state.showOriginal ? state.result.text : null

  async function run() {
    setState({ phase: 'loading' })
    const result = await translateUserText(text, i18n.language)
    setState({ phase: 'done', result, showOriginal: false })
  }

  let label: string | null = null
  let onPress: (() => void) | undefined
  if (canTranslate) {
    if (state.phase === 'idle') { label = t('userTranslate.action'); onPress = run }
    else if (state.phase === 'loading') label = t('userTranslate.loading')
    else if (state.result.status === 'translated') {
      label = t(state.showOriginal ? 'userTranslate.showTranslation' : 'userTranslate.showOriginal')
      onPress = () => setState({ ...state, showOriginal: !state.showOriginal })
    } else if (state.result.status === 'same') label = t('userTranslate.same')
    else { label = t(state.result.status === 'limited' ? 'userTranslate.limited' : 'userTranslate.failed'); onPress = state.result.status === 'limited' ? undefined : run }
  }

  return (
    <>
      <Text style={style}>{translated ?? text}</Text>
      {label ? (
        <Pressable accessibilityRole={onPress ? 'button' : 'text'} disabled={!onPress} onPress={onPress} hitSlop={8}>
          <Text style={[typography.caption, { color: onPress ? theme.colors.primary : theme.colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
        </Pressable>
      ) : null}
    </>
  )
}
