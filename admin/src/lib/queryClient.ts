import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000
    }
  }
})

// Any data query that hits a permission-denied error (defense in depth -
// every table read is independently RLS-gated by public.is_admin()) forces
// an immediate is-admin re-check instead of waiting out its 5-minute
// staleTime, so a revoked admin loses access within one failed request
// rather than up to 5 minutes later.
export function invalidateAdminCheck() {
  queryClient.invalidateQueries({ queryKey: ['is-admin'] })
}
