/** Minimal Vitest bridge for pure token and direction tests. */
export const Platform = { OS: 'web' } as const

export function useColorScheme() {
  return 'light' as const
}
