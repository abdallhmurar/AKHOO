import { forwardRef, useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type { TextInputProps, TextStyle } from 'react-native'
import { Eye, EyeSlash } from 'phosphor-react-native'
import { useIsRTL } from '../../lib/direction'
import { radius, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { useLanguageDirection } from '../../providers/LanguageDirectionProvider'

export type TextFieldProps = TextInputProps & {
  label?: string
  hint?: string
  error?: string
  required?: boolean
  secureToggle?: boolean
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField({ label, hint, error, required, secureToggle, secureTextEntry, editable = true, style, ...props }, ref) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const { language } = useLanguageDirection()
  const [focused, setFocused] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const visibilityLabel = revealed
    ? language === 'ar' ? 'إخفاء كلمة المرور' : language === 'he' ? 'הסתרת סיסמה' : 'Hide password'
    : language === 'ar' ? 'إظهار كلمة المرور' : language === 'he' ? 'הצגת סיסמה' : 'Show password'
  const direction: TextStyle = { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' }
  return (
    <View style={styles.wrap}>
      {label ? <Text style={[typography.smallMedium, direction, { color: theme.colors.textPrimary }]}>{label}{required ? ' *' : ''}</Text> : null}
      <View style={[styles.inputWrap, { backgroundColor: editable ? theme.colors.surface : theme.colors.disabledBackground, borderColor: error ? theme.colors.danger : focused ? theme.colors.focus : theme.colors.borderStrong, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TextInput
          ref={ref}
          {...props}
          editable={editable}
          secureTextEntry={secureTextEntry && !revealed}
          accessibilityLabel={props.accessibilityLabel ?? label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={theme.colors.textMuted}
          selectionColor={theme.colors.primary}
          onFocus={event => { setFocused(true); props.onFocus?.(event) }}
          onBlur={event => { setFocused(false); props.onBlur?.(event) }}
          style={[styles.input, typography.body, direction, { color: editable ? theme.colors.textPrimary : theme.colors.disabledContent }, style]}
        />
        {secureToggle ? (
          <Pressable accessibilityRole="button" accessibilityLabel={visibilityLabel} onPress={() => setRevealed(value => !value)} hitSlop={10}>
            {revealed ? <EyeSlash size={20} color={theme.colors.textSecondary} /> : <Eye size={20} color={theme.colors.textSecondary} />}
          </Pressable>
        ) : null}
      </View>
      {error || hint ? <Text style={[typography.caption, direction, { color: error ? theme.colors.danger : theme.colors.textMuted }]}>{error ?? hint}</Text> : null}
    </View>
  )
})

export function TextArea(props: TextFieldProps) {
  return <TextField multiline numberOfLines={5} textAlignVertical="top" {...props} style={[styles.area, props.style]} />
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', gap: 7 },
  inputWrap: { minHeight: 52, borderWidth: 1, borderRadius: radius.md, alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg },
  input: { flex: 1, minWidth: 0, paddingVertical: 12 },
  area: { minHeight: 112, paddingTop: 12 }
})
