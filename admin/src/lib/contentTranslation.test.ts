import { beforeEach, describe, expect, it, vi } from 'vitest'
import { translateForPublish } from './contentTranslation'

const mocks = vi.hoisted(() => ({ invoke: vi.fn(), warning: vi.fn() }))
vi.mock('./supabase', () => ({ supabase: { functions: { invoke: mocks.invoke } } }))
vi.mock('sonner', () => ({ toast: { warning: mocks.warning } }))
vi.mock('i18next', () => ({ default: { t: (key: string) => key } }))
beforeEach(() => vi.clearAllMocks())

describe('translation before publication', () => {
  it('reuses unchanged translations but requests new ones after editing the source', async () => {
    const existing = { ar: { body: 'أهلاً' }, he: { body: 'שלום' }, en: { body: 'Welcome' } }
    expect(await translateForPublish('support', { body: 'أهلاً' }, existing)).toEqual(existing)
    expect(mocks.invoke).not.toHaveBeenCalled()
    mocks.invoke.mockResolvedValue({ data: { status: 'translated', translations: existing }, error: null })
    await translateForPublish('support', { body: 'نص جديد' }, existing)
    expect(mocks.invoke).toHaveBeenCalledWith('translate-content', { body: { kind: 'support', fields: { body: 'نص جديد' } } })
  })
  it('explicitly warns when only the original can be saved without a provider key', async () => {
    mocks.invoke.mockResolvedValue({ data: { status: 'not_configured' }, error: null })
    expect(await translateForPublish('support', { body: 'أهلاً' })).toEqual({})
    expect(mocks.warning).toHaveBeenCalled()
  })
  it('stops publication on a provider error instead of silently reporting success', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: new Error('unavailable') })
    await expect(translateForPublish('support', { body: 'أهلاً' })).rejects.toThrow('contentTranslation.failed')
  })
  it('does not send image-only replies to a translation provider', async () => {
    expect(await translateForPublish('support', { body: '' })).toEqual({})
    expect(mocks.invoke).not.toHaveBeenCalled()
  })
})
