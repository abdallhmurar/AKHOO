import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'
import type { Announcement } from '../types'

// silent: announcements are a nice-to-have on top of the app. A failed
// background fetch (offline, or before the backend migration is live) must
// never surface as an error toast on the home screen.
export const announcementRepository = {
  async list(): Promise<Announcement[]> {
    const { data, error } = await supabase.rpc('get_my_announcements')
    throwIfError(error, { domain: 'announcements', operation: 'list', silent: true })
    return (data ?? []) as Announcement[]
  },

  async markPopupShown(id: string): Promise<void> {
    const { error } = await supabase.rpc('mark_announcement_popup_shown', { p_id: id })
    throwIfError(error, { domain: 'announcements', operation: 'mark-popup-shown', silent: true })
  },

  async markRead(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    const { error } = await supabase.rpc('mark_announcements_read', { p_ids: ids })
    throwIfError(error, { domain: 'announcements', operation: 'mark-read', silent: true })
  }
}
