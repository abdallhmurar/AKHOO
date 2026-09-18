import { supabase } from '../../lib/supabase'

export type PartnerRole = 'owner' | 'staff'
export type PartnerUser = {
  id: string
  user_id: string
  partner_id: string
  role: PartnerRole
  is_active: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  partner: { name: string }
}
export type PartnerAccessInput = { userId: string; partnerId: string; role: PartnerRole; isActive: boolean }

export const partnerAccessRepository = {
  async get(userId: string): Promise<PartnerUser | null> {
    const { data, error } = await supabase.from('partner_users')
      .select('*, partner:partners!partner_id(name)').eq('user_id', userId).maybeSingle()
    if (error) throw error
    return data as PartnerUser | null
  },
  async set({ userId, partnerId, role, isActive }: PartnerAccessInput) {
    const { error } = await supabase.rpc('admin_set_partner_access', {
      p_user_id: userId, p_partner_id: partnerId, p_role: role, p_is_active: isActive
    })
    if (error) throw error
  },
  async revoke(userId: string) {
    const { error } = await supabase.rpc('admin_revoke_partner_access', { p_user_id: userId })
    if (error) throw error
  }
}
