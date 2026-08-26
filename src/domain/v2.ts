export type V2Language = 'ar' | 'he' | 'en'

export type LocalizedText = Record<V2Language, string>

export type AssistanceCategoryId =
  | 'mobility'
  | 'errands'
  | 'home_support'
  | 'accessibility'
  | 'accompaniment'
  | 'language_help'
  | 'digital_help'
  | 'community_response'
  | 'other'

export type AssistanceScenario = {
  id: string
  categoryId: AssistanceCategoryId
  label: LocalizedText
  description: LocalizedText
  requiresEmergencyScreening?: boolean
}

export type AssistanceCategory = {
  id: AssistanceCategoryId
  icon: 'wheelchair' | 'basket' | 'house' | 'accessibility' | 'users' | 'translate' | 'device' | 'community' | 'dots'
  label: LocalizedText
  description: LocalizedText
}

export const assistanceCategories: AssistanceCategory[] = [
  {
    id: 'mobility',
    icon: 'wheelchair',
    label: { ar: 'التنقّل', he: 'ניידות', en: 'Mobility' },
    description: { ar: 'مساندة للوصول أو الحركة بأمان', he: 'סיוע בתנועה ובהגעה בטוחה', en: 'Help moving or getting somewhere safely' }
  },
  {
    id: 'errands',
    icon: 'basket',
    label: { ar: 'المهمات اليومية', he: 'סידורים', en: 'Errands' },
    description: { ar: 'دواء، مشتريات أو استلام غرض', he: 'תרופות, קניות או איסוף', en: 'Medicine, groceries, or a pickup' }
  },
  {
    id: 'home_support',
    icon: 'house',
    label: { ar: 'مساندة منزلية', he: 'עזרה בבית', en: 'Home support' },
    description: { ar: 'مهمة منزلية بسيطة وآمنة', he: 'משימה ביתית פשוטה ובטוחה', en: 'A simple, safe task at home' }
  },
  {
    id: 'accessibility',
    icon: 'accessibility',
    label: { ar: 'إتاحة ووصول', he: 'נגישות', en: 'Accessibility' },
    description: { ar: 'مساعدة مرتبطة بالإعاقة أو الوصول', he: 'סיוע הקשור לנגישות או מוגבלות', en: 'Disability or access-related assistance' }
  },
  {
    id: 'accompaniment',
    icon: 'users',
    label: { ar: 'مرافقة', he: 'ליווי', en: 'Accompaniment' },
    description: { ar: 'مرافقة لموعد أو مكان عام', he: 'ליווי לתור או למקום ציבורי', en: 'Company for an appointment or public place' }
  },
  {
    id: 'language_help',
    icon: 'translate',
    label: { ar: 'مساعدة لغوية', he: 'עזרה בשפה', en: 'Language help' },
    description: { ar: 'ترجمة أو فهم معلومة', he: 'תרגום או הבנת מידע', en: 'Translation or understanding information' }
  },
  {
    id: 'digital_help',
    icon: 'device',
    label: { ar: 'مساعدة رقمية', he: 'עזרה דיגיטלית', en: 'Digital help' },
    description: { ar: 'هاتف، نموذج أو خدمة إلكترونية', he: 'טלפון, טופס או שירות מקוון', en: 'Phone, form, or online-service support' }
  },
  {
    id: 'community_response',
    icon: 'community',
    label: { ar: 'استجابة مجتمعية', he: 'מענה קהילתי', en: 'Community response' },
    description: { ar: 'احتياج محلي يؤثر على أكثر من شخص', he: 'צורך מקומי שמשפיע על כמה אנשים', en: 'A local need affecting more than one person' }
  },
  {
    id: 'other',
    icon: 'dots',
    label: { ar: 'أخرى', he: 'אחר', en: 'Other' },
    description: { ar: 'اشرح ما تحتاجه وسنوجّه الطلب', he: 'ספרו מה נדרש ונכוון את הבקשה', en: 'Tell us what is needed and we will route it' }
  }
]

export const assistanceScenarios: AssistanceScenario[] = [
  { id: 'ride_appointment', categoryId: 'mobility', label: { ar: 'الوصول إلى موعد', he: 'הגעה לתור', en: 'Get to an appointment' }, description: { ar: 'مرافقة أو توصيلة غير طبية', he: 'ליווי או הסעה לא רפואית', en: 'Non-medical accompaniment or ride' } },
  { id: 'mobility_obstacle', categoryId: 'mobility', label: { ar: 'عائق في الطريق', he: 'מכשול בדרך', en: 'Mobility obstacle' }, description: { ar: 'مساعدة لعبور عائق أو درج', he: 'עזרה במעבר מכשול או מדרגות', en: 'Help with a barrier or stairs' } },
  { id: 'medicine_pickup', categoryId: 'errands', label: { ar: 'استلام دواء', he: 'איסוף תרופות', en: 'Medicine pickup' }, description: { ar: 'استلام وصفة جاهزة، دون نصيحة طبية', he: 'איסוף מרשם מוכן, ללא ייעוץ רפואי', en: 'Collect a prepared prescription, without medical advice' } },
  { id: 'groceries', categoryId: 'errands', label: { ar: 'مشتريات أساسية', he: 'קניות חיוניות', en: 'Essential groceries' }, description: { ar: 'قائمة قصيرة من متجر قريب', he: 'רשימה קצרה מחנות קרובה', en: 'A short list from a nearby shop' } },
  { id: 'simple_home_task', categoryId: 'home_support', label: { ar: 'مهمة منزلية بسيطة', he: 'משימה ביתית פשוטה', en: 'Simple home task' }, description: { ar: 'تبديل مصباح أو تحريك غرض خفيف', he: 'החלפת נורה או הזזת חפץ קל', en: 'Change a bulb or move a light item' }, requiresEmergencyScreening: true },
  { id: 'accessible_entry', categoryId: 'accessibility', label: { ar: 'دخول أو خروج آمن', he: 'כניסה או יציאה בטוחה', en: 'Safe entry or exit' }, description: { ar: 'مساندة عند مدخل غير مهيأ', he: 'סיוע בכניסה שאינה נגישה', en: 'Help at an inaccessible entrance' } },
  { id: 'appointment_companion', categoryId: 'accompaniment', label: { ar: 'مرافقة إلى موعد', he: 'ליווי לתור', en: 'Appointment companion' }, description: { ar: 'وجود شخص موثوق أثناء الموعد', he: 'נוכחות אדם מהימן במהלך התור', en: 'A trusted person to accompany you' } },
  { id: 'translate_document', categoryId: 'language_help', label: { ar: 'فهم رسالة أو مستند', he: 'הבנת הודעה או מסמך', en: 'Understand a message or document' }, description: { ar: 'شرح عام، وليس استشارة قانونية', he: 'הסבר כללי, לא ייעוץ משפטי', en: 'General explanation, not legal advice' } },
  { id: 'online_form', categoryId: 'digital_help', label: { ar: 'تعبئة نموذج إلكتروني', he: 'מילוי טופס מקוון', en: 'Complete an online form' }, description: { ar: 'مساندة تقنية مع حماية بياناتك', he: 'סיוע טכני תוך הגנה על המידע', en: 'Technical help while protecting your data' } },
  { id: 'neighborhood_need', categoryId: 'community_response', label: { ar: 'احتياج في الحي', he: 'צורך שכונתי', en: 'Neighborhood need' }, description: { ar: 'تنسيق مساندة محلية غير طارئة', he: 'תיאום סיוע מקומי שאינו חירום', en: 'Coordinate a non-emergency local response' }, requiresEmergencyScreening: true },
  { id: 'other', categoryId: 'other', label: { ar: 'طلب مختلف', he: 'בקשה אחרת', en: 'Something else' }, description: { ar: 'صف الطلب بوضوح ومن دون معلومات حساسة', he: 'תארו בבירור בלי מידע רגיש', en: 'Describe the request without sensitive information' }, requiresEmergencyScreening: true }
]

export type EmergencyScreening = {
  immediateDanger: boolean
  medicalEmergency: boolean
  fireOrViolence: boolean
  childOrVulnerablePersonAtRisk: boolean
}

export function requiresEmergencyHandoff(screening: EmergencyScreening): boolean {
  return Object.values(screening).some(Boolean)
}

export const missionStatuses = [
  'matching',
  'assigned',
  'on_the_way',
  'arrived',
  'in_progress',
  'awaiting_confirmation',
  'completed',
  'cancelled',
  'disputed'
] as const

export type MissionStatus = (typeof missionStatuses)[number]

const terminalStatuses = new Set<MissionStatus>(['completed', 'cancelled', 'disputed'])

export function isMissionTerminal(status: MissionStatus): boolean {
  return terminalStatuses.has(status)
}

export function scenariosForCategory(categoryId: AssistanceCategoryId): AssistanceScenario[] {
  return assistanceScenarios.filter(scenario => scenario.categoryId === categoryId)
}

export function localized(value: LocalizedText, language: string): string {
  return value[language as V2Language] ?? value.ar
}

export type MissionRole = 'requester' | 'helper'

export function allowedMissionActions(status: MissionStatus, role: MissionRole): string[] {
  if (role === 'requester') {
    if (status === 'matching') return ['cancel']
    if (status === 'awaiting_confirmation') return ['confirm', 'dispute']
    return isMissionTerminal(status) ? ['rate'] : ['message', 'report', 'block']
  }
  const actions: Partial<Record<MissionStatus, string[]>> = {
    assigned: ['on_the_way', 'release'],
    on_the_way: ['arrived', 'navigate', 'release'],
    arrived: ['in_progress', 'release'],
    in_progress: ['awaiting_confirmation'],
    completed: ['rate']
  }
  return actions[status] ?? (isMissionTerminal(status) ? ['rate'] : ['message', 'report', 'block'])
}
