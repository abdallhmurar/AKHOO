import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearUserTextTranslationCache, translateUserText } from './userTextTranslation'

const invoke = vi.hoisted(() => vi.fn())
vi.mock('../lib/supabase', () => ({ supabase: { functions: { invoke } } }))

beforeEach(() => {
  invoke.mockReset()
  clearUserTextTranslationCache()
})

describe('on-demand translation of text written by other users', () => {
  it('asks for the reader language and remembers a successful result for the session', async () => {
    invoke.mockResolvedValue({ data: { status: 'translated', text: 'Hello' }, error: null })
    expect(await translateUserText('مرحبا', 'en-US')).toEqual({ status: 'translated', text: 'Hello' })
    expect(await translateUserText('مرحبا', 'en')).toEqual({ status: 'translated', text: 'Hello' })
    expect(invoke).toHaveBeenCalledTimes(1)
    expect(invoke).toHaveBeenCalledWith('translate-user-text', { body: { text: 'مرحبا', target: 'en' } })
  })

  it('reports text that is already in the reader language', async () => {
    invoke.mockResolvedValue({ data: { status: 'same' }, error: null })
    expect(await translateUserText('hello', 'en')).toEqual({ status: 'same' })
  })

  it('distinguishes the rate limit from other failures and does not cache failures', async () => {
    invoke.mockResolvedValueOnce({ data: null, error: { context: { status: 429 } } })
    expect(await translateUserText('مرحبا', 'he')).toEqual({ status: 'limited' })
    invoke.mockResolvedValueOnce({ data: null, error: new Error('boom') })
    expect(await translateUserText('مرحبا', 'he')).toEqual({ status: 'unavailable' })
    invoke.mockResolvedValueOnce({ data: { status: 'not_configured' }, error: null })
    expect(await translateUserText('مرحبا', 'he')).toEqual({ status: 'unavailable' })
    invoke.mockRejectedValueOnce(new Error('offline'))
    expect(await translateUserText('مرحبا', 'he')).toEqual({ status: 'unavailable' })
    expect(invoke).toHaveBeenCalledTimes(4)
  })
})
