import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { CheckCircle, Info, WarningCircle, X } from 'phosphor-react-native'
import { radius, shadow, space, useSanadTheme } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'

type ToastTone = 'info' | 'success' | 'error'
type ToastItem = { id: number; message: string; tone: ToastTone }
type ToastApi = { show: (message: string, tone?: ToastTone) => void }
const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(current => [...current.slice(-2), { id, message, tone }])
  }, [])
  const api = useMemo(() => ({ show }), [show])
  return (
    <ToastContext.Provider value={api}>
      {children}
      <View pointerEvents="box-none" style={styles.host}>
        {toasts.map(item => <ToastRow key={item.id} item={item} dismiss={() => setToasts(current => current.filter(toast => toast.id !== item.id))} />)}
      </View>
    </ToastContext.Provider>
  )
}

function ToastRow({ item, dismiss }: { item: ToastItem; dismiss: () => void }) {
  const theme = useSanadTheme()
  const typography = useAppTypography()
  useEffect(() => { const timeout = setTimeout(dismiss, 4200); return () => clearTimeout(timeout) }, [dismiss])
  const color = item.tone === 'success' ? theme.colors.success : item.tone === 'error' ? theme.colors.danger : theme.colors.info
  const Icon = item.tone === 'success' ? CheckCircle : item.tone === 'error' ? WarningCircle : Info
  return (
    <View accessibilityLiveRegion="polite" style={[styles.toast, shadow.floating, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Icon size={21} color={color} weight="fill" />
      <Text style={[typography.smallMedium, { color: theme.colors.textPrimary, flex: 1 }]}>{item.message}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={dismiss} hitSlop={8}><X size={18} color={theme.colors.textMuted} /></Pressable>
    </View>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}

const styles = StyleSheet.create({
  host: { position: 'absolute', top: 52, left: space.lg, right: space.lg, gap: space.sm, zIndex: 1000 },
  toast: { minHeight: 52, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.lg, paddingVertical: space.md, flexDirection: 'row', alignItems: 'center', gap: space.md }
})
