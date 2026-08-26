import { supabase } from '../lib/supabase'
import { normalizeAppError, throwIfError } from './errors'

export type UploadMediaInput = {
  bucket: 'avatars' | 'request-photos' | 'business-photos' | 'request-media'
  path: string
  uri: string
  contentType?: string
  upsert?: boolean
}

export type UploadedMedia = {
  bucket: UploadMediaInput['bucket']
  path: string
  /** Public legacy buckets return a URL; private V2 media intentionally does not. */
  publicUrl: string | null
}

export const mediaService = {
  async upload(input: UploadMediaInput): Promise<UploadedMedia> {
    try {
      const response = await fetch(input.uri)
      if (!response.ok) throw new Error(`Unable to read selected media (${response.status})`)
      const blob = await response.blob()
      const { error } = await supabase.storage.from(input.bucket).upload(input.path, blob, {
        contentType: input.contentType ?? blob.type ?? 'application/octet-stream',
        upsert: input.upsert ?? false
      })
      throwIfError(error, { domain: 'media', operation: 'upload' })

      const isPrivate = input.bucket === 'request-media'
      const publicUrl = isPrivate
        ? null
        : supabase.storage.from(input.bucket).getPublicUrl(input.path).data.publicUrl
      return { bucket: input.bucket, path: input.path, publicUrl }
    } catch (error) {
      throw normalizeAppError(error, { domain: 'media', operation: 'upload' })
    }
  },

  async createSignedUrl(bucket: string, path: string, expiresInSeconds = 900) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds)
    throwIfError(error, { domain: 'media', operation: 'create-signed-url' })
    return data.signedUrl
  },

  async remove(bucket: string, paths: string[]) {
    if (paths.length === 0) return
    const { error } = await supabase.storage.from(bucket).remove(paths)
    throwIfError(error, { domain: 'media', operation: 'remove' })
  }
}
