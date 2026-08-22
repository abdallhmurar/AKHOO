import { Broom, CarBattery, DotsThreeCircle, Drop, Lightning, Lock, MagnifyingGlass, Tire, Toolbox, Truck, Wrench } from 'phosphor-react-native'
import type { PartnerCategory } from '../types'

export const businessCategories: { key: PartnerCategory; Icon: typeof CarBattery }[] = [
  { key: 'towing', Icon: Truck },
  { key: 'workshop', Icon: Toolbox },
  { key: 'mobile_mechanic', Icon: Wrench },
  { key: 'tire', Icon: Tire },
  { key: 'battery', Icon: CarBattery },
  { key: 'auto_electrician', Icon: Lightning },
  { key: 'inspection', Icon: MagnifyingGlass },
  { key: 'car_wash', Icon: Broom },
  { key: 'maintenance', Icon: Drop },
  { key: 'locksmith', Icon: Lock },
  { key: 'other', Icon: DotsThreeCircle }
]

export const businessCategoryIcons: Record<PartnerCategory, typeof CarBattery> = Object.fromEntries(
  businessCategories.map(c => [c.key, c.Icon])
) as Record<PartnerCategory, typeof CarBattery>
