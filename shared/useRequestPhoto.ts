import { useCallback, useEffect, useState } from 'react'
import { focusManager, onlineManager } from '@tanstack/react-query'
import { requestPhotoPath, signRequestPhoto, type RequestPhotoClient } from './requestPhotos'

type PhotoState = {
  key: string
  url: string | null
  expiresAt: number
  status: 'loading' | 'ready' | 'error'
}

/** Memory-only, identity-scoped URL; never persist a signed URL or fall back to public access. */
export function useRequestPhoto(client: RequestPhotoClient, supabaseUrl: string, reference: string | null, userId: string | null) {
  const [attempt, setAttempt] = useState(0)
  const [photo, setPhoto] = useState<PhotoState | null>(null)
  const retry = useCallback(() => setAttempt(value => value + 1), [])
  const key = JSON.stringify([userId, reference, attempt])
  const enabled = !!userId && !!requestPhotoPath(reference, supabaseUrl)

  useEffect(() => {
    if (!enabled || !reference) return
    let active = true
    let renewal: ReturnType<typeof setTimeout> | undefined
    let expiry: ReturnType<typeof setTimeout> | undefined
    setPhoto({ key, url: null, expiresAt: 0, status: 'loading' })
    void signRequestPhoto(client, supabaseUrl, reference).then(result => {
      if (!active) return
      const remaining = result.expiresAt - Date.now()
      if (remaining <= 0) throw new Error('Request photo expired')
      setPhoto({ key, ...result, status: 'ready' })
      // Refresh before expiry. Hide the old photo immediately on a refresh or
      // permission failure; a stalled request cannot keep an expired URL alive.
      renewal = setTimeout(retry, Math.max(1000, remaining - 60_000))
      expiry = setTimeout(() => {
        if (active) setPhoto({ key, url: null, expiresAt: 0, status: 'error' })
      }, remaining)
    }).catch(() => {
      if (active) setPhoto({ key, url: null, expiresAt: 0, status: 'error' })
    })
    return () => { active = false; clearTimeout(renewal); clearTimeout(expiry) }
  }, [client, supabaseUrl, reference, enabled, key, retry])

  useEffect(() => {
    if (!enabled) return
    // QueryProvider supplies native AppState/network changes; on web these
    // managers use visibility/online events. Recheck permission on returning.
    const focus = focusManager.subscribe(focused => { if (focused) retry() })
    const online = onlineManager.subscribe(connected => { if (connected) retry() })
    return () => { focus(); online() }
  }, [enabled, retry])

  const current = photo?.key === key ? photo : null
  const url = enabled && current?.status === 'ready' && current.expiresAt > Date.now() ? current.url : null
  return {
    url,
    loading: enabled && (!current || current.status === 'loading'),
    retry,
    onImageError: () => setPhoto(current => current?.key === key ? { key, url: null, expiresAt: 0, status: 'error' } : current)
  }
}
