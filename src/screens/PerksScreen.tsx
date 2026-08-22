import { useEffect, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { MagnifyingGlass, Storefront, Tag } from 'phosphor-react-native'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { CURRENT_MARKET_CODE } from '../lib/market'
import { colors, font, radius, space } from '../lib/theme'
import { dirStyles, useIsRTL } from '../lib/direction'
import type { BusinessRating, Partner, PartnerCategory, PartnerOffer } from '../types'
import { BusinessCard } from '../components/BusinessCard'
import { CategoryChipsRow } from '../components/CategoryChipsRow'
import { EmptyState } from '../components/EmptyState'
import { Header } from '../components/Header'
import { MembershipSheet } from '../components/MembershipSheet'
import { OfferCard } from '../components/OfferCard'
import { PlusHeroCard } from '../components/PlusHeroCard'
import { PrimaryButton } from '../components/PrimaryButton'
import { Screen } from '../components/Screen'
import { Skeleton } from '../components/Skeleton'
import { BusinessDetailView } from './BusinessDetailView'
import { OfferDetailView } from './OfferDetailView'

// Internal drill-down stack rather than a top-level App.tsx screen: offer ↔
// business navigation can go either direction an arbitrary number of times
// (open a business, open one of its offers, open THAT offer's business...),
// which a flat screen-name switch can't express without duplicating state.
// Keeping it local also means the bottom tab bar stays mounted while
// browsing, matching how the rest of this tab already behaves.
type Frame = { kind: 'discover' } | { kind: 'offer'; id: string } | { kind: 'business'; id: string }

type DiscoverData = {
  businesses: Partner[]
  offers: PartnerOffer[]
  ratings: Record<string, BusinessRating>
}

export function PerksScreen({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const dir = dirStyles(useIsRTL())
  const [stack, setStack] = useState<Frame[]>([{ kind: 'discover' }])
  const [data, setData] = useState<DiscoverData | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [category, setCategory] = useState<PartnerCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [heroSheetOpen, setHeroSheetOpen] = useState(false)

  const frame = stack[stack.length - 1]!
  function push(next: Frame) { setStack(s => [...s, next]) }
  function pop() { setStack(s => (s.length > 1 ? s.slice(0, -1) : s)) }

  async function load() {
    setLoadError(false)
    // Market-scoped: admin_upsert_business now writes market explicitly
    // (defaults to 'IL', the pilot market - see 0016_perks_plus_corrections.sql),
    // so a consumer in IL correctly gets only IL businesses. public_offers
    // has no market column of its own (offers inherit it from their
    // business), so offers are fetched only for this market's business ids
    // below rather than filtered after the fact.
    const { data: businesses, error: businessesError } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'verified')
      .eq('is_active', true)
      .eq('market', CURRENT_MARKET_CODE)
      .order('name')
    if (businessesError) {
      setLoadError(true)
      return
    }
    const businessRows = (businesses ?? []) as Partner[]
    const ids = businessRows.map(b => b.id)

    const [{ data: offers, error: offersError }, { data: ratingRows }] = await Promise.all([
      ids.length ? supabase.from('public_offers').select('*').in('partner_id', ids).order('created_at', { ascending: false }) : Promise.resolve({ data: [] as PartnerOffer[], error: null }),
      ids.length ? supabase.from('business_ratings').select('*').in('business_id', ids) : Promise.resolve({ data: [] as BusinessRating[] })
    ])
    if (offersError) {
      setLoadError(true)
      return
    }
    const offerRows = (offers ?? []) as PartnerOffer[]
    setData({ businesses: businessRows, offers: offerRows, ratings: Object.fromEntries((ratingRows ?? []).map(r => [r.business_id, r as BusinessRating])) })
  }

  useEffect(() => { load() }, [])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  const businessById = useMemo(() => Object.fromEntries((data?.businesses ?? []).map(b => [b.id, b])), [data])

  const businessHasOffer = useMemo(() => {
    const set = new Set((data?.offers ?? []).map(o => o.partner_id))
    return set
  }, [data])

  const isFiltering = category !== 'all' || search.trim().length > 0

  const filteredBusinesses = useMemo(() => {
    if (!data) return []
    const query = search.trim().toLowerCase()
    return data.businesses.filter(business => {
      if (category !== 'all' && business.category !== category) return false
      if (query && !business.name.toLowerCase().includes(query)) return false
      return true
    })
  }, [data, category, search])

  const filteredOffers = useMemo(() => {
    if (!data) return []
    const query = search.trim().toLowerCase()
    return data.offers.filter(offer => {
      const business = businessById[offer.partner_id]
      if (category !== 'all' && business?.category !== category) return false
      if (query && !offer.title.toLowerCase().includes(query) && !business?.name.toLowerCase().includes(query)) return false
      return true
    })
  }, [data, category, search, businessById])

  if (frame.kind === 'offer') {
    return <OfferDetailView offerId={frame.id} userId={userId} onBack={pop} onOpenBusiness={id => push({ kind: 'business', id })} />
  }
  if (frame.kind === 'business') {
    return <BusinessDetailView businessId={frame.id} onBack={pop} onOpenOffer={id => push({ kind: 'offer', id })} />
  }

  return (
    <View style={styles.fill}>
      <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.forest} />}>
        <Header title={t('perks.title')} subtitle={t('perks.subtitle')} />

        <View style={[styles.searchWrap, dir.row]}>
          <MagnifyingGlass size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('perks.searchPlaceholder')}
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, dir.textStart]}
          />
        </View>

        <PlusHeroCard onPress={() => setHeroSheetOpen(true)} />

        <Text style={[styles.sectionTitle, dir.textStart, styles.categoriesTitle]}>{t('perks.categoriesTitle')}</Text>
        <CategoryChipsRow selected={category} onSelect={setCategory} />

        {loadError ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{t('perks.errors.loadFailed')}</Text>
            <PrimaryButton title={t('common.retry')} onPress={load} />
          </View>
        ) : data === null ? (
          <DiscoverSkeleton />
        ) : isFiltering ? (
          <FilteredResults
            offers={filteredOffers}
            businesses={filteredBusinesses}
            businessById={businessById}
            ratings={data.ratings}
            onOpenOffer={id => push({ kind: 'offer', id })}
            onOpenBusiness={id => push({ kind: 'business', id })}
          />
        ) : (
          <>
            <SectionHeader title={t('perks.offersTitle')} />
            {data.offers.length === 0 ? (
              <EmptyState Icon={Tag} title={t('perks.empty.offersTitle')} message={t('perks.empty.offersMessage')} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.rail, dir.row]}>
                {data.offers.map(offer => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    business={businessById[offer.partner_id]}
                    rating={data.ratings[offer.partner_id]}
                    onPress={() => push({ kind: 'offer', id: offer.id })}
                  />
                ))}
              </ScrollView>
            )}

            <SectionHeader title={t('perks.businessesTitle')} />
            {data.businesses.length === 0 ? (
              <EmptyState Icon={Storefront} title={t('perks.empty.businessesTitle')} message={t('perks.empty.businessesMessage')} />
            ) : (
              <View style={styles.businessList}>
                {data.businesses.map(business => (
                  <BusinessCard
                    key={business.id}
                    business={business}
                    rating={data.ratings[business.id]}
                    hasOffer={businessHasOffer.has(business.id)}
                    onPress={() => push({ kind: 'business', id: business.id })}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </Screen>

      {/* Sibling of Screen, not a child - Gorhom's BottomSheet renders an
          always-mounted (even while closed) absolutely-positioned overlay
          that expects to sit at the root of the view tree. Nesting it
          inside Screen's own ScrollView content (as it was before) put
          that overlay inside a scrollable container, which on a real
          Android device intercepted touches for every interactive child
          rendered before it in the same ScrollView - search input,
          category chips, offer/business cards - even though the sheet was
          closed and invisible, and even though ScrollView panning still
          worked. Matches the already-correct sibling placement used in
          OfferDetailView. */}
      <MembershipSheet visible={heroSheetOpen} onClose={() => setHeroSheetOpen(false)} />
    </View>
  )
}

function SectionHeader({ title }: { title: string }) {
  const dir = dirStyles(useIsRTL())
  return <Text style={[styles.sectionTitle, dir.textStart]}>{title}</Text>
}

function FilteredResults({
  offers,
  businesses,
  businessById,
  ratings,
  onOpenOffer,
  onOpenBusiness
}: {
  offers: PartnerOffer[]
  businesses: Partner[]
  businessById: Record<string, Partner>
  ratings: Record<string, BusinessRating>
  onOpenOffer: (id: string) => void
  onOpenBusiness: (id: string) => void
}) {
  const { t } = useTranslation()

  if (offers.length === 0 && businesses.length === 0) {
    return <EmptyState Icon={MagnifyingGlass} title={t('perks.empty.searchTitle')} message={t('perks.empty.searchMessage')} />
  }

  return (
    <View style={styles.filteredWrap}>
      {offers.length > 0 ? (
        <View style={styles.filteredSection}>
          <SectionHeader title={t('perks.offersTitle')} />
          <View style={styles.businessList}>
            {offers.map(offer => (
              <OfferCard key={offer.id} offer={offer} business={businessById[offer.partner_id]} rating={ratings[offer.partner_id]} variant="list" onPress={() => onOpenOffer(offer.id)} />
            ))}
          </View>
        </View>
      ) : null}

      {businesses.length > 0 ? (
        <View style={styles.filteredSection}>
          <SectionHeader title={t('perks.businessesTitle')} />
          <View style={styles.businessList}>
            {businesses.map(business => (
              <BusinessCard key={business.id} business={business} rating={ratings[business.id]} onPress={() => onOpenBusiness(business.id)} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
}

function DiscoverSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <Skeleton width="100%" height={130} radius={radius.lg} />
      <View style={styles.skeletonRail}>
        <Skeleton width={220} height={200} radius={radius.lg} />
        <Skeleton width={220} height={200} radius={radius.lg} />
      </View>
      <Skeleton width="100%" height={80} radius={radius.lg} />
      <Skeleton width="100%" height={80} radius={radius.lg} />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  searchWrap: { alignItems: 'center', gap: space.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: space.md, marginBottom: space.lg },
  searchInput: { flex: 1, color: colors.text, fontFamily: font.regular, fontSize: 14.5, paddingVertical: 12 },

  categoriesTitle: { marginTop: space.lg },
  sectionTitle: { color: colors.text, fontFamily: font.extraBold, fontSize: 17, marginTop: space.xl, marginBottom: space.md },

  rail: { gap: space.md, paddingEnd: space.lg },
  businessList: { gap: space.md },

  filteredWrap: { gap: space.lg },
  filteredSection: { gap: 0 },

  skeletonWrap: { gap: space.md, marginTop: space.lg },
  skeletonRail: { flexDirection: 'row', gap: space.md },

  errorWrap: { alignItems: 'center', gap: space.md, paddingVertical: space.xxl },
  errorText: { color: colors.muted, fontFamily: font.medium, fontSize: 13.5, textAlign: 'center' }
})
