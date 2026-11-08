import { createElement, type ElementType } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CompletedHelpCard } from './CompletedHelpCard'

const motion = vi.hoisted(() => ({ reduced: false, listener: null as null | ((value: boolean) => void), start: vi.fn(), stop: vi.fn(), remove: vi.fn(), timing: vi.fn() }))
vi.mock('react-native', () => ({
  View: 'View', Text: 'Text', Platform: { OS: 'android' }, useWindowDimensions: () => ({ width: 390, fontScale: 1 }),
  StyleSheet: { create: (styles: unknown) => styles, absoluteFill: { position: 'absolute' } },
  Easing: { out: (fn: unknown) => fn, cubic: (value: number) => value },
  AccessibilityInfo: { isReduceMotionEnabled: async () => motion.reduced, addEventListener: (_event: string, listener: (value: boolean) => void) => { motion.listener = listener; return { remove: motion.remove } } },
  Animated: {
    View: 'AnimatedView', createAnimatedComponent: (component: unknown) => component,
    Value: class { constructor(public value: number) {} setValue(next: number) { this.value = next } interpolate(config: { outputRange: unknown[] }) { return config.outputRange[1] } },
    timing: (_value: unknown, config: unknown) => { motion.timing(config); return { start: motion.start, stop: motion.stop } },
  },
}))
vi.mock('expo-linear-gradient', () => ({ LinearGradient: 'Gradient' }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, values?: Record<string, unknown>) => `${key}${values ? `:${JSON.stringify(values)}` : ''}` }) }))
vi.mock('../lib/direction', () => ({ useIsRTL: () => true, dirStyles: () => ({ row: { flexDirection: 'row-reverse' } }) }))
vi.mock('../lib/typography', () => ({ useAppFont: () => 'Tajawal' }))
vi.mock('../lib/theme', async importOriginal => ({ ...await importOriginal<typeof import('../lib/theme')>(), useSanadTheme: () => ({ isDark: false }) }))

beforeEach(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); vi.clearAllMocks(); motion.reduced = false; motion.listener = null })
afterEach(() => vi.unstubAllGlobals())
const host = (name: string) => name as ElementType

describe('completed help counter', () => {
  it('updates the full count without a level, denominator, or progressbar semantics', async () => {
    let tree!: ReactTestRenderer
    await act(async () => { tree = create(createElement(CompletedHelpCard, { completedCount: 44 })) })
    expect(tree.root.findByType(host('Gradient')).props.accessibilityLabel).toBe('helpCounter.total:{"count":44}')
    await act(() => tree.update(createElement(CompletedHelpCard, { completedCount: 1000 })))
    const card = tree.root.findByType(host('Gradient'))
    expect(card.props.accessibilityRole).toBe('text')
    expect(card.props.accessibilityValue).toBeUndefined()
    expect(card.props.accessibilityLabel).toBe('helpCounter.total:{"count":1000}')
    expect(tree.root.findAllByType(host('Text')).some(node => node.props.children === 1000)).toBe(true)
    expect(JSON.stringify(tree.toJSON())).not.toMatch(/activityLevel|nextLevel|outOf|progressbar/)
    await act(() => tree.unmount())
    expect(motion.stop).toHaveBeenCalled()
    expect(motion.remove).toHaveBeenCalledOnce()
  })

  it('honors reduced motion even when replay is requested', async () => {
    motion.reduced = true
    let tree!: ReactTestRenderer
    await act(async () => { tree = create(createElement(CompletedHelpCard, { completedCount: 44 })) })
    await act(() => tree.update(createElement(CompletedHelpCard, { completedCount: 45, replay: 1 })))
    expect(motion.start).not.toHaveBeenCalled()
    expect(tree.root.findByType(host('Gradient')).props.accessibilityLabel).toBe('helpCounter.total:{"count":45}')
    await act(() => tree.unmount())
  })

  it('stops an active animation when the system requests reduced motion', async () => {
    let tree!: ReactTestRenderer
    await act(async () => { tree = create(createElement(CompletedHelpCard, { completedCount: 44 })) })
    expect(motion.start).toHaveBeenCalledOnce()
    await act(() => motion.listener?.(true))
    expect(motion.stop).toHaveBeenCalledOnce()
    await act(() => tree.unmount())
  })
})
