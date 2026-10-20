import { describe, expect, it, vi } from 'vitest'
import { useStaggeredReveal } from './useStaggeredReveal'

const state = vi.hoisted(() => ({ timings: [] as { useNativeDriver?: boolean }[], effects: [] as (() => (() => void) | void)[], stops: 0 }))

vi.mock('react', () => ({
  useRef: <T,>(current: T) => ({ current }),
  useMemo: <T,>(factory: () => T) => factory(),
  useEffect: (effect: () => (() => void) | void) => { state.effects.push(effect) }
}))
vi.mock('react-native', () => {
  class Value {
    constructor(public value: number) {}
    interpolate() { return { interpolated: true } }
  }
  return {
    Easing: { out: (easing: unknown) => easing, cubic: 'cubic' },
    Animated: {
      Value,
      timing: (_value: unknown, config: { useNativeDriver?: boolean }) => { state.timings.push(config); return { start() {}, stop() {} } },
      stagger: () => ({ start() {}, stop() { state.stops += 1 } })
    }
  }
})

describe('staggered reveal', () => {
  it('uses the JS driver so a re-render after the animation cannot leave content invisible', () => {
    state.timings.length = 0
    state.effects.length = 0
    const { stageStyle } = useStaggeredReveal(3)
    const cleanup = state.effects[0]!()
    expect(state.timings).toHaveLength(3)
    expect(state.timings.every(config => config.useNativeDriver === false)).toBe(true)
    // The same style object is returned for a stage, so a re-render does not re-attach animated props.
    expect(stageStyle(1)).toBe(stageStyle(1))
    expect(stageStyle(0)).not.toBe(stageStyle(2))
    expect(stageStyle(2)).toMatchObject({ opacity: { value: 0 }, transform: [{ translateY: { interpolated: true } }] })
    ;(cleanup as () => void)()
    expect(state.stops).toBe(1)
  })
})
