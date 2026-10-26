import { useCallback, useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, AppState } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { useGuide } from '../../features/guide/GuideProvider'

// This card is used by iOS/web only. Refresh the existing, user-scoped queries;
// never award points or infer earned ranks from an animation.
export function useRewardMotion() {
  const queryClient = useQueryClient()
  const guide = useGuide()
  const [focused, setFocused] = useState(false)
  const [foreground, setForeground] = useState(AppState.currentState === 'active')
  const [reduced, setReduced] = useState(true)
  useFocusEffect(useCallback(() => {
    setFocused(true)
    return () => setFocused(false)
  }, []))
  useEffect(() => {
    let mounted = true
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value) }).catch(() => {})
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    const app = AppState.addEventListener('change', value => setForeground(value === 'active'))
    return () => { mounted = false; motion.remove(); app.remove() }
  }, [])
  const active = focused && foreground && !guide?.blocking
  useEffect(() => {
    if (!active) return
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['community', 'points'] })
      void queryClient.invalidateQueries({ queryKey: ['community', 'completed-count'] })
    }
    refresh()
    const interval = setInterval(refresh, 30_000)
    return () => clearInterval(interval)
  }, [active, queryClient])
  return { active, reduced }
}

// One short animation per actual value change; no perpetual counter or fake points.
export function useRewardNumber(value: number, animate: boolean, duration = 850) {
  const [display, setDisplay] = useState(value)
  const current = useRef(value)
  useEffect(() => {
    if (!animate) { current.current = value; setDisplay(value); return }
    const from = current.current
    if (from === value) return
    let frame = 0
    const start = performance.now()
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      current.current = from + (value - from) * (1 - (1 - progress) ** 3)
      setDisplay(current.current)
      if (progress < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, animate, duration])
  return animate ? display : value
}
