import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../../lib/supabase'
import type { GuidePage, GuideState } from './guideModel'

type Operation = { id: string; page: GuidePage; step: number; status: 'active' | 'done' | 'skipped' }
const key = (id: string) => `akhoo.guide.v1.${id}`
const queues = new Map<string, Promise<unknown>>()
function serial<T>(id: string, action: () => Promise<T>): Promise<T> {
  const next = (queues.get(id) ?? Promise.resolve()).catch(() => {}).then(action)
  queues.set(id, next)
  void next.finally(() => { if (queues.get(id) === next) queues.delete(id) }).catch(() => {})
  return next
}
async function pending(id: string): Promise<Operation[]> {
  const raw = await AsyncStorage.getItem(key(id))
  if (!raw) return []
  try { return JSON.parse(raw) as Operation[] } catch { return [] }
}
export function applyGuideOperation(state: GuideState, op: Pick<Operation, 'page' | 'step' | 'status'>): GuideState {
  if (!state.enabled || (state.progress[op.page]?.status === 'done' && op.status === 'active')) return state
  return { ...state, enabled: op.status !== 'skipped', progress: { ...state.progress, [op.page]: { step: op.step, status: op.status } } }
}
export const guideRepository = {
  async read(id: string): Promise<GuideState | null> {
    const { data, error } = await supabase.from('account_usage_guide').select('user_id,enabled,progress').eq('user_id', id).maybeSingle()
    if (error) throw error
    if (!data) return null
    return (await pending(id)).reduce(applyGuideOperation, data as GuideState)
  },
  enqueue(id: string, op: Omit<Operation, 'id'>) {
    return serial(id, async () => {
      const list = await pending(id)
      list.push({ ...op, id: `${Date.now()}-${Math.random()}` })
      await AsyncStorage.setItem(key(id), JSON.stringify(list))
    })
  },
  flush(id: string) {
    return serial(id, async () => {
      const list = await pending(id)
      while (list.length) {
        // An old account's queued writes must never run under a new identity.
        const { data: auth } = await supabase.auth.getSession()
        if (auth.session?.user.id !== id) return
        const op = list[0]!
        const { error } = await supabase.rpc('save_usage_guide', { p_page: op.page, p_step: op.step, p_status: op.status })
        if (error) throw error
        list.shift()
        await AsyncStorage.setItem(key(id), JSON.stringify(list))
      }
    })
  },
  restart(id: string) {
    return serial(id, async () => {
      const { data, error } = await supabase.rpc('restart_usage_guide')
      if (error) throw error
      await AsyncStorage.removeItem(key(id))
      return data as GuideState
    })
  }
}
