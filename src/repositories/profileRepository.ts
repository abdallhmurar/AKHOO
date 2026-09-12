import { supabase } from '../lib/supabase'
import type { Profile } from '../types'
import { mediaService } from '../services/mediaService'
import { throwIfError } from '../services/errors'

const PROFILE_COLUMNS = 'id,full_name,phone,avatar_url,is_admin,is_banned,created_at'

export type UpdateProfileInput = {
  fullName?: string
  phone?: string | null
  avatarUrl?: string | null
}

export const profileRepository = {
  async get(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', userId)
      .maybeSingle()
    throwIfError(error, { domain: 'profile', operation: 'get' })
    return data as Profile | null
  },

  async update(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const changes: Record<string, unknown> = {}
    if (input.fullName !== undefined) changes.full_name = input.fullName.trim()
    if (input.phone !== undefined) changes.phone = input.phone
    if (input.avatarUrl !== undefined) changes.avatar_url = input.avatarUrl

    const { data, error } = await supabase
      .from('profiles')
      .update(changes)
      .eq('id', userId)
      .select(PROFILE_COLUMNS)
      .single()
    throwIfError(error, { domain: 'profile', operation: 'update' })
    return data as Profile
  },

  // Separate from update() - push_token isn't part of the app-facing
  // Profile shape (PROFILE_COLUMNS never selects it back), just a
  // write-only destination for chat push notifications to reach a user
  // who has never gone available as a volunteer (the only other place a
  // push token gets stored is volunteer_profiles.push_token, written only
  // when toggling availability).
  async savePushToken(userId: string, token: string) {
    const { error } = await supabase.from('profiles').update({ push_token: token }).eq('id', userId)
    throwIfError(error, { domain: 'profile', operation: 'save-push-token' })
  },

  async uploadAvatar(userId: string, uri: string) {
    const uploaded = await mediaService.upload({
      bucket: 'avatars',
      path: `${userId}/avatar.jpg`,
      uri,
      contentType: 'image/jpeg',
      upsert: true
    })
    const avatarUrl = uploaded.publicUrl ? `${uploaded.publicUrl}?t=${Date.now()}` : null
    return this.update(userId, { avatarUrl })
  }
}
