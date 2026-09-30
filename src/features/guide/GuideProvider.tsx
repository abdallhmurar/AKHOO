import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren, RefObject } from 'react'
import { AccessibilityInfo, AppState, BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import type { ScrollViewProps, ViewStyle } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../providers/AuthProvider'
import { useMission } from '../../providers/MissionProvider'
import { useSanadTheme, space, radius } from '../../lib/theme'
import { useAppTypography } from '../../lib/typography'
import { dirStyles, useIsRTL } from '../../lib/direction'
import { Button } from '../../components/ui/Button'
import { guidePages, pendingGuideStep, type GuidePage, type GuideState } from './guideModel'
import { applyGuideOperation, guideRepository } from './guideRepository'
import { useGuideCopy } from './guideCopy'

type Target = { node: RefObject<View | null>; reveal?: (node: View) => void }
type GuideContextValue = {
  activate: (page: GuidePage | null) => void
  register: (id: string, target: Target) => () => void
  restart: () => Promise<void>
  blocking: boolean
}
const Context = createContext<GuideContextValue | null>(null)
const ScrollContext = createContext<((node: View) => void) | undefined>(undefined)
export const useGuide = () => useContext(Context)

export function useGuidePage(page: GuidePage, enabled = true) {
  const activate = useGuide()?.activate
  useFocusEffect(useCallback(() => {
    activate?.(enabled ? page : null)
    return () => activate?.(null)
  }, [activate, page, enabled]))
}

export function GuideTarget({ id, children, style }: PropsWithChildren<{ id: string; style?: ViewStyle }>) {
  const node = useRef<View>(null)
  const register = useGuide()?.register
  const reveal = useContext(ScrollContext)
  useEffect(() => register?.(id, { node, reveal }), [id, register, reveal])
  return <View ref={node} collapsable={false} style={style}>{children}</View>
}

// The scroll position is changed only when a guide explicitly reveals a target.
export function GuideScrollView({ children, onScroll, ...props }: ScrollViewProps) {
  const scroll = useRef<ScrollView>(null)
  const frame = useRef<View>(null)
  const offset = useRef(0)
  const reveal = useCallback((node: View) => {
    frame.current?.measureInWindow((_x, frameY, _w, frameH) => {
      node.measureInWindow((_nx, y, _nw, h) => {
        if (y < frameY + 12 || y + h > frameY + frameH * 0.6) {
          scroll.current?.scrollTo({ y: Math.max(0, offset.current + y - frameY - 16), animated: false })
        }
      })
    })
  }, [])
  return <View ref={frame} collapsable={false} style={{ flex: 1 }}><ScrollContext.Provider value={reveal}>
    <ScrollView {...props} ref={scroll} scrollEventThrottle={16} onScroll={event => { offset.current = event.nativeEvent.contentOffset.y; onScroll?.(event) }}>{children}</ScrollView>
  </ScrollContext.Provider></View>
}

type Rect = { x: number; y: number; width: number; height: number }
export function GuideProvider({ children }: PropsWithChildren) {
  const { session, loading, isRestricted } = useAuth()
  const { activeMission } = useMission()
  const userId = session?.user.id
  const queryClient = useQueryClient()
  const root = useRef<View>(null)
  const contentRef = useRef<View>(null)
  const cardRef = useRef<View>(null)
  const targets = useRef(new Map<string, Target>())
  const [revision, setRevision] = useState(0)
  const [page, activate] = useState<GuidePage | null>(null)
  const [rect, setRect] = useState<Rect | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const copy = useGuideCopy()
  const theme = useSanadTheme()
  const typography = useAppTypography()
  const isRTL = useIsRTL()
  const query = useQuery({ queryKey: ['usage-guide', userId], enabled: !!userId && !loading && !isRestricted,
    queryFn: () => guideRepository.read(userId!), staleTime: 0, refetchOnWindowFocus: true })
  const step = pendingGuideStep(query.data?.user_id === userId ? query.data : null, page)
  const active = step !== null && !!page && !activeMission && !isRestricted && !loading
  const targetId = active && page ? guidePages[page][step!] : undefined
  const textId = page === 'details' && targetId === 'request.next' ? 'details.next' : page === 'location' && targetId === 'request.next' ? 'location.submit' : targetId
  const text = textId ? copy.steps[textId as keyof typeof copy.steps] : undefined
  const register = useCallback((id: string, target: Target) => {
    targets.current.set(id, target)
    setRevision(n => n + 1)
    return () => { if (targets.current.get(id) === target) { targets.current.delete(id); setRevision(n => n + 1) } }
  }, [])

  useEffect(() => {
    if (!userId) return
    const sync = () => { void guideRepository.flush(userId).catch(() => {}) }
    sync()
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') sync() })
    const interval = setInterval(sync, 30_000)
    return () => { subscription.remove(); clearInterval(interval) }
  }, [userId])

  useEffect(() => {
    setRect(null)
    setFailed(false)
    if (!active || !targetId) return
    let disposed = false
    const target = targets.current.get(targetId)
    if (target?.node.current) target.reveal?.(target.node.current)
    const measure = () => {
      root.current?.measureInWindow((rootX, rootY) => {
        target?.node.current?.measureInWindow((x, y, w, h) => {
          if (disposed) return
          const top = Math.max(insets.top + 4, y - rootY - 4)
          const bottom = Math.min(height - insets.bottom - 4, y - rootY + h + 4)
          const left = Math.max(4, x - rootX - 4)
          if (w > 0 && bottom > top && y - rootY < height && left < width - 4) setRect({ x: left, y: top, width: Math.min(w + 8, width - left - 4), height: bottom - top })
        })
      })
    }
    const timer = setTimeout(measure, 250)
    const settle = setTimeout(measure, 700)
    return () => { disposed = true; clearTimeout(timer); clearTimeout(settle) }
  }, [active, targetId, width, height, revision, insets.top, insets.bottom])

  const save = useCallback(async (next: number, status: 'active' | 'done' | 'skipped') => {
    if (!userId || !page || busy || !query.data) return
    setBusy(true); setFailed(false)
    try {
      const op = { page, step: next, status }
      // Persist locally before closing, so offline skip/next survives relaunch.
      await guideRepository.enqueue(userId, op)
      queryClient.setQueryData<GuideState>(['usage-guide', userId], current => current ? applyGuideOperation(current, op) : current)
      void guideRepository.flush(userId).catch(() => {})
    } catch { setFailed(true) } finally { setBusy(false) }
  }, [userId, page, busy, query.data, queryClient])

  useEffect(() => {
    if (!active) return
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { void save(step!, 'skipped'); return true })
    return () => subscription.remove()
  }, [active, save, step])

  useEffect(() => {
    if (Platform.OS !== 'web' || !active) return
    const content = contentRef.current as unknown as HTMLElement | null
    const previouslyFocused = document.activeElement as HTMLElement | null
    if (content) content.inert = true
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); void save(step!, 'skipped'); return }
      if (event.key !== 'Tab') return
      const card = cardRef.current as unknown as HTMLElement | null
      const controls = Array.from(card?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]') ?? [])
      const first = controls[0], last = controls[controls.length - 1]
      if (!first || !last) return
      if (event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !controls.includes(document.activeElement as HTMLElement))) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => { if (content) content.inert = false; document.removeEventListener('keydown', onKey, true); if (previouslyFocused?.isConnected) previouslyFocused.focus() }
  }, [active, save, step])

  const restart = useCallback(async () => {
    if (!userId) return
    const data = await guideRepository.restart(userId)
    queryClient.setQueryData(['usage-guide', userId], data)
  }, [userId, queryClient])
  const context = useMemo(() => ({ activate, register, restart, blocking: active || (!!userId && query.isPending) }), [register, restart, active, userId, query.isPending])
  const titleRef = useRef<Text>(null)
  useEffect(() => {
    if (!active || !text) return
    AccessibilityInfo.announceForAccessibility(`${copy.title}. ${text[0]}. ${text[1]}`)
    if (Platform.OS === 'web') (titleRef.current as unknown as { focus?: () => void })?.focus?.()
  }, [active, text, copy.title])

  const cardHeight = 280
  const below = rect ? height - insets.bottom - rect.y - rect.height : 0
  const above = rect ? rect.y - insets.top : 0
  const cardTop = rect && below >= cardHeight + 16 ? rect.y + rect.height + 12
    : rect && above >= cardHeight + 16 ? rect.y - cardHeight - 12
      : Math.max(insets.top + 12, height - insets.bottom - cardHeight - 16)
  const scrim = 'rgba(11,31,51,0.68)'
  return <Context.Provider value={context}><View ref={root} collapsable={false} style={styles.fill}>
    <View ref={contentRef} style={styles.fill} pointerEvents={active ? 'none' : 'auto'} accessibilityElementsHidden={active} importantForAccessibility={active ? 'no-hide-descendants' : 'auto'}>{children}</View>
    {active && text && page ? <View accessibilityViewIsModal style={StyleSheet.absoluteFill} onAccessibilityEscape={() => void save(step!, 'skipped')}>
      {/* The full overlay blocks every underlying action, including the spotlight. */}
      <View style={StyleSheet.absoluteFill} onStartShouldSetResponder={() => true}>
        {rect ? <>
          <View style={{ position:'absolute', top:0, left:0, right:0, height:rect.y, backgroundColor:scrim }} />
          <View style={{ position:'absolute', top:rect.y, left:0, width:rect.x, height:rect.height, backgroundColor:scrim }} />
          <View style={{ position:'absolute', top:rect.y, left:rect.x+rect.width, right:0, height:rect.height, backgroundColor:scrim }} />
          <View style={{ position:'absolute', top:rect.y+rect.height, bottom:0, left:0, right:0, backgroundColor:scrim }} />
          <View style={{ position:'absolute', top:rect.y, left:rect.x, width:rect.width, height:rect.height, borderRadius:radius.lg, borderColor:theme.colors.primary, borderWidth:2 }} />
        </> : <View style={[StyleSheet.absoluteFill, { backgroundColor:scrim }]} />}
      </View>
      {rect && below >= cardHeight + 16 ? <View pointerEvents="none" style={{ position:'absolute', top:cardTop-7, left:Math.max(28,Math.min(width-44,rect.x+rect.width/2-7)), width:14,height:14,transform:[{rotate:'45deg'}],backgroundColor:theme.colors.surface }} /> : null}
      <View ref={cardRef} style={[styles.card, { top:cardTop, left:Math.max(16,(width-440)/2), width:Math.min(440,width-32), maxHeight:Math.min(cardHeight, height-insets.top-insets.bottom-24), backgroundColor:theme.colors.surface }]}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.cardContent}>
          <View style={[styles.row,dirStyles(isRTL).row]}><Text style={[typography.smallMedium,{color:theme.colors.primary}]}>{copy.title}</Text><Text style={[typography.caption,{color:theme.colors.textMuted}]}>{step!+1} {copy.counter} {guidePages[page].length}</Text></View>
          <Text ref={titleRef} accessibilityRole="header" {...(Platform.OS === 'web' ? { tabIndex:-1 } : {})} style={[typography.h3,{color:theme.colors.textPrimary,textAlign:isRTL?'right':'left'}]}>{text[0]}</Text>
          <Text style={[typography.body,{color:theme.colors.textSecondary,textAlign:isRTL?'right':'left'}]}>{text[1]}</Text>
          {failed ? <Text accessibilityRole="alert" style={[typography.caption,{color:theme.colors.danger}]}>{copy.error}</Text> : null}
          <View style={[styles.row,dirStyles(isRTL).row]}>
            <Button fullWidth={false} label={step === guidePages[page].length-1 ? copy.finish : copy.next} loading={busy} onPress={() => void save(step === guidePages[page].length-1 ? step : step!+1, step === guidePages[page].length-1 ? 'done' : 'active')} />
            {step! > 0 ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save(step!-1,'active')} style={styles.textButton}><Text style={[typography.smallMedium,{color:theme.colors.primary}]}>{copy.previous}</Text></Pressable> : null}
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void save(step!,'skipped')} style={styles.textButton}><Text style={[typography.smallMedium,{color:theme.colors.textSecondary}]}>{copy.skip}</Text></Pressable>
          </View>
        </ScrollView>
      </View>
    </View> : null}
  </View></Context.Provider>
}
const styles = StyleSheet.create({ fill:{flex:1}, card:{position:'absolute',borderRadius:24,overflow:'hidden'},cardContent:{padding:space.lg,gap:space.md}, row:{alignItems:'center',justifyContent:'space-between',gap:space.sm,flexWrap:'wrap'},textButton:{minHeight:44,justifyContent:'center',paddingHorizontal:4} })
