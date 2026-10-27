import { describe, expect, it } from 'vitest'
import { isLocalSceneNavigation, isSceneMessage, sceneCommand, type NativeSceneState } from './nativeSceneProtocol'

describe('offline native 3D bridge', () => {
  it('passes updated interaction and lifecycle state without executable interpolation', () => {
    const state: NativeSceneState = { kind: 'gift', active: true, reduced: false, idle: false, metal: '#ced8e2', interaction: 2 }
    let received: unknown
    const scene = { setState: (value: unknown) => { received = value } }
    new Function('window', sceneCommand(state))({ akhooScene: scene })
    expect(received).toEqual(state)
    const paused = { ...state, active: false, reduced: true }
    new Function('window', sceneCommand(paused))({ akhooScene: scene })
    expect(received).toEqual(paused)
  })
  it('accepts only local HTML navigation and known engine replies', () => {
    expect(isLocalSceneNavigation('about:blank')).toBe(true)
    expect(isLocalSceneNavigation('about:srcdoc')).toBe(true)
    for (const url of ['https://example.com', 'file:///private/data', 'javascript:alert(1)', 'about:blank#external']) expect(isLocalSceneNavigation(url)).toBe(false)
    expect(isSceneMessage('ready')).toBe(true)
    expect(isSceneMessage('unavailable')).toBe(true)
    expect(isSceneMessage('{"navigate":"https://example.com"}')).toBe(false)
  })
  it('delivers tree growth updates independently of tap interactions', () => {
    const states: unknown[] = []
    const window = { akhooScene: { setState: (value: unknown) => states.push(value) } }
    const state: NativeSceneState = { kind: 'tree', count: 0, active: true, reduced: false, idle: true, metal: '', interaction: 0 }
    for (const count of [0, 15, 42, 60]) new Function('window', sceneCommand({ ...state, count }))(window)
    expect(states).toEqual([0, 15, 42, 60].map(count => ({ ...state, count })))
  })
})
