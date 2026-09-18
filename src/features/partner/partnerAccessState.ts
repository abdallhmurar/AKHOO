import type { PartnerAccess } from '../../types'

export type PartnerAccessState =
  | { status: 'checking' | 'denied' | 'error'; access: null }
  | { status: 'authorized'; access: PartnerAccess }

export function resolvePartnerAccessState({ userId, restricted, loading, fetching, failed, data }: {
  userId: string | null
  restricted: boolean
  loading: boolean
  fetching: boolean
  failed: boolean
  data: PartnerAccess | null | undefined
}): PartnerAccessState {
  if (!userId || restricted) return { status: 'denied', access: null }
  // Never render cached business context while re-checking permissions, or
  // after a failed refetch (React Query deliberately retains old data).
  if (loading || fetching) return { status: 'checking', access: null }
  if (failed) return { status: 'error', access: null }
  if (!data?.is_active || data.user_id !== userId || !['owner', 'staff'].includes(data.role)) {
    return { status: 'denied', access: null }
  }
  return { status: 'authorized', access: data }
}
