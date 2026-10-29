import { createRequire } from 'node:module'
import { createElement, type ElementType, type ReactNode } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { BenefitsView } from './BenefitsScreen'
import { ActivityView } from './ActivityScreen'
import type { PartnerOffer } from '../../types'

vi.mock('react-native', () => ({ View: 'View', Image: 'Image', Pressable: 'Pressable', Text: 'Text', StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1, absoluteFill: {} } }))
vi.mock('expo-linear-gradient', () => ({ LinearGradient: 'Gradient' }))
vi.mock('react-native-svg', () => ({ default: 'Svg', Path: 'Path' }))
vi.mock('phosphor-react-native', () => Object.fromEntries(['ClockCounterClockwise', 'CheckCircle', 'Ticket', 'CalendarBlank', 'CaretLeft', 'CaretRight', 'Heart', 'Lock', 'Tire', 'Wrench', 'Check'].map(name => [name, name])))
vi.mock('expo-router', () => ({ useFocusEffect: () => {}, useRouter: () => ({}), useLocalSearchParams: () => ({}) }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'ar' } }) }))
vi.mock('../../components/v2', () => ({ AppScreen: ({ children }: { children: ReactNode }) => children }))
vi.mock('../../components/ui', () => ({ Skeleton: 'Skeleton', BottomSheet: ({ visible, children }: { visible: boolean; children: ReactNode }) => visible ? children : null }))
vi.mock('../guide/GuideProvider', () => ({ useGuidePage: () => {}, GuideTarget: ({ children }: { children: ReactNode }) => children }))
vi.mock('../../providers', () => ({ useAuth: () => ({}) }))
vi.mock('../../repositories/rewardRepository', () => ({ rewardRepository: {} }))
vi.mock('../../repositories/mobileHubRepository', () => ({ mobileHubRepository: {} }))
vi.mock('../../lib/direction', () => ({ useIsRTL: () => true, dirStyles: () => ({ row: { flexDirection: 'row-reverse' } }) }))
vi.mock('../../lib/typography', () => ({ useAppFont: () => 'Tajawal' }))
vi.mock('../../lib/theme', () => ({ useSanadTheme: () => ({ isDark: false, colors: new Proxy({}, { get: () => '#123456' }) }) }))

const require = createRequire(import.meta.url), pngLoader = require.extensions['.png']
beforeAll(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true); require.extensions['.png'] = module => { module.exports = 1 } })
afterAll(() => { vi.unstubAllGlobals(); if (pngLoader) require.extensions['.png'] = pngLoader; else delete require.extensions['.png'] })
const host = (name: string) => name as ElementType
function button(tree: ReactTestRenderer, label: string) {
  return tree.root.findAllByType(host('Pressable')).find(node => node.findAllByType(host('Text')).some(text => text.props.children === label))!
}

describe('mobile benefits and activity interactions', () => {
  it('opens an affordable offer, then reveals offers above the balance without pretending they are affordable', async () => {
    const onOffer = vi.fn(), onHistory = vi.fn()
    const offers = [20, 80].map(points => ({ id: String(points), title: `Offer ${points}`, points_required: points, discount_type: 'percentage', discount_value: 10, original_price: null, offer_price: null }) as PartnerOffer)
    let tree!: ReactTestRenderer
    await act(() => { tree = create(createElement(BenefitsView, { balance: 50, data: { offers, partnersById: {} }, onRetry: vi.fn(), onOffer, onHistory })) })
    expect(tree.root.findAllByType(host('Text')).filter(node => node.props.children === 'Offer 80')).toHaveLength(0)
    await act(() => button(tree, 'mobileHub.details').props.onPress())
    expect(onOffer).toHaveBeenCalledWith('20')
    await act(() => button(tree, 'mobileHub.allOffers').props.onPress())
    expect(tree.root.findAllByType(host('Text')).filter(node => node.props.children === 'Offer 80')).toHaveLength(1)
    expect(tree.root.findAllByType(host('Text')).filter(node => node.props.children === 'mobileHub.balanceCovers')).toHaveLength(1)
    await act(() => tree.root.findByProps({ accessibilityLabel: 'mobileHub.pointsHistory' }).props.onPress())
    expect(onHistory).toHaveBeenCalledOnce()
    await act(() => tree.unmount())
  })

  it('keeps mission navigation and the points history working when returning to activity', async () => {
    const onEntry = vi.fn(), onPeriod = vi.fn()
    const given = { id: 'given', type: 'given' as const, status: 'completed', serviceType: 'battery' as const, occurredAt: '2026-10-29T12:00:00Z', missionId: 'mission', points: 20 }
    const points = { id: 'points', type: 'points' as const, status: 'earned', occurredAt: '2026-10-29T12:00:00Z', missionId: 'mission', points: 20 }
    const props = { data: { completed: 1, received: 0, earned: 20, entries: [given, points], historyLimited: false }, period: 'month' as const, onPeriod, onRetry: vi.fn(), onEntry }
    let tree!: ReactTestRenderer
    await act(() => { tree = create(createElement(ActivityView, props)) })
    await act(() => button(tree, 'mobileHub.help request.battery').props.onPress())
    expect(onEntry).toHaveBeenCalledWith(given)
    await act(() => button(tree, 'mobileHub.allTime').props.onPress())
    expect(onPeriod).toHaveBeenCalledWith('all')
    await act(() => tree.update(createElement(ActivityView, { ...props, initialFilter: 'points' })))
    expect(tree.root.findAllByType(host('Text')).filter(node => node.props.children === 'mobileHub.help request.battery')).toHaveLength(0)
    await act(() => button(tree, 'mobileHub.pointsEarnedRow').props.onPress())
    expect(onEntry).toHaveBeenLastCalledWith(points)
    await act(() => tree.unmount())
  })
})
