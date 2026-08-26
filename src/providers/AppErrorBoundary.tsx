import { Component } from 'react'
import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { WarningCircle } from 'phosphor-react-native'
import { Button } from '../components/ui'
import { civicColors, palette, radius, space } from '../lib/theme'
import { i18next } from '../lib/i18n'
import { getFontFamily } from '../lib/typography'

type State = { error: Error | null }

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) console.error('[SANAD boundary]', error.message, info.componentStack)
  }
  render(): ReactNode {
    if (!this.state.error) return this.props.children
    const language = i18next.language?.startsWith('en') ? 'en' : i18next.language?.startsWith('he') ? 'he' : 'ar'
    const tr = (ar: string, he: string, en: string) => language === 'en' ? en : language === 'he' ? he : ar
    const align = language === 'en' ? 'left' as const : 'right' as const
    return <View style={styles.wrap}><View style={styles.icon}><WarningCircle size={40} color={civicColors.emergencyCoral} weight="duotone" /></View><Text style={[styles.title, { fontFamily: getFontFamily(language, 'bold'), textAlign: align }]}>{tr('تعذر على سَنَد فتح هذه الشاشة', 'סַנַד לא הצליח לפתוח את המסך', 'SANAD could not open this screen')}</Text><Text style={[styles.body, { fontFamily: getFontFamily(language), textAlign: align }]}>{tr('بياناتك آمنة. حاول فتح الشاشة مجدداً.', 'המידע שלך בטוח. נסו לפתוח את המסך שוב.', 'Your data is safe. Try opening the screen again.')}</Text><Button label={tr('المحاولة مجدداً', 'ניסיון חוזר', 'Try again')} onPress={() => this.setState({ error: null })} /></View>
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: space.xxl, gap: space.lg, backgroundColor: civicColors.fog },
  icon: { width: 76, height: 76, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.coralSoft },
  title: { color: civicColors.navy, fontSize: 24, lineHeight: 31 },
  body: { color: palette.slate600, fontSize: 15, lineHeight: 23 }
})
