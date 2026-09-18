import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { partnerAccessRepository } from './partnerAccessRepository'

export function useUserPartnerAccess(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-partner-access', userId],
    queryFn: () => partnerAccessRepository.get(userId!),
    enabled: !!userId
  })
}

export function usePartnerAccessMutations(userId: string) {
  const queryClient = useQueryClient()
  const options = {
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-partner-access', userId] }),
        queryClient.invalidateQueries({ queryKey: ['user', userId] }),
        queryClient.invalidateQueries({ queryKey: ['audit-log'] })
      ])
    },
    onError: (error: Error) => toast.error(error.message)
  }
  const save = useMutation({ mutationFn: partnerAccessRepository.set, ...options })
  const revoke = useMutation({ mutationFn: partnerAccessRepository.revoke, ...options })
  return { save, revoke }
}
