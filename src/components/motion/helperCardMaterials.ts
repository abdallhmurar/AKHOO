import type { ImageSourcePropType } from 'react-native'
import type { ActivityLevel } from '../../lib/activityLevel'

export const HELPER_CARD_MATERIALS: Record<Exclude<ActivityLevel, 'none'>, ImageSourcePropType> = {
  bronze: require('../../../assets/helper-card/bronze.png'),
  silver: require('../../../assets/helper-card/silver.png'),
  gold: require('../../../assets/helper-card/gold.png'),
  green: require('../../../assets/helper-card/green.png'),
}
// A new member uses the neutral steel finish, without an earned-rank claim.
export const helperCardMaterial = (level: ActivityLevel) => HELPER_CARD_MATERIALS[level === 'none' ? 'silver' : level]
