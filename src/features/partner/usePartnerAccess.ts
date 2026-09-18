import { useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../providers/AuthProvider'
import { partnerAccessQueryOptions } from './partnerAccessQuery'
import { resolvePartnerAccessState } from './partnerAccessState'

export function usePartnerAccess() {
  const { session, isRestricted, loading } = useAuth()
  const userId = session?.user.id ?? null
  const query = useQuery({ ...partnerAccessQueryOptions(userId), enabled: !!userId && !isRestricted && !loading })
  const { refetch } = query
  useFocusEffect(useCallback(() => {
    if (userId && !isRestricted && !loading) void refetch()
  }, [userId, isRestricted, loading, refetch]))

  const state = resolvePartnerAccessState({
    userId, restricted: isRestricted, loading: loading || query.isPending,
    fetching: query.isFetching, failed: query.isError, data: query.data
  })
  return { ...state, refetch }
}
