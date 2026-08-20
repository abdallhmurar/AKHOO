import { describe, expect, it } from 'vitest'
import { translateActionError } from './rpcErrors'

const t = ((key: string) => key) as any

describe('translateActionError', () => {
  it('maps a known Postgres exception message to its translation key', () => {
    expect(translateActionError(t, { message: 'Volunteer is not available' })).toBe('common.rpcErrors.volunteerNotAvailable')
  })

  it('maps the banned-account exception', () => {
    expect(translateActionError(t, { message: 'Account is banned' })).toBe('common.rpcErrors.accountBanned')
  })

  it('maps a unique_violation (postgres code 23505) to the "already have an active request" key regardless of message text', () => {
    expect(translateActionError(t, { code: '23505', message: 'duplicate key value violates unique constraint "help_requests_one_active_per_requester"' }))
      .toBe('common.rpcErrors.alreadyHaveActiveRequest')
  })

  it('falls back to the generic error key for an unrecognized message, never leaking raw text', () => {
    expect(translateActionError(t, { message: 'some new backend exception nobody mapped yet' })).toBe('common.error')
  })

  it('falls back to the generic error key when there is no error message at all', () => {
    expect(translateActionError(t, {})).toBe('common.error')
  })

  it('falls back to the generic error key for a null/undefined error', () => {
    expect(translateActionError(t, null)).toBe('common.error')
    expect(translateActionError(t, undefined)).toBe('common.error')
  })
})
