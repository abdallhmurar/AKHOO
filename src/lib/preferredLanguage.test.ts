import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPreferredAppLanguage, detectDeviceLanguage } from './i18n'
const storage = vi.hoisted(() => ({ getItem: vi.fn() }))
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }))

beforeEach(() => storage.getItem.mockReset())
describe('language for the iOS launch video', () => {
  it.each(['ar', 'he', 'en'])('honors the saved %s preference before the device language', async language => {
    storage.getItem.mockResolvedValue(language)
    expect(await getPreferredAppLanguage()).toBe(language)
    expect(storage.getItem).toHaveBeenCalledWith('sanad_language')
  })
  it.each([null, 'unsupported'])('falls back to the device language for %s', async stored => {
    storage.getItem.mockResolvedValue(stored)
    expect(await getPreferredAppLanguage()).toBe(detectDeviceLanguage())
  })
})
