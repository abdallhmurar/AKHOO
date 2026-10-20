import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStaggeredReveal } from './useStaggeredReveal'

type Item = { kind: 'delay'; ms: number } | { kind: 'timing'; value: FakeValue; config: { useNativeDriver?: boolean } } | { kind: 'sequence'; items: Item[] }
type FakeValue = { value: number; setValue(next: number): void }

const state = vi.hoisted(() => ({
  effects: [] as (() => (() => void) | void)[],
  parallel: undefined as undefined | { items: unknown[]; config: { stopTogether?: boolean } | undefined },
  onEnd: undefined as undefined | ((result: { finished: boolean }) => void),
  stops: 0
}))

vi.mock('react', () => ({
  useRef: <T,>(current: T) => ({ current }),
  useMemo: <T,>(factory: () => T) => factory(),
  useEffect: (effect: () => (() => void) | void) => { state.effects.push(effect) }
}))
vi.mock('react-native', () => {
  class Value {
    constructor(public value: number) {}
    interpolate() { return { interpolated: true } }
    setValue(next: number) { this.value = next }
  }
  return {
    Easing: { out: (easing: unknown) => easing, cubic: 'cubic' },
    Animated: {
      Value,
      delay: (ms: number) => ({ kind: 'delay', ms }),
      timing: (value: unknown, config: unknown) => ({ kind: 'timing', value, config }),
      sequence: (items: unknown[]) => ({ kind: 'sequence', items }),
      parallel: (items: unknown[], config?: { stopTogether?: boolean }) => {
        state.parallel = { items, config }
        return { start(callback: (result: { finished: boolean }) => void) { state.onEnd = callback }, stop() { state.stops += 1 } }
      }
    }
  }
})

beforeEach(() => {
  state.effects.length = 0
  state.parallel = undefined
  state.onEnd = undefined
  state.stops = 0
})

describe('staggered reveal', () => {
  it('runs every stage on its own so one stopped stage cannot freeze the others at opacity 0', () => {
    const { stageStyle } = useStaggeredReveal(3, 100)
    state.effects[0]!()
    // Animated.stagger() would use the default stopTogether, which is exactly what hid the offers list.
    expect(state.parallel?.config).toEqual({ stopTogether: false })
    const stages = state.parallel!.items as Item[]
    expect(stages).toHaveLength(3)
    stages.forEach((stage, index) => {
      expect(stage).toMatchObject({ kind: 'sequence', items: [{ kind: 'delay', ms: 100 * index }, { kind: 'timing' }] })
      const timing = (stage as Extract<Item, { kind: 'sequence' }>).items[1] as Extract<Item, { kind: 'timing' }>
      expect(timing.config.useNativeDriver).toBe(false)
    })
    expect(stageStyle(1)).toBe(stageStyle(1))
    expect(stageStyle(2)).toMatchObject({ opacity: { value: 0 }, transform: [{ translateY: { interpolated: true } }] })
  })

  it('finishes every stage at 1 however the reveal ends', () => {
    const { stageStyle } = useStaggeredReveal(3)
    const cleanup = state.effects[0]!() as () => void
    const values = [0, 1, 2].map(index => (stageStyle(index) as unknown as { opacity: FakeValue }).opacity)
    values.forEach((value, index) => { value.value = index * 0.1 })
    state.onEnd!({ finished: false })
    expect(values.map(value => value.value)).toEqual([1, 1, 1])
    cleanup()
    expect(state.stops).toBe(1)
  })
})
