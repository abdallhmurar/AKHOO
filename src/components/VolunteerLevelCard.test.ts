import { createElement, type ElementType } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VolunteerLevelCard } from './VolunteerLevelCard'

const motion = vi.hoisted(() => ({ reduced: false, listener: null as null | ((value: boolean) => void), start: vi.fn(), stop: vi.fn(), remove: vi.fn(), timing: vi.fn() }))
vi.mock('react-native', () => ({
  View: 'View', Text: 'Text', useWindowDimensions: () => ({ width: 390, fontScale: 1 }),
  StyleSheet: { create: (styles: unknown) => styles, absoluteFill: { position: 'absolute' } },
  Easing: { out: (fn: unknown) => fn, cubic: (value: number) => value },
  AccessibilityInfo: { isReduceMotionEnabled: async () => motion.reduced, addEventListener: (_event: string, listener: (value: boolean) => void) => { motion.listener = listener; return { remove: motion.remove } } },
  Animated: {
    View: 'AnimatedView', createAnimatedComponent: (component: unknown) => component,
    Value: class { constructor(public value: number) {} setValue(next: number) { this.value = next } interpolate(config: { outputRange: unknown[] }) { return config.outputRange[1] } },
    timing: (_value: unknown, config: unknown) => { motion.timing(config); return { start: motion.start, stop: motion.stop } },
  },
}))
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Defs: 'Defs', LinearGradient: 'SvgGradient', Stop: 'Stop' }))
vi.mock('expo-linear-gradient', () => ({ LinearGradient: 'Gradient' }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, values?: Record<string, unknown>) => `${key}${values ? `:${JSON.stringify(values)}` : ''}` }) }))
vi.mock('../lib/direction', () => ({ useIsRTL: () => true, dirStyles: () => ({ row: { flexDirection: 'row-reverse' } }) }))
vi.mock('../lib/typography', () => ({ useAppFont: () => 'Tajawal' }))
vi.mock('../lib/theme', () => ({ useSanadTheme: () => ({ isDark: false }) }))

beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.clearAllMocks(); motion.reduced = false; motion.listener = null })
afterEach(() => vi.unstubAllGlobals())
const host = (name: string) => name as ElementType

describe('live level card', () => {
  it('updates the real count and target, including completed top level, without a stale denominator', async () => {
    let tree!: ReactTestRenderer
    await act(async () => { tree = create(createElement(VolunteerLevelCard, { completedCount: 42 })) })
    expect(tree.root.findByType(host('Gradient')).props.accessibilityValue).toMatchObject({ max: 60, now: 42 })
    expect(motion.timing).toHaveBeenLastCalledWith(expect.objectContaining({ toValue: 0.7, useNativeDriver: false, isInteraction: false }))
    await act(() => tree.update(createElement(VolunteerLevelCard, { completedCount: 75 })))
    expect(tree.root.findByType(host('Gradient')).props.accessibilityLabel).toBe('activityLevel.green')
    expect(tree.root.findAllByType(host('Text')).some(node => node.props.children === 75)).toBe(true)
    expect(tree.root.findAllByType(host('Text')).some(node => String(node.props.children).startsWith('levelCard.outOf'))).toBe(false)
    expect(motion.timing).toHaveBeenLastCalledWith(expect.objectContaining({ toValue: 1 }))
    await act(() => tree.unmount())
    expect(motion.stop).toHaveBeenCalled()
    expect(motion.remove).toHaveBeenCalledOnce()
  })

  it('honors reduced motion even when replay is requested', async () => {
    motion.reduced = true
    let tree!: ReactTestRenderer
    await act(async () => { tree = create(createElement(VolunteerLevelCard, { completedCount: 42 })) })
    await act(() => tree.update(createElement(VolunteerLevelCard, { completedCount: 43, replay: 1 })))
    expect(motion.start).not.toHaveBeenCalled()
    expect(tree.root.findByType(host('Gradient')).props.accessibilityValue.now).toBe(43)
    await act(() => tree.unmount())
  })

  it('stops an active animation when the system requests reduced motion', async () => {
    let tree!: ReactTestRenderer
    await act(async () => { tree = create(createElement(VolunteerLevelCard, { completedCount: 42 })) })
    expect(motion.start).toHaveBeenCalledOnce()
    await act(() => motion.listener?.(true))
    expect(motion.stop).toHaveBeenCalledOnce()
    await act(() => tree.unmount())
  })
})
