import { describe, expect, it, vi } from 'vitest'
import { requestPhotoPath, signRequestPhoto } from '../../shared/requestPhotos'

const base = 'https://zmpwdufahjmlxfwzafvr.supabase.co'
const path = '00000000-0000-0000-0000-000000000001/1730000000.jpg'
const legacy = `${base}/storage/v1/object/public/request-photos/${path}`

describe('request photo references', () => {
  it('resolves existing public references and new object paths without fetching either URL', () => {
    expect(requestPhotoPath(legacy, base)).toBe(path)
    expect(requestPhotoPath(path, `${base}/`)).toBe(path)
  })

  it.each([
    null, '', 'https://evil.example/photo.jpg', legacy.replace(base, 'https://other.supabase.co'),
    legacy.replace('request-photos/', 'avatars/'), `${legacy}?download=1`, `${legacy}#x`,
    legacy.replace('/1730000000.jpg', '/../secret.jpg'), legacy.replace('/1730000000.jpg', '/%2e%2e/secret.jpg'),
    `../${path}`, `/${path}`, path.replace('/', '//'), path.replace('/', '/./'),
    `data:image/jpeg;base64,a`, `file:///${path}`, path.replace('.jpg', '.jpg%3Ftoken=secret')
  ])('rejects an unsafe or foreign reference: %s', reference => {
    expect(requestPhotoPath(reference, base)).toBeNull()
  })

  it('signs only the extracted object path for five minutes', async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: 'signed-only' }, error: null })
    const from = vi.fn().mockReturnValue({ createSignedUrl })
    expect(await signRequestPhoto({ storage: { from } }, base, legacy)).toMatchObject({ url: 'signed-only' })
    expect(from).toHaveBeenCalledWith('request-photos')
    expect(createSignedUrl).toHaveBeenCalledWith(path, 300)
  })

  it('fails closed without exposing storage details or falling back to the old URL', async () => {
    const from = vi.fn().mockReturnValue({ createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: { message: 'private-path-or-token' } }) })
    await expect(signRequestPhoto({ storage: { from } }, base, legacy)).rejects.toThrow('Request photo unavailable')
    from.mockClear()
    await expect(signRequestPhoto({ storage: { from } }, base, 'https://evil.example/x')).rejects.toThrow('Request photo unavailable')
    expect(from).not.toHaveBeenCalled()
  })
})
