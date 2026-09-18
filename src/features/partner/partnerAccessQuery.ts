import { queryOptions } from '@tanstack/react-query'
import { partnerRepository } from '../../repositories/partnerRepository'
import { queryKeys } from '../../services/queryKeys'

export function partnerAccessQueryOptions(userId: string | null) {
  return queryOptions({
    queryKey: queryKeys.partnerAccess(userId),
    queryFn: ({ signal }) => userId ? partnerRepository.activeAccess(userId, signal) : Promise.resolve(null),
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always'
  })
}
