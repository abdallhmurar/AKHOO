import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, expect, it, vi } from 'vitest'
import { PartnerToolsEntry } from './PartnerToolsEntry'
import { PartnerToolsScreen } from './PartnerToolsScreen'

const { usePartnerAccess, push } = vi.hoisted(() => ({ usePartnerAccess: vi.fn(), push: vi.fn() }))
vi.mock('./usePartnerAccess', () => ({ usePartnerAccess }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('expo-router', () => ({ useRouter: () => ({ push }), Redirect: ({ href }: { href: string }) => createElement('span', null, `Redirect:${href}`) }))
vi.mock('react-native', () => ({ Text: 'span', View: 'div', StyleSheet: { create: (value: unknown) => value, hairlineWidth: 1 } }))
vi.mock('phosphor-react-native', () => ({ ArrowClockwise: () => null, ClockCounterClockwise: () => null, QrCode: () => null, Storefront: () => null, Tag: () => null, UsersThree: () => null }))
vi.mock('../../lib/direction', () => ({ useIsRTL: () => false }))
vi.mock('../../lib/typography', () => ({ useAppTypography: () => ({ small: {} }) }))
vi.mock('../../lib/theme', () => ({ useSanadTheme: () => ({ colors: {} }), radius: { lg: 18 }, space: { sm: 8, lg: 16 } }))
vi.mock('../../components/v2', () => ({
  AppScreen: ({ children }: { children: React.ReactNode }) => createElement('main', null, children),
  ScreenHeader: () => null,
  ListRow: ({ title }: { title: string }) => createElement('button', null, title)
}))
vi.mock('../../components/v2/ListRow', () => ({ ListRow: ({ title }: { title: string }) => createElement('button', null, title) }))
vi.mock('../../components/ui', () => ({
  Card: ({ title, children }: { title: string; children: React.ReactNode }) => createElement('section', null, title, children),
  StatusBadge: ({ label }: { label: string }) => createElement('span', null, label),
  ErrorState: () => createElement('p', null, 'verify-error'),
  Skeleton: () => createElement('p', null, 'checking'),
  IconButton: () => null, BottomSheet: () => null
}))

beforeEach(() => { vi.clearAllMocks() })

it.each(['denied', 'checking', 'error'])('hides the Account entry for %s access', status => {
  usePartnerAccess.mockReturnValue({ status, access: null })
  expect(renderToStaticMarkup(createElement(PartnerToolsEntry))).toBe('')
})
it('shows the Account entry only for authorized access', () => {
  usePartnerAccess.mockReturnValue({ status: 'authorized', access: { business_name: 'Real business', role: 'owner' } })
  expect(renderToStaticMarkup(createElement(PartnerToolsEntry))).toContain('partnerTools.title')
  const screen = renderToStaticMarkup(createElement(PartnerToolsScreen))
  expect(screen).toContain('Real business')
  for (const tool of ['scanner', 'history', 'customers', 'offers']) expect(screen).toContain(`partnerTools.tools.${tool}`)
})
it('redirects unauthorized direct navigation and removes the screen after revocation', () => {
  usePartnerAccess.mockReturnValue({ status: 'denied', access: null })
  expect(renderToStaticMarkup(createElement(PartnerToolsScreen))).toContain('Redirect:/(tabs)/account')
})
it.each([['checking', 'checking'], ['error', 'verify-error']])('guards direct navigation while %s', (status, message) => {
  usePartnerAccess.mockReturnValue({ status, access: null })
  const screen = renderToStaticMarkup(createElement(PartnerToolsScreen))
  expect(screen).toContain(message)
  expect(screen).not.toContain('partnerTools.tools.')
})
