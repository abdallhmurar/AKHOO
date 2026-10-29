import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Asset } from 'expo-asset'
import { useTranslation } from 'react-i18next'
import { House, Gift, HandHeart, User } from 'phosphor-react-native'
import { BottomSheet } from '../../components/ui'
import { useThemeMode } from '../../providers/ThemeModeProvider'
import { useLanguageDirection } from '../../providers/LanguageDirectionProvider'
import type { PartnerOffer } from '../../types'
import { BenefitsView } from './BenefitsScreen'
import { ActivityView } from './ActivityScreen'
import type { ImpactData, ImpactPeriod } from './model'
import { HubAction, useHubStyle } from './ui'

const artwork = require('../../../previews/home-motion/assets/perks/sticker-offer.png')
const artworkUri = Asset.fromModule(artwork).uri
const now = new Date().toISOString()
const offer: PartnerOffer = { id: 'preview-offer', partner_id: null, title: '', description: null, discount_type: 'percentage', discount_value: 15, original_price: null, offer_price: null, image_url: artworkUri, member_only: false, points_required: 200, weekly_slot: 1, valid_from: null, valid_until: null, terms: null, status: 'approved', created_at: now, updated_at: now }
const month: ImpactData = { completed: 12, received: 1, earned: 320, historyLimited: false, entries: [
  { id: 'sample-battery', type: 'given', serviceType: 'battery', status: 'completed', occurredAt: now, points: 20, missionId: 'preview' },
  { id: 'sample-tire', type: 'given', serviceType: 'tire', status: 'completed', occurredAt: new Date(Date.now() - 86400000).toISOString(), points: 20, missionId: 'preview' },
  { id: 'sample-fuel', type: 'given', serviceType: 'fuel', status: 'completed', occurredAt: new Date(Date.now() - 172800000).toISOString(), points: 20, missionId: 'preview' },
  { id: 'sample-points', type: 'points', status: 'earned', occurredAt: now, points: 20, missionId: 'preview' },
  { id: 'sample-request', type: 'received', serviceType: 'battery', status: 'completed', occurredAt: now, missionId: 'preview' },
] }

// Development-only showcase of the SAME views used by the real data containers.
// Fixtures never go to Supabase; the root route is disabled outside local web dev.
export function MobileHubPreview() {
  const { t } = useTranslation(), h = useHubStyle(), { isDark, setDark } = useThemeMode(), { setLanguage } = useLanguageDirection()
  const [tab, setTab] = useState<'community' | 'activity'>('community'), [period, setPeriod] = useState<ImpactPeriod>('month'), [state, setState] = useState<'normal' | 'empty' | 'error'>('normal'), [sheet, setSheet] = useState<'offer' | 'entry' | 'other' | null>(null), [points, setPoints] = useState(false)
  useEffect(() => { void setLanguage('ar') }, [setLanguage])
  const impact = state === 'empty' ? { completed: 0, received: 0, earned: 0, entries: [], historyLimited: false } : period === 'month' ? month : { ...month, completed: 24, received: 3, earned: 640 }
  const data = { offers: state === 'empty' ? [] : [{ ...offer, title: t('mobileHub.previewOffer') }, { ...offer, id: 'preview-locked', title: t('mobileHub.moreRewards'), points_required: 400 }], partnersById: {} }
  return <View style={[styles.page, { backgroundColor: h.background }]}>
    <View style={[styles.controls, { borderColor: h.theme.colors.border }]}><Text style={h.small}>{t('mobileHub.preview')}</Text><View style={[styles.controlsRow, h.row]}>{(['ar', 'en', 'he'] as const).map(language => <Pressable key={language} onPress={() => { void setLanguage(language) }} accessibilityRole="button" style={styles.control}><Text style={h.small}>{language.toUpperCase()}</Text></Pressable>)}<Pressable accessibilityRole="button" onPress={() => setDark(!isDark)} style={styles.control}><Text style={h.small}>{t(isDark ? 'mobileHub.light' : 'mobileHub.dark')}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setState(state === 'normal' ? 'empty' : state === 'empty' ? 'error' : 'normal')} style={styles.control}><Text style={h.small}>{t(state === 'normal' ? 'mobileHub.previewEmpty' : state === 'empty' ? 'mobileHub.previewError' : 'mobileHub.previewNormal')}</Text></Pressable></View></View>
    <View style={styles.frame}>
      {tab === 'community' ? <BenefitsView balance={state === 'error' ? null : state === 'empty' ? 0 : 320} data={data} error={state === 'error'} balanceError={state === 'error'} onRetry={() => setState('normal')} onHistory={() => { setPoints(true); setTab('activity') }} onOffer={() => setSheet('offer')} /> : <ActivityView data={impact} error={state === 'error'} period={period} onPeriod={setPeriod} onRetry={() => setState('normal')} onEntry={() => setSheet('entry')} initialFilter={points ? 'points' : undefined} />}
      <View style={[styles.dock, h.row, { backgroundColor: h.theme.colors.surface, borderColor: h.theme.colors.border }]}>{([{ key: 'home', Icon: House, label: 'navigation.home' }, { key: 'community', Icon: Gift, label: 'perks.title' }, { key: 'activity', Icon: HandHeart, label: 'activity.title' }, { key: 'account', Icon: User, label: 'navigation.account' }] as const).map(({ key, Icon, label }) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => { if (key === 'community' || key === 'activity') { setPoints(false); setTab(key) } else setSheet('other') }} style={[styles.dockItem, { backgroundColor: tab === key ? key === 'activity' ? '#087c75' : '#0875f5' : 'transparent' }]}><Icon size={25} weight="fill" color={tab === key ? '#fff' : h.theme.colors.textMuted} /><Text style={[h.small, { textAlign: 'center', color: tab === key ? '#fff' : h.theme.colors.textMuted, fontSize: 11 }]}>{t(label)}</Text></Pressable>)}</View>
    </View>
    <BottomSheet visible={sheet !== null} title={t(sheet === 'offer' ? 'mobileHub.previewDetails' : sheet === 'entry' ? 'mobileHub.previewEntry' : 'mobileHub.preview')} onClose={() => setSheet(null)}><Text style={h.body}>{t(sheet === 'offer' ? 'mobileHub.previewBody' : sheet === 'entry' ? 'mobileHub.previewEntryBody' : 'mobileHub.previewOther')}</Text><HubAction label={t('mobileHub.close')} onPress={() => setSheet(null)} /></BottomSheet>
  </View>
}
const styles = StyleSheet.create({ page: { flex: 1, alignItems: 'center' }, controls: { width: '100%', paddingHorizontal: 12, paddingVertical: 4, alignItems: 'center', borderBottomWidth: 1 }, controlsRow: { alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }, control: { minHeight: 36, paddingHorizontal: 10, justifyContent: 'center' }, frame: { width: '100%', maxWidth: 430, flex: 1 }, dock: { flexDirection: 'row', borderWidth: 1, borderRadius: 30, marginHorizontal: 8, marginBottom: 6, padding: 5, gap: 2 }, dockItem: { flex: 1, minWidth: 0, borderRadius: 25, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 3 } })
