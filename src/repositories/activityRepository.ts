import { requestRepository } from './requestRepository'
import { rewardRepository } from './rewardRepository'

export type ActivityEntry = {
  id: string
  type: 'received' | 'given' | 'points'
  title: string
  status: string
  occurredAt: string
  points?: number
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
      ...received.map(request => ({ id: `received-${request.id}`, type: 'received' as const, title: request.note || request.service_type, status: request.status, occurredAt: request.created_at, missionId: request.id })),
      ...given.map(request => ({ id: `given-${request.id}`, type: 'given' as const, title: request.note || request.service_type, status: request.status, occurredAt: request.created_at, missionId: request.id })),
      ...points.transactions.map(row => ({ id: `points-${row.id}`, type: 'points' as const, title: row.reason, status: 'earned', occurredAt: row.created_at, points: row.points, missionId: row.request_id }))
    ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
  }
}
