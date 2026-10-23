import { describe, expect, it } from 'vitest'
import { LANGS, asLang, copy, levelFor, levelNames, render, serviceLabels, type EventKey } from '../../supabase/functions/_shared/notificationCopy'
import { achievementFor } from '../../supabase/functions/_shared/notifications'
import { getVolunteerActivityLevel } from '../lib/activityLevel'
import ar from '../locales/ar.json'
import en from '../locales/en.json'
import he from '../locales/he.json'

const events = Object.keys(copy) as EventKey[]
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()

describe('notification copy', () => {
  it('has a non-empty title and body in Arabic, English and Hebrew for every event', () => {
    for (const event of events) {
      for (const lang of LANGS) {
        expect(copy[event][lang].title.trim(), `${event}.${lang}.title`).not.toBe('')
        expect(copy[event][lang].body.trim(), `${event}.${lang}.body`).not.toBe('')
      }
    }
  })
  it('uses the same placeholders in every language of an event', () => {
    for (const event of events) {
      const reference = placeholders(copy[event].ar.title + ' ' + copy[event].ar.body)
      for (const lang of LANGS) expect(placeholders(copy[event][lang].title + ' ' + copy[event][lang].body), `${event}.${lang}`).toEqual(reference)
    }
  })
  it('keeps every title short enough to read on a lock screen and every body inside the push limit', () => {
    for (const event of events) for (const lang of LANGS) {
      expect(Array.from(copy[event][lang].title).length, `${event}.${lang}.title`).toBeLessThanOrEqual(50)
      expect(Array.from(copy[event][lang].body).length, `${event}.${lang}.body`).toBeLessThanOrEqual(120)
    }
  })
  it('writes Hebrew in Hebrew letters and Arabic in Arabic letters', () => {
    for (const event of events) {
      expect(copy[event].he.body).toMatch(/[֐-׿]/)
      expect(copy[event].ar.body).toMatch(/[؀-ۿ]/)
    }
  })
  it('fills placeholders and leaves unknown ones visible instead of dropping them', () => {
    expect(render('request_completed', 'en', { points: 10 }).body).toBe('You earned 10 points. Thank you for helping!')
    expect(render('request_completed', 'ar', { points: 10 }).body).toContain('10')
    expect(render('request_completed', 'he', {}).body).toContain('{points}')
  })
  it('falls back to Arabic for an unknown or missing language', () => {
    expect(asLang(null)).toBe('ar')
    expect(asLang('fr')).toBe('ar')
    expect(render('helper_arrived', 'fr').title).toBe(copy.helper_arrived.ar.title)
    expect(render('helper_arrived', 'he').title).toBe(copy.helper_arrived.he.title)
  })
  it('names the levels exactly as the app does', () => {
    for (const level of ['bronze', 'silver', 'gold', 'green'] as const) {
      expect(levelNames[level].ar).toBe(ar.activityLevel[level])
      expect(levelNames[level].en).toBe(en.activityLevel[level])
      expect(levelNames[level].he).toBe(he.activityLevel[level])
    }
  })
  it('has a label for every service type in every language', () => {
    for (const type of ['battery', 'tire', 'fuel', 'locked_car', 'other']) for (const lang of LANGS) expect(serviceLabels[type]![lang]).toBeTruthy()
  })
})

describe('levels and achievements', () => {
  it('uses the same thresholds as the app', () => {
    for (const count of [0, 4, 5, 14, 15, 29, 30, 59, 60, 200]) expect(levelFor(count)).toBe(getVolunteerActivityLevel(count))
  })
  it('announces a level the moment it is reached, and only then', () => {
    expect(achievementFor(5)).toEqual({ event: 'level_up', level: 'bronze' })
    expect(achievementFor(15)).toEqual({ event: 'level_up', level: 'silver' })
    expect(achievementFor(30)).toEqual({ event: 'level_up', level: 'gold' })
    expect(achievementFor(60)).toEqual({ event: 'level_up', level: 'green' })
    expect(achievementFor(6)).toBeNull()
    expect(achievementFor(61)).toBeNull()
  })
  it('celebrates the first help and the round numbers', () => {
    expect(achievementFor(1)).toEqual({ event: 'first_help' })
    expect(achievementFor(10)).toEqual({ event: 'milestone', n: 10 })
    expect(achievementFor(25)).toEqual({ event: 'milestone', n: 25 })
    expect(achievementFor(100)).toEqual({ event: 'milestone', n: 100 })
    expect(achievementFor(2)).toBeNull()
  })
  it('lets a level win when it lands on the same count as a milestone (never two extra pushes)', () => {
    expect(achievementFor(50)).toEqual({ event: 'milestone', n: 50 })
    expect(achievementFor(30)?.event).toBe('level_up')
  })
})
