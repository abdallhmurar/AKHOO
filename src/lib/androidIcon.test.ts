import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const app = require('../../app.json').expo

// Android masks the 108dp adaptive foreground to its middle 72dp (circle / squircle), so the full-bleed logo used for
// iOS and the store listing is cropped there (heads and the AKHOO line were cut off on phones). The adaptive layer is
// its own image with the logo kept inside the safe zone.
describe('Android adaptive icon', () => {
  it('uses a dedicated foreground, not the full-bleed app icon', () => {
    const foreground = app.android.adaptiveIcon.foregroundImage
    expect(foreground).toBe('./assets/images/adaptive-icon.png')
    expect(foreground).not.toBe(app.icon)
    expect(app.android.adaptiveIcon.backgroundColor).toBe('#FFFFFF')
  })

  it('is a square PNG of at least 1024 px (Expo scales it to the 108dp layer)', () => {
    const file = readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/images/adaptive-icon.png'))
    expect(file.subarray(1, 4).toString('ascii')).toBe('PNG')
    const width = file.readUInt32BE(16)
    const height = file.readUInt32BE(20)
    expect(width).toBe(height)
    expect(width).toBeGreaterThanOrEqual(1024)
  })

  it('keeps the iOS and store icon untouched', () => {
    expect(app.icon).toBe('./assets/images/icon.png')
  })
})
