import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AccessibilityInfo, AppState, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { WebView } from 'react-native-webview'
import * as Haptics from 'expo-haptics'
import { useGuide } from '../../features/guide/GuideProvider'
import { sceneHtml } from './generated/sceneHtml'
import { isLocalSceneNavigation, isSceneMessage, sceneCommand, type NativeSceneState } from './nativeSceneProtocol'

const SCENE_SOURCE = { html: sceneHtml }

type Props = {
  kind: 'gift' | 'medal' | 'rewardMedal'
  width: number
  height: number
  label: string
  hint?: string
  fallback: ReactNode
  metal?: string
  active?: boolean
  idle?: boolean
  interactive?: boolean
  interaction?: number
  onFallback?: () => void
}

export function InteractiveScene({ kind, width, height, label, hint, fallback, metal = '#ced8e2', active = true, idle = true, interactive = true, interaction = 0, onFallback }: Props) {
  const ref = useRef<View>(null)
  const viewport = useWindowDimensions()
  const guide = useGuide()
  const [focused, setFocused] = useState(false), [visible, setVisible] = useState(false)
  const [foreground, setForeground] = useState(AppState.currentState === 'active')
  const [reduced, setReduced] = useState(true), [pressed, setPressed] = useState(0), [failed, setFailed] = useState(false)
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false) }, []))
  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value) }).catch(() => {})
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    const app = AppState.addEventListener('change', value => setForeground(value === 'active'))
    return () => { mounted = false; motion.remove(); app.remove() }
  }, [])
  useEffect(() => {
    if (!focused || !foreground) return
    let mounted = true
    const measure = () => ref.current?.measureInWindow((x, y, w, h) => {
      if (mounted) setVisible(w > 0 && h > 0 && x < viewport.width && x + w > 0 && y < viewport.height && y + h > 0)
    })
    measure()
    const timer = setInterval(measure, 400)
    return () => { mounted = false; clearInterval(timer) }
  }, [focused, foreground, viewport.width, viewport.height])
  const enabled = active && focused && foreground && visible && !guide?.blocking && !failed
  const state = useMemo<NativeSceneState>(() => ({ kind, active: enabled, reduced, idle, metal, interaction: interaction + pressed }), [kind, enabled, reduced, idle, metal, interaction, pressed])
  const activate = () => {
    if (failed) { onFallback?.(); return }
    if (!enabled) return
    void Haptics.selectionAsync().catch(() => {})
    setPressed(value => value + 1)
  }
  return <View ref={ref} collapsable={false} style={{ width, height, flexShrink: 0 }} pointerEvents={interactive ? 'auto' : 'none'}>
    <Pressable style={styles.fill} disabled={!interactive} onPress={activate} accessibilityRole={interactive ? 'button' : undefined}
      accessibilityLabel={label} accessibilityHint={hint} accessible={interactive}>
      {enabled ? <SceneSurface state={state} fallback={fallback} onUnavailable={() => setFailed(true)} /> : fallback}
    </Pressable>
  </View>
}

// Unmount offscreen/background surfaces to bound WebGL memory. WebKit owns its
// native lifetime; no native object methods are called from React cleanup.
function SceneSurface({ state, fallback, onUnavailable }: { state: NativeSceneState; fallback: ReactNode; onUnavailable: () => void }) {
  const web = useRef<WebView>(null)
  const [ready, setReady] = useState(false)
  const command = sceneCommand(state)
  useEffect(() => { if (ready) web.current?.injectJavaScript(command) }, [command, ready])
  return <View style={styles.fill} pointerEvents="none" accessible={false} accessibilityElementsHidden>
    <WebView ref={web} source={SCENE_SOURCE} originWhitelist={['*']} onShouldStartLoadWithRequest={request => isLocalSceneNavigation(request.url)}
      style={styles.web} containerStyle={styles.web} scrollEnabled={false} bounces={false} javaScriptEnabled
      allowsInlineMediaPlayback={false} allowsLinkPreview={false} dataDetectorTypes="none" allowsBackForwardNavigationGestures={false}
      onLoadEnd={() => web.current?.injectJavaScript(command)} onError={onUnavailable} onContentProcessDidTerminate={onUnavailable}
      onMessage={event => { const value = event.nativeEvent.data; if (!isSceneMessage(value)) return; if (value === 'ready') setReady(true); else onUnavailable() }} />
    {!ready ? <View style={StyleSheet.absoluteFill}>{fallback}</View> : null}
  </View>
}
const styles = StyleSheet.create({ fill: { flex: 1 }, web: { flex: 1, backgroundColor: 'transparent' } })
