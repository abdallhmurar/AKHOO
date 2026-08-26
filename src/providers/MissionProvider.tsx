import { createContext, useContext, useEffect, useMemo } from 'react'
import type { PropsWithChildren } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { missionRepository } from '../repositories/missionRepository'
import type { Mission } from '../repositories/domainTypes'
import { queryKeys } from '../services/queryKeys'
import { useAuth } from './AuthProvider'

type MissionContextValue = {
  activeMission: Mission | null
  loading: boolean
  isRequester: boolean
  isHelper: boolean
  refresh: () => Promise<unknown>
}

const MissionContext = createContext<MissionContextValue | null>(null)

export function MissionProvider({ children }: PropsWithChildren) {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const userId = session?.user.id
  const query = useQuery({
    queryKey: userId ? queryKeys.activeMission(userId) : ['missions', 'active', 'signed-out'],
    queryFn: () => missionRepository.getActive(userId!),
    enabled: !!userId,
    refetchInterval: 30_000
  })

  useEffect(() => {
    const missionId = query.data?.id
    if (!missionId || !userId) return
    return missionRepository.subscribe(missionId, () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activeMission(userId) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.mission(missionId) })
    })
  }, [query.data?.id, userId, queryClient])

  const value = useMemo<MissionContextValue>(() => ({
    activeMission: query.data ?? null,
    loading: query.isLoading,
    isRequester: !!query.data && query.data.requester_id === userId,
    isHelper: !!query.data && query.data.helper_id === userId,
    refresh: query.refetch
  }), [query.data, query.isLoading, query.refetch, userId])
  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>
}

export function useMission() {
  const context = useContext(MissionContext)
  if (!context) throw new Error('useMission must be used inside MissionProvider')
  return context
}
