import { requestRepository } from './requestRepository'
import { rewardRepository } from './rewardRepository'
import type { ServiceType } from '../types'

export type ActivityEntry = {
  id: string
  type: 'received' | 'given' | 'points'
  serviceType?: ServiceType
  note?: string | null
  locationLabel?: string | null
  status: string
  occurredAt: string
  points?: number
  pointsReason?: 'completed_verified_mission'
  missionId?: string
}

export const activityRepository = {
  async list(userId: string): Promise<ActivityEntry[]> {
    const [received, given, points] = await Promise.all([
      requestRepository.listForRequester(userId),
      requestRepository.listForHelper(userId),
      rewardRepository.points(userId)
    ])
    return [
      ...received.map(request => ({ id: `received-${request.id}`, type: 'received' as const, serviceType: request.service_type, note: request.note, locationLabel: request.location_label ?? null, status: request.status, occurredAt: request.created_at, missionId: request.id })),
      ...given.map(request => ({ id: `given-${request.id}`, type: 'given' as const, serviceType: request.service_type, note: request.note, locationLabel: request.location_label ?? null, status: request.status, occurredAt: request.created_at, missionId: request.id })),
      ...points.transactions.map(row => ({ id: `points-${row.id}`, type: 'points' as const, status: 'earned', occurredAt: row.created_at, points: row.points, pointsReason: row.reason, missionId: row.request_id }))
    ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  }
}
