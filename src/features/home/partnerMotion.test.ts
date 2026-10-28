import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = path.dirname(fileURLToPath(import.meta.url))
const read = (file: string) => readFileSync(path.join(here, file), 'utf8')

// Android shows the same partner / home layout as the iPhone 2.0.4 build. These guards catch the two quiet ways that
// breaks: a scene pointing at a file that is not in the repo, and the Android home going back to the old layout.
describe('Android partner home', () => {
  it('only requires video and poster files that exist', () => {
    const paths = [...read('PartnerMotion.tsx').matchAll(/require\('([^']+)'\)/g)].map(match => match[1]!)
    expect(paths.length).toBe(6)
    for (const file of paths) expect(existsSync(path.resolve(here, file)), file).toBe(true)
  })

  it('is the shared home screen, with the previous layout kept as LegacyHomeScreen', () => {
    const home = read('HomeScreen.tsx')
    expect(home).toMatch(/export function HomeScreen\(\) \{\s*return <PartnerHomeScreen \/>/)
    expect(home).toContain('export function LegacyHomeScreen()')
  })

  it('keeps the partner form memory-only (no network or storage calls)', () => {
    const form = read('PartnerEnrollment.tsx')
    for (const forbidden of ['fetch(', 'supabase', 'AsyncStorage', 'XMLHttpRequest']) expect(form).not.toContain(forbidden)
  })
})
