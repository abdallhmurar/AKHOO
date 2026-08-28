import type { HelpRequest } from '../types'

export type MissionStatus =
  | 'matching'
  | 'assigned'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export type Mission = {
  id: string
  request_id: string
  requester_id: string
  helper_id: string | null
  status: MissionStatus
  accepted_at: string | null
  started_at: string | null
  arrived_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
  request?: HelpRequest | null
  source: 'v2' | 'legacy'
}
