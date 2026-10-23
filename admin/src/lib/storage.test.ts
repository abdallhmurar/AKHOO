import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

const { MAX_VIDEO_BYTES, VideoValidationError, validateVideoFile } = await import('./storage')

const file = (type: string, size: number) => ({ type, size, name: 'clip' }) as File

describe('validateVideoFile', () => {
  it('accepts an MP4 up to the 25 MB bucket limit', () => {
    expect(() => validateVideoFile(file('video/mp4', 10 * 1024 * 1024))).not.toThrow()
    expect(() => validateVideoFile(file('video/mp4', MAX_VIDEO_BYTES))).not.toThrow()
  })
  it('rejects other formats, which the app cannot all play', () => {
    for (const type of ['video/quicktime', 'video/webm', 'image/png', '']) {
      expect(() => validateVideoFile(file(type, 1024))).toThrow(VideoValidationError)
    }
  })
  it('rejects anything over 25 MB with the tooLarge message key', () => {
    expect(() => validateVideoFile(file('video/mp4', MAX_VIDEO_BYTES + 1))).toThrow('tooLarge')
  })
})
