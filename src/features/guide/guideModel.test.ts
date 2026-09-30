import { describe, expect, it } from 'vitest'
import { guidePages, pendingGuideStep, type GuideState } from './guideModel'
import { guideTranslations } from './guideCopy'

describe('first-account guide eligibility and resume', () => {
  const state: GuideState = { user_id: 'a', enabled: true, progress: {} }
  it('never auto-enrols existing accounts or anonymous sessions', () => {
    expect(pendingGuideStep(null, 'home')).toBeNull()
    expect(pendingGuideStep(undefined, 'home')).toBeNull()
  })
  it('starts on Home and delays page tours until Home is finished', () => {
    expect(pendingGuideStep(state, 'home')).toBe(0)
    expect(pendingGuideStep(state, 'perks')).toBeNull()
    expect(pendingGuideStep({ ...state, progress: { home: { step: 3, status: 'done' } } }, 'perks')).toBe(0)
  })
  it('resumes saved steps and does not repeat completed or skipped tours', () => {
    expect(pendingGuideStep({ ...state, progress: { home: { step: 2, status: 'active' } } }, 'home')).toBe(2)
    expect(pendingGuideStep({ ...state, enabled: false }, 'home')).toBeNull()
    expect(pendingGuideStep({ ...state, progress: { home: { step: 3, status: 'done' } } }, 'home')).toBeNull()
  })
  it('contains translated copy for every target, including reused Next buttons', () => {
    const keys = Object.keys(guideTranslations.ar.steps).sort()
    for (const lang of ['ar', 'he', 'en'] as const) {
      expect(Object.keys(guideTranslations[lang].steps).sort()).toEqual(keys)
      for (const page of Object.values(guidePages)) for (const target of page) {
        expect(guideTranslations[lang].steps[target].every(text => text.trim().length > 0)).toBe(true)
      }
      expect(guideTranslations[lang].steps['details.next']).toHaveLength(2)
      expect(guideTranslations[lang].steps['location.submit']).toHaveLength(2)
    }
  })
})
