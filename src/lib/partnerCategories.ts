import { Broom, CarBattery, DotsThreeCircle, Drop, Lock, MagnifyingGlass, Tire, Truck, Wrench } from 'phosphor-react-native'
import type { PartnerCategory } from '../types'

export const partnerCategories: { key: PartnerCategory; Icon: typeof CarBattery }[] = [
  { key: 'battery', Icon: CarBattery },
  { key: 'tire', Icon: Tire },
  { key: 'maintenance', Icon: Drop },
  { key: 'towing', Icon: Truck },
  { key: 'locksmith', Icon: Lock },
  { key: 'mobile_mechanic', Icon: Wrench },
  { key: 'car_wash', Icon: Broom },
  { key: 'inspection', Icon: MagnifyingGlass },
  { key: 'other', Icon: DotsThreeCircle }
]
