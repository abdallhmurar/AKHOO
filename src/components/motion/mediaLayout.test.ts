import { describe, expect, it } from 'vitest'
import { mediaFrame } from './mediaLayout'

describe('iOS artwork framing', () => {
  it.each([320, 375, 390, 430])('keeps the character at the left edge of the %ipx help card', screenWidth => {
    const width = screenWidth - 28, height = Math.max(250, width * 67 / 93)
    const frame = mediaFrame(width, height, 1168 / 784, 'cover', 'left')
    expect(frame.left).toBe(0)
    expect(frame.width).toBeGreaterThanOrEqual(width)
    expect(frame.height).toBeGreaterThanOrEqual(height)
    expect(frame.width / frame.height).toBeCloseTo(1168 / 784)
  })
  it('fits the complete scene inside a narrow problem card without clipping it', () => {
    const frame = mediaFrame(112, 118, 1168 / 784, 'contain')
    expect(frame.width).toBeLessThanOrEqual(112)
    expect(frame.height).toBeLessThanOrEqual(118)
    expect(frame.top).toBeGreaterThan(0)
    expect(frame.width / frame.height).toBeCloseTo(1168 / 784)
  })
  it('preserves the perks artwork proportions across header sizes', () => {
    for (const width of [320, 390, 480]) {
      const frame = mediaFrame(width, width * 3 / 7, 7 / 3, 'contain')
      expect(frame.width).toBeCloseTo(width)
      expect(frame.left).toBeCloseTo(0)
      expect(frame.top).toBeCloseTo(0)
    }
  })
  it('does not invent intrinsic poster dimensions before layout', () => {
    expect(mediaFrame(0, 0, 1.5, 'cover')).toEqual({ left: 0, top: 0, width: 0, height: 0 })
  })
})
