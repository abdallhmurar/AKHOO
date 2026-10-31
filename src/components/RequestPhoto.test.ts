import { createElement, type ElementType } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RequestPhoto } from './RequestPhoto'

const mocks = vi.hoisted(() => ({ sign: vi.fn(), auth: { status: 'signed-in', session: { user: { id: 'owner' } } } }))
vi.mock('react-native', () => ({ Image: 'Image', View: 'View', Text: 'Text', Pressable: 'Pressable', ActivityIndicator: 'ActivityIndicator', StyleSheet: { create: (value: unknown) => value } }))
vi.mock('../providers/AuthProvider', () => ({ useAuth: () => mocks.auth }))
vi.mock('../lib/supabase', () => ({ supabase: { storage: { from: () => ({ createSignedUrl: mocks.sign }) } } }))
vi.mock('../lib/theme', () => ({ useSanadTheme: () => ({ colors: {} }) }))
vi.mock('../lib/typography', () => ({ useAppTypography: () => ({ caption: {} }) }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'ar' } }) }))

const base = 'https://example.supabase.co'
const reference = `${base}/storage/v1/object/public/request-photos/00000000-0000-0000-0000-000000000001/photo.jpg`
const host = (name: string) => name as ElementType
let tree: ReactTestRenderer
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', base)
  mocks.auth.status = 'signed-in'
  mocks.sign.mockReset()
})
afterEach(async () => {
  await act(async () => tree?.unmount())
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('request photo renderer', () => {
  it('renders only a signed image and clears it on sign-out', async () => {
    mocks.sign.mockResolvedValue({ data: { signedUrl: 'https://signed.example/photo' }, error: null })
    await act(async () => { tree = create(createElement(RequestPhoto, { reference, resizeMode: 'contain' })) })
    expect(tree.root.findByType(host('Image')).props.source.uri).toBe('https://signed.example/photo')
    expect(tree.root.findByType(host('Image')).props.resizeMode).toBe('contain')
    mocks.auth.status = 'signed-out'
    await act(async () => tree.update(createElement(RequestPhoto, { reference })))
    expect(tree.toJSON()).toBeNull()
  })

  it('shows a retry instead of a broken/public image after permission or image-loading failure', async () => {
    mocks.sign.mockResolvedValue({ data: null, error: new Error('denied') })
    await act(async () => { tree = create(createElement(RequestPhoto, { reference })) })
    expect(tree.root.findAllByType(host('Image'))).toHaveLength(0)
    mocks.sign.mockResolvedValue({ data: { signedUrl: 'signed' }, error: null })
    await act(async () => tree.root.findByType(host('Pressable')).props.onPress())
    expect(tree.root.findByType(host('Image')).props.source.uri).toBe('signed')
    await act(async () => tree.root.findByType(host('Image')).props.onError())
    expect(tree.root.findAllByType(host('Image'))).toHaveLength(0)
    expect(tree.root.findByType(host('Pressable')).props.accessibilityRole).toBe('button')
  })
})
