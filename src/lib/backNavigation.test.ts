import { describe, expect, it } from 'vitest'
import { resolveRequestHelpBack } from './backNavigation'

describe('resolveRequestHelpBack', () => {
  it('goes from step 3 (location) back to step 2 (details)', () => {
    expect(resolveRequestHelpBack('location')).toEqual({ kind: 'previous-step', step: 'details' })
  })

  it('goes from step 2 (details) back to step 1 (type)', () => {
    expect(resolveRequestHelpBack('details')).toEqual({ kind: 'previous-step', step: 'type' })
  })

  it('goes from step 1 (type) to home - there is no earlier step', () => {
    expect(resolveRequestHelpBack('type')).toEqual({ kind: 'home' })
  })
})
