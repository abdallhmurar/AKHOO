import { useTranslation } from 'react-i18next'
import { InteractiveScene } from './InteractiveScene.ios'
import { ImpactTreeFallback } from './ImpactTreeFallback'
import type { ImpactTreeProps } from './ImpactTree.types'
export function ImpactTree({ count, size, active }: ImpactTreeProps) {
  const { t } = useTranslation()
  return <InteractiveScene kind="tree" count={count} width={size} height={size * 1.2} active={active}
    label={t('perks.impactTree.accessibility', { count })} hint={t('perks.impactTree.hint')}
    fallback={<ImpactTreeFallback count={count} size={size} />} />
}
