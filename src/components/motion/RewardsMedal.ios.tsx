import { useTranslation } from 'react-i18next'
import { HelperMedalArtwork } from '../HelperMedalArtwork'
import { InteractiveScene } from './InteractiveScene.ios'
import { medalHint, REWARD_METALS, type RewardsMedalProps } from './RewardsMedal.types'
export function RewardsMedal({ level, size, active, label }: RewardsMedalProps) {
  const { i18n } = useTranslation()
  const fallback = <HelperMedalArtwork level={level} size={size} />
  if (level === 'none') return fallback
  return <InteractiveScene kind="rewardMedal" width={size} height={size * 1.25} label={label} hint={medalHint(i18n.language)} metal={REWARD_METALS[level]} active={active} fallback={fallback} />
}
