import { describe, expect, it } from 'vitest'
import { allowedMissionActions, assistanceCategories, assistanceScenarios, isMissionTerminal, localized, requiresEmergencyHandoff, scenariosForCategory } from './v2'

describe('SANAD V2 domain configuration', () => {
  it('defines the nine approved community-assistance categories', () => {
    expect(assistanceCategories.map(category => category.id)).toEqual([
      'mobility',
      'errands',
      'home_support',
      'accessibility',
      'accompaniment',
      'language_help',
      'digital_help',
      'community_response',
      'other'
    ])
  })

  it('keeps every scenario attached to a known category', () => {
    const categoryIds = new Set(assistanceCategories.map(category => category.id))
    expect(assistanceScenarios.every(scenario => categoryIds.has(scenario.categoryId))).toBe(true)
  })

  it('routes any critical screening answer to an emergency handoff', () => {
    expect(requiresEmergencyHandoff({ immediateDanger: false, medicalEmergency: true, fireOrViolence: false, childOrVulnerablePersonAtRisk: false })).toBe(true)
    expect(requiresEmergencyHandoff({ immediateDanger: false, medicalEmergency: false, fireOrViolence: false, childOrVulnerablePersonAtRisk: false })).toBe(false)
  })

  it('resolves locale copy with Arabic fallback', () => {
    expect(localized(assistanceCategories[0]!.label, 'he')).toBe('ניידות')
    expect(localized(assistanceCategories[0]!.label, 'fr')).toBe('التنقّل')
  })

  it('filters scenarios and identifies terminal mission states', () => {
    expect(scenariosForCategory('errands').map(item => item.id)).toEqual(['medicine_pickup', 'groceries'])
    expect(isMissionTerminal('completed')).toBe(true)
    expect(isMissionTerminal('arrived')).toBe(false)
  })

  it('keeps requester and helper status actions role-safe', () => {
    expect(allowedMissionActions('assigned', 'helper')).toContain('on_the_way')
    expect(allowedMissionActions('assigned', 'requester')).not.toContain('on_the_way')
    expect(allowedMissionActions('awaiting_confirmation', 'requester')).toEqual(['confirm', 'dispute'])
    expect(allowedMissionActions('in_progress', 'helper')).toEqual(['awaiting_confirmation'])
  })
})
