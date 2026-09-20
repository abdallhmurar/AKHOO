import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { OfferRedemption, PointAdjustment, RedemptionStatus, VolunteerPointTransaction } from '@/types'

export type PointsEntry =
  | { kind: 'mission'; id: string; points: number; createdAt: string }
  | { kind: 'adjustment'; id: string; points: number; reason: string; createdAt: string }
  | { kind: 'redemption'; id: string; points: number; offerTitle: string | null; status: RedemptionStatus; counts: boolean; createdAt: string }

export function useUserPoints(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-points', userId],
    enabled: !!userId,
    queryFn: async () => {
      const [balanceRes, missionsRes, adjustmentsRes, redemptionsRes] = await Promise.all([
        supabase.rpc('get_points_balance', { p_user_id: userId! }),
        supabase.from('volunteer_point_transactions').select('*').eq('volunteer_id', userId!),
        supabase.from('point_adjustments').select('*').eq('user_id', userId!),
        supabase.from('offer_redemptions').select('*').eq('user_id', userId!)
      ])
      for (const res of [balanceRes, missionsRes, adjustmentsRes, redemptionsRes]) if (res.error) throw res.error

      const missions = (missionsRes.data ?? []) as VolunteerPointTransaction[]
      const adjustments = (adjustmentsRes.data ?? []) as PointAdjustment[]
      // Redemptions that cost no points have nothing to show here.
      const redemptions = ((redemptionsRes.data ?? []) as OfferRedemption[]).filter(r => r.points_spent > 0)

      const titles = new Map<string, string>()
      const offerIds = [...new Set(redemptions.map(r => r.offer_id))]
      if (offerIds.length > 0) {
        const { data } = await supabase.from('partner_offers').select('id, title').in('id', offerIds)
        for (const o of data ?? []) titles.set(o.id, o.title)
      }

      // `balance` is the one authoritative number (get_points_balance - the
      // same one the app and redemptions use). "Used on offers" is derived
      // from it rather than re-implementing which redemption states count.
      const balance = balanceRes.data as number
      const earned = missions.reduce((sum, m) => sum + m.points, 0)
      const adjusted = adjustments.reduce((sum, a) => sum + a.points, 0)
      const spent = earned + adjusted - balance

      const now = Date.now()
      const entries: PointsEntry[] = [
        ...missions.map(m => ({ kind: 'mission' as const, id: m.id, points: m.points, createdAt: m.created_at })),
        ...adjustments.map(a => ({ kind: 'adjustment' as const, id: a.id, points: a.points, reason: a.reason, createdAt: a.created_at })),
        ...redemptions.map(r => ({
          kind: 'redemption' as const,
          id: r.id,
          points: -r.points_spent,
          offerTitle: titles.get(r.offer_id) ?? null,
          status: r.status,
          counts: r.status === 'redeemed' || (r.status === 'pending' && new Date(r.expires_at).getTime() > now),
          createdAt: r.created_at
        }))
      ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

      return { balance, earned, adjusted, spent, entries }
    }
  })
}

export function useAdjustPoints() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, points, reason }: { userId: string; points: number; reason: string }) => {
      const { data, error } = await supabase.rpc('admin_adjust_points', { p_user_id: userId, p_points: points, p_reason: reason })
      if (error) throw error
      return data as number
    },
    onSuccess: (_balance, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user-points', userId] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['audit-log'] })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}
