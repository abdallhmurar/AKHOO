import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// The OAuth return link is akhoo://auth-callback (src/repositories/authRepository.ts). Without a route of that name,
// Android showed "Unmatched Route" after Google sign-in.
describe('auth callback deep link', () => {
  it('has a route that sends the user to the start screen', () => {
    const file = path.join(root, 'app/auth-callback.tsx')
    expect(existsSync(file)).toBe(true)
    expect(readFileSync(file, 'utf8')).toContain('<Redirect href="/" />')
  })

  it('matches the redirect URL the sign-in code uses', () => {
    expect(readFileSync(path.join(root, 'src/repositories/authRepository.ts'), 'utf8')).toContain("'akhoo://auth-callback'")
  })
})
