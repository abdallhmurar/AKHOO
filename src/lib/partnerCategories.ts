import { Broom, CarBattery, DotsThreeCircle, Drop, Lock, MagnifyingGlass, Tire, Truck, Wrench } from 'phosphor-react-native'
import type { PartnerCategory } from '../types'

export const partnerCategories: { key: PartnerCategory; label: string; Icon: typeof CarBattery }[] = [
  { key: 'battery', label: 'بطاريات', Icon: CarBattery },
  { key: 'tire', label: 'إطارات', Icon: Tire },
  { key: 'maintenance', label: 'زيوت وصيانة', Icon: Drop },
  { key: 'towing', label: 'ونش وسحب', Icon: Truck },
  { key: 'locksmith', label: 'فتح مركبات', Icon: Lock },
  { key: 'mobile_mechanic', label: 'ميكانيكي متنقل', Icon: Wrench },
  { key: 'car_wash', label: 'غسيل سيارات', Icon: Broom },
  { key: 'inspection', label: 'فحص مركبات', Icon: MagnifyingGlass },
  { key: 'other', label: 'خدمات أخرى', Icon: DotsThreeCircle }
]
