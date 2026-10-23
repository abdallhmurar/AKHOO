import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SOUND_CHANNELS, SOUND_PACK, type SoundCategory } from '../../shared/notificationSounds'
import { copy } from '../../supabase/functions/_shared/notificationCopy'
import { eventSound, withSounds } from '../../supabase/functions/_shared/sounds'
import app from '../../app.json'
import ar from '../locales/ar.json'
import en from '../locales/en.json'
import he from '../locales/he.json'

const categories = Object.keys(SOUND_CHANNELS) as SoundCategory[]

describe('notification sound files', () => {
  it('exist, are valid 16-bit mono WAV files, short, and do not clip', () => {
    for (const category of categories) {
      const file = `assets/sounds/${SOUND_CHANNELS[category].sound}`
      expect(existsSync(file), file).toBe(true)
      const bytes = readFileSync(file)
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF')
      expect(bytes.toString('ascii', 8, 12)).toBe('WAVE')
      expect(bytes.readUInt16LE(20), 'PCM').toBe(1)
      expect(bytes.readUInt16LE(22), 'mono').toBe(1)
      expect(bytes.readUInt16LE(34), '16-bit').toBe(16)
      const seconds = bytes.readUInt32LE(40) / 2 / bytes.readUInt32LE(24)
      expect(seconds, file).toBeGreaterThan(0.3)
      expect(seconds, file).toBeLessThan(5)
      let peak = 0
      for (let i = 44; i + 1 < bytes.length; i += 2) peak = Math.max(peak, Math.abs(bytes.readInt16LE(i)) / 32768)
      expect(peak, file).toBeLessThanOrEqual(0.9)
      expect(peak, file).toBeGreaterThan(0.3)
    }
  })
  it('are named so Android accepts them as raw resources (lowercase letters, digits, underscore)', () => {
    for (const category of categories) expect(SOUND_CHANNELS[category].sound).toMatch(/^[a-z][a-z0-9_]*\.wav$/)
  })
  it('are exactly the files the expo-notifications plugin bundles', () => {
    const plugin = (app.expo.plugins as unknown[]).find(entry => Array.isArray(entry) && entry[0] === 'expo-notifications') as [string, { sounds?: string[] }]
    expect([...(plugin[1].sounds ?? [])].sort()).toEqual(categories.map(category => `./assets/sounds/${SOUND_CHANNELS[category].sound}`).sort())
  })
})

describe('Android channel names', () => {
  it('exist in Arabic, English and Hebrew for every sound category', () => {
    for (const locale of [ar, en, he]) for (const category of categories) expect(locale.notificationChannels[category].trim()).not.toBe('')
  })
})

describe('which sound each notification uses', () => {
  it('covers every notify-event notification with a known category', () => {
    for (const event of Object.keys(copy) as (keyof typeof copy)[]) expect(categories, event).toContain(eventSound[event])
  })
  it('keeps the loud sound for nearby requests only', () => {
    expect(Object.entries(eventSound).filter(([, category]) => category === 'requests').map(([event]) => event)).toEqual(['request_still_open'])
  })
})

describe('withSounds', () => {
  const devices = (rows: { token: string; sound_pack: number | null }[], error: unknown = null) => ({ from: () => ({ select: () => ({ in: async () => ({ data: rows, error }) }) }) })
  const messages = [{ to: 'new', title: 't', body: 'b', sound: 'default' }, { to: 'old', title: 't', body: 'b', sound: 'default' }, { to: 'unknown', title: 't', body: 'b', sound: 'default' }]
  it('names the channel and sound only for devices that reported the sound pack', async () => {
    const result = await withSounds(devices([{ token: 'new', sound_pack: SOUND_PACK }, { token: 'old', sound_pack: 0 }]), messages, 'requests')
    expect(result[0]).toMatchObject({ channelId: 'requests', sound: 'akhoo_request.wav' })
    expect(result[1]).toEqual(messages[1])
    expect(result[2]).toEqual(messages[2])
  })
  it('uses the channel of the category it is given', async () => {
    expect((await withSounds(devices([{ token: 'new', sound_pack: SOUND_PACK }]), messages, 'messages'))[0]).toMatchObject({ channelId: 'messages', sound: 'akhoo_message.wav' })
  })
  it('sends the messages unchanged, never drops them, when the lookup fails', async () => {
    expect(await withSounds(devices([], new Error('db down')), messages, 'calm')).toEqual(messages)
    expect(await withSounds({ from: () => { throw new Error('boom') } }, messages, 'calm')).toEqual(messages)
  })
  it('does nothing for an empty batch', async () => {
    expect(await withSounds(devices([]), [], 'calm')).toEqual([])
  })
})
