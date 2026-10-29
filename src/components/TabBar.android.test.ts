import { createRequire } from 'node:module'
import { createElement, type ElementType } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { BottomTabBarProps } from 'expo-router/js-tabs'
import { TabBar } from './TabBar.android'

vi.mock('react-native', () => ({
  AccessibilityInfo: { isReduceMotionEnabled: async () => false, addEventListener: () => ({ remove() {} }) },
  View: 'View', Image: 'Image', Pressable: 'Pressable', Text: 'Text',
  StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1, absoluteFill: {} },
  Animated: { View: 'AnimatedView', Value: class { constructor(public value: number) {} setValue(value: number) { this.value = value } interpolate(config: unknown) { return config } }, spring: () => ({ start() {} }) }
}))
vi.mock('expo-linear-gradient', () => ({ LinearGradient: 'LinearGradient' }))
vi.mock('expo-haptics', () => ({ selectionAsync: async () => {} }))
vi.mock('../features/guide/GuideProvider', () => ({ GuideTarget: ({ children }: { children: import('react').ReactNode }) => children }))
vi.mock('../lib/direction', () => ({ useIsRTL: () => true, dirStyles: () => ({ row: { flexDirection: 'row-reverse' } }) }))
vi.mock('../lib/typography', () => ({ useAppFont: () => 'Tajawal' }))
vi.mock('../lib/theme', () => ({ radius: { pill: 999 }, shadow: { floating: {} }, space: { sm: 8 }, spring: { soft: {} }, useSanadTheme: () => ({ colors: {} }) }))
vi.mock('./motion/InteractiveScene.ios', () => ({ InteractiveScene: (props: Record<string, unknown>) => createElement(props.active ? 'WebGLScene' : 'Image', props) }))

const require = createRequire(import.meta.url)
const originalPng = require.extensions['.png']
beforeAll(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  require.extensions['.png'] = module => { module.exports = 1 }
})
afterAll(() => {
  vi.unstubAllGlobals()
  if (originalPng) require.extensions['.png'] = originalPng
  else delete require.extensions['.png']
})
const host = (name: string) => name as ElementType

describe('Android tab navigation without WebGL', () => {
  const routes = ['index', 'community', 'activity', 'account'].map(name => ({ key: name, name }))
  function props(index: number, prevented = false) {
    const emit = vi.fn(() => ({ defaultPrevented: prevented })), navigate = vi.fn()
    return { state: { index, routes }, descriptors: Object.fromEntries(routes.map(route => [route.key, { options: { title: route.name } }])), navigation: { emit, navigate }, insets: { top: 0, right: 0, bottom: 24, left: 0 } } as unknown as BottomTabBarProps
  }

  it('opens benefits and activity repeatedly with native artwork and working navigation', async () => {
    let tree!: ReactTestRenderer
    let current = props(0)
    await act(() => { tree = create(createElement(TabBar, current)) })
    for (const next of [1, 2, 0, 1, 2, 1]) {
      await act(() => tree.root.findAllByType(host('Pressable'))[next]!.props.onPress())
      expect(current.navigation.navigate).toHaveBeenCalledWith(routes[next]!.name)
      current = props(next)
      await act(() => tree.update(createElement(TabBar, current)))
      expect(tree.root.findAllByType(host('WebGLScene'))).toHaveLength(0)
      expect(tree.root.findAllByType(host('Image'))).toHaveLength(4)
      expect(tree.root.findAllByType(host('Pressable'))[next]!.props.accessibilityState.selected).toBe(true)
    }
    await act(() => tree.unmount())
  })

  it('does not navigate when the tab press is prevented', async () => {
    let tree!: ReactTestRenderer
    const current = props(0, true)
    await act(() => { tree = create(createElement(TabBar, current)) })
    await act(() => tree.root.findAllByType(host('Pressable'))[1]!.props.onPress())
    expect(current.navigation.navigate).not.toHaveBeenCalled()
    await act(() => tree.unmount())
  })
})
