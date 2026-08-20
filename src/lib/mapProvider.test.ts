import { describe, expect, it } from 'vitest'
import { estimateZoomForSpan, MAP_FIT_BOUNDS_MAX_ZOOM } from './mapProvider'

describe('estimateZoomForSpan', () => {
  it('caps at maxZoom for two nearly-identical points (a tiny span)', () => {
    expect(estimateZoomForSpan(0.0001, 0.0001, MAP_FIT_BOUNDS_MAX_ZOOM)).toBe(MAP_FIT_BOUNDS_MAX_ZOOM)
  })

  it('never goes below the zoom-3 floor for a very wide span', () => {
    expect(estimateZoomForSpan(180, 180, MAP_FIT_BOUNDS_MAX_ZOOM)).toBe(3)
  })

  it('produces a smaller zoom for a wider span than a narrower one', () => {
    const narrow = estimateZoomForSpan(0.05, 0.05, MAP_FIT_BOUNDS_MAX_ZOOM)
    const wide = estimateZoomForSpan(2, 2, MAP_FIT_BOUNDS_MAX_ZOOM)
    expect(wide).toBeLessThan(narrow)
  })

  it('uses the larger of latSpan/lngSpan to decide the zoom', () => {
    const latDominant = estimateZoomForSpan(5, 0.01, MAP_FIT_BOUNDS_MAX_ZOOM)
    const lngDominant = estimateZoomForSpan(0.01, 5, MAP_FIT_BOUNDS_MAX_ZOOM)
    expect(latDominant).toBe(lngDominant)
  })

  it('respects a custom maxZoom cap', () => {
    expect(estimateZoomForSpan(0.0001, 0.0001, 10)).toBe(10)
  })
})
