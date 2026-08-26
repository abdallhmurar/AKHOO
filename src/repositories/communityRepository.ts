import { supabase } from '../lib/supabase'
import { throwIfError } from '../services/errors'
import type { BusinessPhoto, BusinessRating, Membership, Partner, PartnerOffer, Review } from '../types'

export type BusinessDetail = Partner & { photos: BusinessPhoto[]; rating: BusinessRating | null; offers: PartnerOffer[]; reviews: Review[] }

export const communityRepository = {
  async businesses(market = 'IL'): Promise<Partner[]> {
    const { data, error } = await supabase.from('partners').select('*').eq('market', market).eq('status', 'verified').eq('is_active', true).order('name')
    throwIfError(error, { domain: 'community', operation: 'businesses' })
    return (data ?? []) as Partner[]
  },

  async business(id: string): Promise<BusinessDetail | null> {
    const businessResult = await supabase.from('partners').select('*').eq('id', id).eq('is_active', true).maybeSingle()
    throwIfError(businessResult.error, { domain: 'community', operation: 'business' })
    if (!businessResult.data) return null
    const [photos, ratings, offers, reviews] = await Promise.all([
      supabase.from('business_photos').select('*').eq('business_id', id).order('sort_order'),
      supabase.from('business_ratings').select('*').eq('business_id', id).maybeSingle(),
      supabase.from('partner_offers').select('*').eq('partner_id', id).eq('status', 'approved').order('created_at', { ascending: false }),
      supabase.from('reviews').select('*').eq('business_id', id).eq('is_hidden', false).order('created_at', { ascending: false }).limit(20)
    ])
    throwIfError(photos.error, { domain: 'community', operation: 'business-photos' })
    // business_ratings may be a view and is optional on older deployments.
    const rating = ratings.error ? null : ratings.data as BusinessRating | null
    throwIfError(offers.error, { domain: 'community', operation: 'business-offers' })
    throwIfError(reviews.error, { domain: 'community', operation: 'business-reviews' })
    return {
      ...(businessResult.data as Partner),
      photos: (photos.data ?? []) as BusinessPhoto[],
      rating,
      offers: (offers.data ?? []) as PartnerOffer[],
      reviews: (reviews.data ?? []) as Review[]
    }
  },

  async offers(market = 'IL'): Promise<PartnerOffer[]> {
    const { data, error } = await supabase.from('partner_offers').select('*, partner:partners!inner(*)').eq('status', 'approved').eq('partners.market', market).eq('partners.is_active', true).order('created_at', { ascending: false })
    throwIfError(error, { domain: 'community', operation: 'offers' })
    return (data ?? []) as PartnerOffer[]
  },

  async offer(id: string): Promise<PartnerOffer | null> {
    const { data, error } = await supabase.from('partner_offers').select('*, partner:partners(*)').eq('id', id).eq('status', 'approved').maybeSingle()
    throwIfError(error, { domain: 'community', operation: 'offer' })
    return data as PartnerOffer | null
  },

  async membership(userId: string): Promise<Membership | null> {
    const { data, error } = await supabase.from('memberships').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    throwIfError(error, { domain: 'community', operation: 'membership' })
    return data as Membership | null
  },

  async requestPlusMembership(market = 'jerusalem') {
    const { data, error } = await supabase.rpc('request_sanad_plus_membership', { p_market: market })
    throwIfError(error, { domain: 'community', operation: 'request-plus-membership' })
    return (Array.isArray(data) ? data[0] : data) as Membership
  },

  async redeemOffer(offerId: string) {
    const { data, error } = await supabase.rpc('redeem_offer', { p_offer_id: offerId })
    throwIfError(error, { domain: 'community', operation: 'redeem-offer' })
    return data
  }
}
