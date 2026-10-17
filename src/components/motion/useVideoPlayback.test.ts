import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { SharedObject } from '../../../node_modules/expo-modules-core/src/ts-declarations/SharedObject'
// Exercise the installed Expo lifecycle, rather than a mock of its release order.
import { useReleasingSharedObject } from '../../../node_modules/expo-modules-core/src/hooks/useReleasingSharedObject'
import { useVideoPlayback } from './useVideoPlayback.ios'

function nativePlayer() {
  let released = false
  const calls: string[] = []
  const invoke = (method: string) => {
    if (released) throw new Error(`Native player ${method} called after release`)
    calls.push(method)
  }
  return {
    calls,
    play: () => invoke('play'),
    pause: () => invoke('pause'),
    release: () => { invoke('release'); released = true },
  }
}
type Player = ReturnType<typeof nativePlayer>

function Playback({ player, playing }: { player: Player; playing: boolean }) {
  const managed = useReleasingSharedObject(() => player as Player & SharedObject, [player])
  useVideoPlayback(managed, playing)
  return null
}

beforeAll(() => { vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true) })
afterAll(() => { vi.unstubAllGlobals() })

describe('iOS video lifecycle', () => {
  it.each([false, true])('unmounts a startup gate safely when playing=%s', async playing => {
    const player = nativePlayer()
    let root!: ReactTestRenderer
    await act(() => { root = create(createElement(Playback, { player, playing })) })
    await expect(act(() => root.unmount())).resolves.toBeUndefined()
    expect(player.calls).toEqual([playing ? 'play' : 'pause', 'release'])
  })

  it('pauses on blur/background/reduced motion and resumes without releasing the player', async () => {
    const player = nativePlayer()
    let root!: ReactTestRenderer
    await act(() => { root = create(createElement(Playback, { player, playing: false })) })
    await act(() => root.update(createElement(Playback, { player, playing: true })))
    await act(() => root.update(createElement(Playback, { player, playing: false })))
    await act(() => root.update(createElement(Playback, { player, playing: true })))
    expect(player.calls).toEqual(['pause', 'play', 'pause', 'play'])
    await act(() => root.unmount())
    expect(player.calls.at(-1)).toBe('release')
  })

  it('replaces a source and releases each native player exactly once', async () => {
    const first = nativePlayer()
    const second = nativePlayer()
    let root!: ReactTestRenderer
    await act(() => { root = create(createElement(Playback, { player: first, playing: true })) })
    await act(() => root.update(createElement(Playback, { player: second, playing: true })))
    expect(first.calls).toEqual(['play', 'release'])
    expect(second.calls).toEqual(['play'])
    await act(() => root.unmount())
    expect(second.calls).toEqual(['play', 'release'])
  })
})
