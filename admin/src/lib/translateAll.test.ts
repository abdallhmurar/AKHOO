import { beforeEach, describe, expect, it, vi } from 'vitest'
import { translateAllContent } from './translateAll'

const mocks = vi.hoisted(() => ({ tables: {} as Record<string, unknown[]>, rpc: vi.fn(), invoke: vi.fn() }))
vi.mock('./supabase', () => ({
  supabase: {
    from: (table: string) => ({ select: () => ({ eq: async () => ({ data: mocks.tables[table], error: null }) }) }),
    rpc: mocks.rpc,
    functions: { invoke: mocks.invoke }
  }
}))
vi.mock('sonner', () => ({ toast: { warning: vi.fn() } }))
vi.mock('i18next', () => ({ default: { t: (key: string) => key } }))

const translated = (ar: Record<string, string>) => ({ ar, he: Object.fromEntries(Object.entries(ar).map(([k, v]) => [k, v && `he:${v}`])), en: Object.fromEntries(Object.entries(ar).map(([k, v]) => [k, v && `en:${v}`])) })

beforeEach(() => {
  vi.clearAllMocks()
  mocks.rpc.mockResolvedValue({ error: null })
  mocks.invoke.mockImplementation(async (_name: string, { body }: { body: { fields: Record<string, string> } }) => ({ data: { status: 'translated', translations: translated(body.fields) }, error: null }))
})

describe('translate all existing content', () => {
  it('translates only businesses and offers that are missing a translation and stores them against the exact source text', async () => {
    const done = translated({ name: 'مطعم', description: '', address: '', service_area: '' })
    mocks.tables = {
      partners: [
        { id: 'b1', name: 'المحامي موطي', description: null, address: null, service_area: 'القدس', translations: {} },
        { id: 'b2', name: 'مطعم', description: null, address: null, service_area: null, translations: done }
      ],
      partner_offers: [{ id: 'o1', title: 'استشارة مجانية', description: null, terms: null, offer_type_label: null, translations: {} }]
    }
    expect(await translateAllContent()).toEqual({ translated: 2, skipped: 1, failed: 0 })
    expect(mocks.invoke).toHaveBeenCalledTimes(2)
    expect(mocks.rpc).toHaveBeenCalledWith('admin_set_business_translations', expect.objectContaining({ p_id: 'b1', p_source: { name: 'المحامي موطي', description: '', address: '', service_area: 'القدس' } }))
    expect(mocks.rpc).toHaveBeenCalledWith('admin_set_offer_translations', expect.objectContaining({ p_id: 'o1', p_source: { title: 'استشارة مجانية', description: '', terms: '', offer_type_label: '' } }))
  })

  it('counts a failed translation without stopping the rest or writing anything for it', async () => {
    mocks.tables = {
      partners: [{ id: 'b1', name: 'أ', description: null, address: null, service_area: null, translations: {} }, { id: 'b2', name: 'ب', description: null, address: null, service_area: null, translations: {} }],
      partner_offers: []
    }
    mocks.invoke.mockResolvedValueOnce({ data: null, error: new Error('down') })
    expect(await translateAllContent()).toEqual({ translated: 1, skipped: 0, failed: 1 })
    expect(mocks.rpc).toHaveBeenCalledTimes(1)
  })
})
