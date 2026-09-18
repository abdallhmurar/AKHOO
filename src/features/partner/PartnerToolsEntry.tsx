import { Storefront } from 'phosphor-react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ListRow } from '../../components/v2/ListRow'
import { usePartnerAccess } from './usePartnerAccess'

export function PartnerToolsEntry() {
  const { t } = useTranslation()
  const router = useRouter()
  const { status } = usePartnerAccess()
  if (status !== 'authorized') return null
  return <ListRow Icon={Storefront} title={t('partnerTools.title')} onPress={() => router.push('/(tabs)/account/partner')} />
}
