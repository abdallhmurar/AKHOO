import { useCallback, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { ClockCounterClockwise, CheckCircle, Ticket } from 'phosphor-react-native'
import { useQuery } from '@tanstack/react-query'
import { useFocusEffect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppScreen } from '../../components/v2'
import { Skeleton } from '../../components/ui'
import { GuideTarget, useGuidePage } from '../guide/GuideProvider'
import { useAuth } from '../../providers'
import { rewardRepository } from '../../repositories/rewardRepository'
import { mobileHubRepository, type HubOffers } from '../../repositories/mobileHubRepository'
import { localizeContent, BUSINESS_TEXT_FIELDS, OFFER_TEXT_FIELDS } from '../../../shared/contentTranslations'
import type { Partner, PartnerOffer } from '../../types'
import { computeOfferPriceDisplay, formatPrice } from '../../lib/offerPricing'
import { CURRENT_MARKET } from '../../lib/market'
import { offersWithinBalance } from './model'
import { HubAction, HubHeader, HubNotice, HubTabs, PointsWallet, ui, useHubStyle } from './ui'

export type BenefitsProps = { balance: number | null; data?: HubOffers; loading?: boolean; error?: boolean; balanceError?: boolean; onRetry: () => void; onHistory: () => void; onOffer: (id: string) => void }

export function BenefitsScreen() {
  const { session } = useAuth(), router = useRouter()
  const points = useQuery({ queryKey: ['community', 'points', session?.user.id], queryFn: () => rewardRepository.points(session!.user.id), enabled: !!session })
  const offers = useQuery({ queryKey: ['community', 'hub-offers'], queryFn: mobileHubRepository.offers })
  const { refetch: refetchPoints } = points, { refetch: refetchOffers } = offers
  const userId = session?.user.id
  useFocusEffect(useCallback(() => { if (userId) void refetchPoints(); void refetchOffers() }, [userId, refetchPoints, refetchOffers]))
  useGuidePage('perks', points.isSuccess && offers.isSuccess)
  return <BenefitsView balance={points.isSuccess ? points.data.balance : null} data={offers.data} loading={offers.isLoading} error={offers.isError} balanceError={points.isError} onRetry={() => { void points.refetch(); void offers.refetch() }} onHistory={() => router.push({ pathname: '/(tabs)/activity', params: { view: 'points' } })} onOffer={offerId => router.push({ pathname: '/community/offer/[offerId]', params: { offerId } })} />
}

export function BenefitsView({ balance, data, loading, error, balanceError, onRetry, onHistory, onOffer }: BenefitsProps) {
  const h = useHubStyle(), { t } = useTranslation()
  const [filter, setFilter] = useState<'affordable' | 'all'>('affordable')
  const offers = offersWithinBalance(data?.offers ?? [], balance, filter === 'affordable')
  return <AppScreen background={h.background} contentStyle={ui.content}>
    <HubHeader title={t('perks.title')} actionLabel={t('mobileHub.pointsHistory')} onAction={onHistory} icon={<ClockCounterClockwise size={23} color={h.theme.colors.textPrimary} />} />
    <GuideTarget id="perks.points">{balance !== null ? <PointsWallet balance={balance} /> : balanceError ? <HubNotice><Text style={h.body}>{t('mobileHub.balanceError')}</Text><HubAction label={t('perks.retry')} onPress={onRetry} subtle /></HubNotice> : <Skeleton height={210} />}</GuideTarget>
    <View style={styles.section}><Text accessibilityRole="header" style={h.heading}>{t('mobileHub.chooseReward')}</Text><HubTabs value={balance === null ? 'all' : filter} onChange={setFilter} disabled={balance === null} options={[{ value: 'affordable', label: t('mobileHub.withPoints') }, { value: 'all', label: t('mobileHub.allOffers') }]} /></View>
    <GuideTarget id="perks.offers"><View style={styles.section}>
      {loading ? <Skeleton height={295} /> : error ? <HubNotice><Text style={h.body}>{t('mobileHub.offersError')}</Text><HubAction label={t('perks.retry')} onPress={onRetry} subtle /></HubNotice> : offers.length ? offers.map(offer => <RewardTicket key={offer.id} offer={offer} business={offer.partner_id ? data?.partnersById[offer.partner_id] : undefined} balance={balance} onPress={() => onOffer(offer.id)} />) : <HubNotice><Ticket size={32} color={h.theme.colors.primary} /><Text style={h.heading}>{t(filter === 'affordable' && data?.offers.length ? 'mobileHub.noAffordable' : 'perks.empty.offersTitle')}</Text><Text style={h.small}>{t(filter === 'affordable' && data?.offers.length ? 'mobileHub.keepHelping' : 'perks.empty.offersMessage')}</Text>{filter === 'affordable' && !!data?.offers.length ? <HubAction label={t('mobileHub.allOffers')} onPress={() => setFilter('all')} /> : null}</HubNotice>}
    </View></GuideTarget>
    {!!data?.offers.length && filter === 'affordable' && offers.length < data.offers.length ? <HubAction label={t('mobileHub.moreRewards')} subtle onPress={() => setFilter('all')} /> : null}
  </AppScreen>
}

function RewardTicket({ offer: originalOffer, business: originalBusiness, balance, onPress }: { offer: PartnerOffer; business?: Partner; balance: number | null; onPress: () => void }) {
  const h = useHubStyle(), { t, i18n } = useTranslation()
  const offer = localizeContent(originalOffer, i18n.language, OFFER_TEXT_FIELDS)
  const business = originalBusiness ? localizeContent(originalBusiness, i18n.language, BUSINESS_TEXT_FIELDS) : undefined
  const uri = offer.image_urls?.[0] || offer.image_url || business?.logo_url
  const [failedUri, setFailedUri] = useState<string>()
  const cost = Math.max(offer.points_required ?? 0, 0)
  const enough = balance !== null && balance >= cost
  const price = computeOfferPriceDisplay(offer)
  const priceLabel = price.kind === 'free_benefit' ? t('perks.offer.free') : price.offerPrice !== null ? formatPrice(price.offerPrice, CURRENT_MARKET.currencySymbol) : price.kind === 'percentage' ? `${price.percent}%` : price.kind === 'fixed' ? formatPrice(price.amountOff, CURRENT_MARKET.currencySymbol) : null
  return <View style={[styles.ticket, { backgroundColor: h.theme.colors.surface, borderColor: h.theme.colors.border }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={t('perks.offerDetailsFor', { title: offer.title })} onPress={onPress} style={[styles.media, { backgroundColor: h.theme.colors.primarySoft }]}>{uri && failedUri !== uri ? <Image source={{ uri }} onError={() => setFailedUri(uri)} resizeMode="contain" style={styles.image} accessible={false} /> : <Ticket size={72} weight="duotone" color={h.theme.colors.primary} />}{enough ? <View style={[styles.available, h.row, { backgroundColor: h.theme.colors.communitySoft }]}><CheckCircle size={17} weight="fill" color={h.theme.colors.community} /><Text style={[h.small, { color: h.theme.colors.community }]}>{t(cost === 0 ? 'perks.noPoints' : 'mobileHub.balanceCovers')}</Text></View> : null}</Pressable>
    <View pointerEvents="none" style={[styles.cutout, { left: -10, backgroundColor: h.background, borderColor: h.theme.colors.border }]} /><View pointerEvents="none" style={[styles.cutout, { right: -10, backgroundColor: h.background, borderColor: h.theme.colors.border }]} />
    <View style={styles.ticketBody}>
      <Text style={h.small}>{business?.name ?? t('mobileHub.fromPartners')}</Text><Text accessibilityRole="header" style={h.heading}>{offer.title}</Text>
      {offer.member_only ? <Text style={[h.small, { color: h.theme.colors.community }]}>{t('mobileHub.membersOnly')}</Text> : null}
      <View style={[h.row, styles.costRow]}><View style={[styles.cost, h.row, { backgroundColor: h.theme.colors.primarySoft }]}><Ticket size={20} weight="fill" color={h.theme.colors.primary} /><Text style={[h.body, { color: h.theme.colors.primary }]}>{cost ? `${cost.toLocaleString()} ${t('perks.pointsUnit')}` : t('perks.noPoints')}</Text></View><Text style={[h.small, ui.flex]}>{t('mobileHub.redemptionCost')}</Text>{priceLabel ? <Text style={[h.body, { color: h.theme.colors.community }]}>{priceLabel}</Text> : null}</View>
      <HubAction label={t('mobileHub.details')} onPress={onPress} />
    </View>
  </View>
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  ticket: { borderWidth: 1, borderRadius: 24, padding: 7, overflow: 'hidden' },
  media: { height: 148, width: '100%', borderRadius: 18, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  available: { position: 'absolute', top: 10, left: 10, gap: 5, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 18 },
  cutout: { position: 'absolute', top: 145, height: 21, width: 21, borderRadius: 12, borderWidth: 1 },
  ticketBody: { padding: 10, gap: 9 },
  costRow: { flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  cost: { gap: 5, alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
})
