export type NativeSceneState = {
  kind: 'gift' | 'medal' | 'rewardMedal' | 'tree'
  count?: number
  active: boolean
  reduced: boolean
  idle: boolean
  metal: string
  interaction: number
}

// Only serializable scene state crosses the local WebView boundary.
export function sceneCommand(state: NativeSceneState) {
  return `window.akhooScene?.setState(${JSON.stringify(state)});true;`
}
export function isSceneMessage(value: string): value is 'ready' | 'unavailable' {
  return value === 'ready' || value === 'unavailable'
}
export function isLocalSceneNavigation(url: string) {
  return url === 'about:blank' || url === 'about:srcdoc'
}
