import { createRewardsGift } from '../../features/home/rewardsGiftScene.web'
import { createMedalScene } from './medalScene'
import type { NativeSceneState } from './nativeSceneProtocol'

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void }
    akhooScene?: { setState: (state: NativeSceneState) => void }
  }
}
let canvas = document.querySelector<HTMLCanvasElement>('canvas')!
let scene: ReturnType<typeof createMedalScene> | null = null
let state: NativeSceneState | null = null
let failed = false
const post = (value: string) => window.ReactNativeWebView?.postMessage(value)
const unavailable = () => { failed = true; post('unavailable') }
const resize = () => scene?.resize(window.innerWidth, window.innerHeight)
const sync = () => { if (state) scene?.setEnabled(state.active && !document.hidden, state.reduced) }
window.akhooScene = {
  setState(next) {
    if (failed) return
    const recreate = !scene || next.kind !== state?.kind || next.metal !== state?.metal || next.idle !== state?.idle
    const interactionChanged = next.interaction > (state?.interaction ?? 0)
    state = next
    try {
      if (recreate) {
        if (scene) {
          scene.dispose()
          const replacement = document.createElement('canvas')
          replacement.setAttribute('aria-hidden', 'true')
          canvas.replaceWith(replacement); canvas = replacement
        }
        scene = next.kind === 'gift' ? createRewardsGift(canvas, unavailable, () => {}, { idle: next.idle }) : createMedalScene(canvas, next.metal, unavailable)
        resize(); post('ready')
      }
      sync()
      if (interactionChanged && next.active && !next.reduced) scene?.celebrate()
    } catch { unavailable() }
  },
}
window.addEventListener('resize', resize)
document.addEventListener('visibilitychange', sync)
window.addEventListener('pagehide', () => { scene?.dispose(); scene = null }, { once: true })
