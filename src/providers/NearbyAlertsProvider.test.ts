import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NearbyAlertsProvider } from './NearbyAlertsProvider'

const m = vi.hoisted(() => ({ user: 'user' as string | null, supported: true, consent: vi.fn(), setConsent: vi.fn(), alert: vi.fn(), listen: vi.fn(), remove: vi.fn(), enable: vi.fn(), disable: vi.fn(), refresh: vi.fn(), stop: vi.fn(), push: vi.fn() }))
vi.mock('react-native', () => ({ Alert: { alert: m.alert }, AppState: { currentState: 'active', addEventListener: m.listen }, Linking: { openSettings: vi.fn() } }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'ar' } }) }))
vi.mock('./AuthProvider', () => ({ useAuth: () => ({ session: m.user ? { user: { id: m.user } } : null, status: m.user ? 'signed-in' : 'signed-out' }) }))
vi.mock('../lib/nearbyAlertPreference', () => ({ supportsNearbyBackgroundAlerts: () => m.supported, getNearbyAlertConsent: m.consent, setNearbyAlertConsent: m.setConsent }))
vi.mock('../lib/location', () => ({ stopBackgroundLocationUpdates: m.stop }))
vi.mock('../services/pushRegistration', () => ({ syncPushRegistration: m.push }))
vi.mock('../services/nearbyAlerts', () => ({ enableNearbyAlerts: m.enable, disableNearbyAlerts: m.disable, refreshNearbyAlerts: m.refresh }))
let rendered: ReactTestRenderer | undefined
const mount = async () => { await act(async () => { rendered = create(createElement(NearbyAlertsProvider)) }) }

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.clearAllMocks()
  m.user = 'user'
  m.supported = true
  m.consent.mockResolvedValue(null)
  m.setConsent.mockResolvedValue(undefined)
  m.listen.mockReturnValue({ remove: m.remove })
  m.enable.mockResolvedValue('on')
  m.refresh.mockResolvedValue('on')
  m.disable.mockResolvedValue('off')
  m.stop.mockResolvedValue(undefined)
  m.push.mockResolvedValue(true)
})
afterEach(async () => { await act(async () => { rendered?.unmount() }); rendered = undefined })

it('shows a disclosure before enabling any location work; declining does not enable it', async () => {
  await mount()
  expect(m.alert).toHaveBeenCalledTimes(1)
  expect(m.alert.mock.calls[0]![1]).toContain('حتى لما التطبيق بالخلفية')
  expect(m.enable).not.toHaveBeenCalled()
  expect(m.refresh).not.toHaveBeenCalled()
  await act(async () => { m.alert.mock.calls[0]![2][0].onPress() })
  expect(m.setConsent).toHaveBeenCalledWith('user', false)
  expect(m.enable).not.toHaveBeenCalled()
})
it('enables only after the user accepts the disclosure', async () => {
  await mount()
  await act(async () => { m.alert.mock.calls[0]![2][1].onPress() })
  expect(m.enable).toHaveBeenCalledWith('user', expect.objectContaining({ title: expect.any(String) }))
})
it('refreshes a consenting account at launch and resume, then stops on sign-out', async () => {
  m.consent.mockResolvedValue(true)
  await mount()
  expect(m.alert).not.toHaveBeenCalled()
  expect(m.refresh).toHaveBeenCalledTimes(1)
  await act(async () => { m.listen.mock.calls[0]![1]('active') })
  expect(m.refresh).toHaveBeenCalledTimes(2)
  m.user = null
  await act(async () => { rendered!.update(createElement(NearbyAlertsProvider)) })
  expect(m.stop).toHaveBeenCalledWith('user')
  expect(m.remove).toHaveBeenCalled()
})
it('does not enable an old account if its disclosure is accepted after switching accounts', async () => {
  await mount()
  const acceptOld = m.alert.mock.calls[0]![2][1].onPress
  m.user = 'new-user'
  await act(async () => { rendered!.update(createElement(NearbyAlertsProvider)) })
  await act(async () => { acceptOld() })
  expect(m.enable).not.toHaveBeenCalled()
  expect(m.stop).toHaveBeenCalledWith('user')
})
it('leaves shipped binaries and web unchanged when the native capability is absent', async () => {
  m.supported = false
  await mount()
  expect(m.alert).not.toHaveBeenCalled()
  expect(m.consent).not.toHaveBeenCalled()
  expect(m.refresh).not.toHaveBeenCalled()
})
