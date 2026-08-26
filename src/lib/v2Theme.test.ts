import { describe, expect, it } from 'vitest'
import { civicColors, getSanadTheme, radius, space } from './theme'

describe('Civic Signal design tokens', () => {
  it('keeps approved immutable brand anchors', () => {
    expect(civicColors).toEqual({ navy: '#0B1F33', signalBlue: '#1768E5', communityTeal: '#147D62', emergencyCoral: '#C93D34', rewardGold: '#D99B22', fog: '#F3F6FA' })
  })

  it('provides semantic light and dark modes', () => {
    expect(getSanadTheme('light').colors.primary).toBe(civicColors.signalBlue)
    expect(getSanadTheme('dark').isDark).toBe(true)
    expect(getSanadTheme('dark').colors.textPrimary).not.toBe(getSanadTheme('dark').colors.background)
  })

  it('uses a disciplined spacing and radius scale', () => {
    expect(space.lg).toBe(16)
    expect(radius.lg).toBe(18)
    expect(radius.sheet).toBe(28)
  })
})
