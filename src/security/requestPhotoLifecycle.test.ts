import { createElement } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { focusManager, onlineManager } from '@tanstack/react-query'
import { useRequestPhoto } from '../../shared/useRequestPhoto'

const base = 'https://zmpwdufahjmlxfwzafvr.supabase.co'
const reference = `${base}/storage/v1/object/public/request-photos/00000000-0000-0000-0000-000000000001/photo.jpg`
const sign = vi.fn()
const client = { storage: { from: () => ({ createSignedUrl: sign }) } }
let photo: ReturnType<typeof useRequestPhoto>
let tree: ReactTestRenderer
function Probe({ userId = 'owner', ref = reference }: { userId?: string | null; ref?: string }) {
  photo = useRequestPhoto(client, base, ref, userId)
  return null
}
const signed = (url: string) => ({ data: { signedUrl: url }, error: null })
const mount = async () => { await act(async () => { tree = create(createElement(Probe)) }) }

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  sign.mockReset().mockResolvedValue(signed('first-signed'))
  focusManager.setFocused(true)
  onlineManager.setOnline(true)
})
afterEach(async () => {
  await act(async () => { tree?.unmount() })
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('private photo lifecycle', () => {
  it('renews before expiry and rechecks on foreground/network return', async () => {
    await mount()
    expect(photo.url).toBe('first-signed')
    sign.mockResolvedValue(signed('renewed'))
    await act(async () => { await vi.advanceTimersByTimeAsync(240_000) })
    expect(photo.url).toBe('renewed')
    await act(async () => { focusManager.setFocused(false); focusManager.setFocused(true) })
    await act(async () => { onlineManager.setOnline(false); onlineManager.setOnline(true) })
    expect(sign).toHaveBeenCalledTimes(4)
  })

  it('hides a revoked or missing photo and permits an explicit retry', async () => {
    await mount()
    sign.mockResolvedValue({ data: null, error: new Error('denied') })
    await act(async () => { photo.retry() })
    expect(photo.url).toBeNull()
    expect(photo.loading).toBe(false)
    sign.mockResolvedValue(signed('restored'))
    await act(async () => { photo.retry() })
    expect(photo.url).toBe('restored')
    await act(async () => { photo.onImageError() })
    expect(photo.url).toBeNull()
  })

  it('never retains an old image while a renewal is stalled past expiry', async () => {
    await mount()
    sign.mockReturnValue(new Promise(() => {}))
    await act(async () => { await vi.advanceTimersByTimeAsync(360_000) })
    expect(photo.url).toBeNull()
  })

  it('stops a stalled signing request, offers retry and ignores its late response', async () => {
    let finish!: (value: ReturnType<typeof signed>) => void
    sign.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    await mount()
    expect(photo.loading).toBe(true)
    await act(async () => { await vi.advanceTimersByTimeAsync(20_000) })
    expect(photo.loading).toBe(false)
    expect(photo.url).toBeNull()
    await act(async () => { finish(signed('too-late')) })
    expect(photo.url).toBeNull()
    sign.mockResolvedValue(signed('retry-ok'))
    await act(async () => { photo.retry() })
    expect(photo.url).toBe('retry-ok')
  })

  it('discards an in-flight URL when logging out or switching accounts', async () => {
    let finish!: (value: ReturnType<typeof signed>) => void
    sign.mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    await mount()
    await act(async () => { tree.update(createElement(Probe, { userId: null })) })
    await act(async () => { finish(signed('old-account-secret')) })
    expect(photo.url).toBeNull()
    sign.mockResolvedValue(signed('new-account'))
    await act(async () => { tree.update(createElement(Probe, { userId: 'another-user' })) })
    expect(photo.url).toBe('new-account')
    await act(async () => { tree.update(createElement(Probe, { ref: 'https://evil.example/x' })) })
    expect(photo.url).toBeNull()
  })

  it('does not let an obsolete image error erase a newer photo', async () => {
    await mount()
    const oldError = photo.onImageError
    sign.mockResolvedValue(signed('new-photo'))
    await act(async () => { photo.retry() })
    await act(async () => { oldError() })
    expect(photo.url).toBe('new-photo')
  })
})
