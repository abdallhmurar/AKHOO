import { Image } from 'react-native'
import { InteractiveScene } from '../../components/motion/InteractiveScene.ios'

export function RewardsGift({ label, size = 82, onFallback, interactive = true, active = true, interaction = 0, idle = true }: {
  label: string; size?: number; onFallback?: () => void; interactive?: boolean; active?: boolean; interaction?: number; idle?: boolean
}) {
  return <InteractiveScene kind="gift" width={size} height={size} label={label} interactive={interactive} active={active} interaction={interaction} idle={idle} onFallback={onFallback}
    fallback={<Image accessible={false} source={require('../../components/dock-assets/gift.png')} style={{ width: size, height: size }} resizeMode="contain" />} />
}
