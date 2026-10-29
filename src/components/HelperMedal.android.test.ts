import { createElement, type ElementType } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { HelperMedal } from './HelperMedal.android'
import { ACTIVITY_LEVEL_COLORS, type ActivityLevel } from '../lib/activityLevel'

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }))
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Defs: 'Defs', LinearGradient: 'LinearGradient', Path: 'Path', Stop: 'Stop' }))
vi.mock('../providers/ThemeModeProvider', () => ({ useThemeMode: () => ({ isDark: false }) }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'ar' } }) }))
// Mark the browser/GPU boundary without running a WebView in the Node test.
vi.mock('./motion/InteractiveScene.ios', () => ({ InteractiveScene: (props: Record<string, unknown>) => createElement('WebGLScene', props) }))

beforeAll(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true))
afterAll(() => vi.unstubAllGlobals())
const host = (name: string) => name as ElementType

describe('Android benefits/activity medal stability', () => {
  it.each<ActivityLevel>(['none', 'bronze', 'silver', 'gold', 'green'])('renders %s on both screens without creating a browser/GPU surface', async level => {
    let tree!: ReactTestRenderer
    await act(() => { tree = create(createElement('Screens', {}, createElement(HelperMedal, { level, size: 96 }), createElement(HelperMedal, { level, size: 90 }))) })
    expect(tree.root.findAllByType(host('WebGLScene'))).toHaveLength(0)
    expect(tree.root.findAllByType(host('Svg')).map(node => [node.props.width, node.props.height])).toEqual([[96, 120], [90, 112.5]])
    const gradients = tree.root.findAllByType(host('LinearGradient'))
    expect(new Set(gradients.map(node => node.props.id)).size).toBe(2)
    if (level !== 'none') expect(tree.root.findAllByType(host('Stop')).filter(node => node.props.offset !== '0').every(node => node.props.stopColor === ACTIVITY_LEVEL_COLORS[level])).toBe(true)
    await act(() => tree.unmount())
  })

  it('keeps the earned medal visible across data refreshes and repeated tab mounts', async () => {
    for (let visit = 0; visit < 3; visit++) {
      let tree!: ReactTestRenderer
      await act(() => { tree = create(createElement(HelperMedal, { level: 'none', size: 90 })) })
      for (const level of ['bronze', 'gold', 'green'] as const) {
        await act(() => tree.update(createElement(HelperMedal, { level, size: 90 })))
        expect(tree.root.findAllByType(host('WebGLScene'))).toHaveLength(0)
        expect(tree.root.findAllByType(host('Svg'))).toHaveLength(1)
      }
      await act(() => tree.unmount())
    }
  })
})
