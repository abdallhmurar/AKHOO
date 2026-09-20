import { queryOptions } from '@tanstack/react-query'

export function adminQueryOptions(userId: string | null, check: () => Promise<boolean>) {
  return queryOptions({
    queryKey: ['is-admin', userId],
    queryFn: check,
    enabled: !!userId,
    staleTime: 0,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true as const
  })
}
