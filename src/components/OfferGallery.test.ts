import { createElement, type ElementType } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { OfferGallery } from './OfferGallery'

const { scrollTo } = vi.hoisted(() => ({ scrollTo: vi.fn() }))
vi.mock('react-native', async () => {
  const React = await import('react')
  return {
    View: 'View', Text: 'Text', Image: 'Image', Pressable: 'Pressable', Platform: { OS: 'web' },
    StyleSheet: { create: (value: unknown) => value },
    Modal: ({ visible, children }: { visible: boolean; children: import('react').ReactNode }) => visible ? React.createElement('Modal', {}, children) : null,
    ScrollView: React.forwardRef(function MockScrollView(props: Record<string, unknown>, ref) {
      React.useImperativeHandle(ref, () => ({ scrollTo }))
      return React.createElement('ScrollView', props)
    })
  }
})
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }))
vi.mock('phosphor-react-native', () => ({ CaretLeft: 'CaretLeft', CaretRight: 'CaretRight' }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, values?: Record<string, unknown>) => key.endsWith('.hint') ? `${values?.current}/${values?.total}` : key }) }))
vi.mock('../lib/direction', () => ({ useIsRTL: () => true, dirStyles: () => ({ row: { flexDirection: 'row' } }) }))
vi.mock('../lib/typography', () => ({ useAppTypography: () => ({ caption: {} }) }))
vi.mock('../lib/theme', () => ({ radius: {}, space: {}, useSanadTheme: () => ({ colors: {} }) }))
vi.mock('./ui', () => ({ Button: 'Button' }))

beforeAll(() => vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true))
afterAll(() => vi.unstubAllGlobals())

const host = (name: string) => name as ElementType

describe('gallery navigation', () => {
  async function mount() {
    let tree!: ReactTestRenderer
    await act(async () => { tree = create(createElement(OfferGallery, { images: ['one', 'two', 'three'], title: 'Gallery' })) })
    await act(async () => { tree.root.findAllByType(host('View')).find(node => node.props.onLayout)!.props.onLayout({ nativeEvent: { layout: { width: 280 } } }) })
    scrollTo.mockClear()
    return tree
  }
  const counter = (tree: ReactTestRenderer) => tree.root.findByType(host('Text')).props.children
  const button = (tree: ReactTestRenderer, label: string) => tree.root.findAllByType(host('Button')).find(node => node.props.label === `perks.gallery.${label}`)!

  it('updates the counter and boundary buttons during a swipe without snapping back', async () => {
    const tree = await mount()
    expect(button(tree, 'previous').props.disabled).toBe(true)
    await act(async () => { tree.root.findByType(host('ScrollView')).props.onScroll({ nativeEvent: { contentOffset: { x: 560 } } }) })
    expect(counter(tree)).toBe('3/3')
    expect(button(tree, 'next').props.disabled).toBe(true)
    expect(scrollTo).not.toHaveBeenCalled()
    await act(async () => { button(tree, 'previous').props.onPress() })
    expect(counter(tree)).toBe('2/3')
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 280, animated: false })
    await act(async () => tree.unmount())
  })

  it('keeps the chosen photo after resizing and resets when the gallery changes', async () => {
    const tree = await mount()
    await act(async () => { button(tree, 'next').props.onPress() })
    await act(async () => { tree.root.findAllByType(host('View')).find(node => node.props.onLayout)!.props.onLayout({ nativeEvent: { layout: { width: 360 } } }) })
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 360, animated: false })
    await act(async () => tree.update(createElement(OfferGallery, { images: ['new'], title: 'Gallery' })))
    expect(counter(tree)).toBe('1/1')
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 0, animated: false })
    expect(tree.root.findAllByType(host('Button'))).toHaveLength(0)
    await act(async () => tree.unmount())
  })
})
