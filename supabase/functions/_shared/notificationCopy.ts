// The text of every push notification the notify-event function sends, in the three app languages.
// Arabic is written in the same colloquial Palestinian voice as the app; English and Hebrew are plain and
// short. The Hebrew was written by an assistant and has not been read by a native speaker yet.
// Placeholders look like {points}; every language of one event must use the same placeholders.

export type Lang = 'ar' | 'en' | 'he'
export const LANGS: Lang[] = ['ar', 'en', 'he']

type Text = { title: string; body: string }

export const copy = {
  // Updates about my own request (to the requester)
  request_accepted: {
    ar: { title: 'متطوع قبل طلبك', body: 'في متطوع جاي لعندك. فيك تحكيه من المحادثة.' },
    en: { title: 'A volunteer accepted your request', body: 'Someone is on the way to you. You can chat with them in the app.' },
    he: { title: 'מתנדב קיבל את הבקשה שלך', body: 'מישהו בדרך אליך. אפשר לשוחח איתו באפליקציה.' }
  },
  helper_on_the_way: {
    ar: { title: 'المتطوع بالطريق إليك', body: 'المتطوع طلع باتجاهك.' },
    en: { title: 'Your volunteer is on the way', body: 'They have set off towards you.' },
    he: { title: 'המתנדב בדרך אליך', body: 'הוא יצא לכיוונך.' }
  },
  helper_arrived: {
    ar: { title: 'المتطوع وصل', body: 'المتطوع وصل لموقعك.' },
    en: { title: 'Your volunteer has arrived', body: 'They are at your location.' },
    he: { title: 'המתנדב הגיע', body: 'הוא הגיע למיקום שלך.' }
  },
  completion_requested: {
    ar: { title: 'تمت المساعدة؟', body: 'أكّد إنها تمّت حتى المتطوع ياخد نقاطه.' },
    en: { title: 'Was the help completed?', body: 'Confirm so your volunteer receives their points.' },
    he: { title: 'הסיוע הושלם?', body: 'אשרו כדי שהמתנדב יקבל את הנקודות שלו.' }
  },
  helper_released: {
    ar: { title: 'المتطوع ما قدر يكمل', body: 'عم نبحث لك عن متطوع تاني.' },
    en: { title: 'Your volunteer could not continue', body: 'We are looking for another volunteer for you.' },
    he: { title: 'המתנדב לא יכול להמשיך', body: 'אנחנו מחפשים לכם מתנדב אחר.' }
  },
  request_sent: {
    ar: { title: 'وصل طلبك لمتطوعين', body: 'وصل لـ {n} من المتطوعين القريبين منك.' },
    en: { title: 'Your request was sent', body: 'It reached {n} nearby volunteer(s).' },
    he: { title: 'הבקשה נשלחה', body: 'היא הגיעה ל-{n} מתנדבים בסביבה.' }
  },
  no_volunteer: {
    ar: { title: 'لسا ما لقينا متطوع', body: 'جرّب تعيد الطلب، وإذا الوضع خطير اتصل بالطوارئ.' },
    en: { title: 'No volunteer yet', body: 'Try sending the request again, and call emergency services if it is dangerous.' },
    he: { title: 'עדיין לא נמצא מתנדב', body: 'נסו לשלוח את הבקשה שוב, ואם המצב מסוכן התקשרו לשירותי החירום.' }
  },
  mission_cancelled: {
    ar: { title: 'تم إلغاء المهمة', body: 'فريق أخوو ألغى هاي المهمة. إذا لسا بدك مساعدة قدّم طلب جديد.' },
    en: { title: 'The mission was cancelled', body: 'The AKHOO team cancelled this mission. Send a new request if you still need help.' },
    he: { title: 'המשימה בוטלה', body: 'צוות אחוו ביטל את המשימה. אם עדיין צריך עזרה, שלחו בקשה חדשה.' }
  },
  rating_reminder: {
    ar: { title: 'كيف كانت تجربتك؟', body: 'قيّم المتطوع، رأيك بيساعدنا.' },
    en: { title: 'How was your experience?', body: 'Rate your volunteer, it helps us.' },
    he: { title: 'איך הייתה החוויה?', body: 'דרגו את המתנדב, זה עוזר לנו.' }
  },
  // Updates for the volunteer
  completion_rejected: {
    ar: { title: 'صاحب الطلب لسا ما أكّد', body: 'قال إن المساعدة ما اكتملت. احكيه من المحادثة.' },
    en: { title: 'The request is not confirmed yet', body: 'They said the help is not complete. Talk to them in the chat.' },
    he: { title: 'הבקשה עדיין לא אושרה', body: 'נאמר שהסיוע לא הושלם. אפשר לשוחח בצ׳אט.' }
  },
  request_completed: {
    ar: { title: 'تم تأكيد المساعدة', body: 'حصلت على {points} نقاط. شكراً لمساعدتك!' },
    en: { title: 'Help confirmed', body: 'You earned {points} points. Thank you for helping!' },
    he: { title: 'הסיוע אושר', body: 'קיבלת {points} נקודות. תודה על העזרה!' }
  },
  request_still_open: {
    ar: { title: 'طلب قريب لسا بدون متطوع', body: '{service}. إذا فاضي، ساعدهم.' },
    en: { title: 'A nearby request still needs a volunteer', body: '{service}. Can you help?' },
    he: { title: 'בקשה בסביבה עדיין ממתינה למתנדב', body: '{service}. אפשר לעזור?' }
  },
  level_up: {
    ar: { title: '🎉 وصلت لدرجة {level}', body: 'شكراً لإنك بتساعد الناس.' },
    en: { title: '🎉 You\'ve reached {level}', body: 'Thank you for helping people.' },
    he: { title: '🎉 הגעת לדרגת {level}', body: 'תודה על העזרה לאנשים.' }
  },
  first_help: {
    ar: { title: 'أول مساعدة إلك!', body: 'مبروك، هيك بتبدأ الرحلة.' },
    en: { title: 'Your first help!', body: 'Congratulations, this is how it starts.' },
    he: { title: 'הסיוע הראשון שלך!', body: 'מזל טוב, כך מתחילים.' }
  },
  milestone: {
    ar: { title: 'ساعدت {n} أشخاص', body: 'ما أحلى مساعدتك. شكراً إلك!' },
    en: { title: 'You have helped {n} people', body: 'Thank you, that matters.' },
    he: { title: 'עזרת ל-{n} אנשים', body: 'תודה, זה חשוב.' }
  },
  volunteer_verified: {
    ar: { title: 'تم توثيق حسابك', body: 'صار عندك شارة متطوع موثّق.' },
    en: { title: 'Your volunteer account is verified', body: 'You now have the verified helper badge.' },
    he: { title: 'חשבון המתנדב שלך אומת', body: 'קיבלת תג מתנדב מאומת.' }
  },
  // Offers
  redemption_created: {
    ar: { title: 'كود عرضك جاهز', body: 'استخدمه قبل ما ينتهي. شوف الوقت بالتطبيق.' },
    en: { title: 'Your offer code is ready', body: 'Use it before it expires. The time is in the app.' },
    he: { title: 'קוד ההטבה שלך מוכן', body: 'השתמשו בו לפני שיפוג. הזמן מופיע באפליקציה.' }
  },
  redemption_redeemed: {
    ar: { title: 'تم استخدام عرضك', body: 'استمتع بعرضك!' },
    en: { title: 'Offer redeemed', body: 'Enjoy!' },
    he: { title: 'ההטבה מומשה', body: 'תהנו!' }
  },
  redemption_redeemed_partner: {
    ar: { title: 'زبون استخدم عرضك', body: 'تم تسجيل عملية استبدال جديدة.' },
    en: { title: 'A customer used your offer', body: 'A new redemption was recorded.' },
    he: { title: 'לקוח מימש את ההטבה שלך', body: 'נרשם מימוש חדש.' }
  },
  redemption_expiring: {
    ar: { title: 'عرضك بينتهي قريباً', body: 'باقي أقل من ساعة على كود العرض.' },
    en: { title: 'Your offer is about to expire', body: 'Less than an hour left on your offer code.' },
    he: { title: 'ההטבה שלך עומדת לפוג', body: 'נותרה פחות משעה לקוד ההטבה.' }
  },
  offer_approved: {
    ar: { title: 'تمت الموافقة على عرضك', body: 'عرضك صار جاهز للنشر.' },
    en: { title: 'Your offer was approved', body: 'Your offer is ready to be published.' },
    he: { title: 'ההצעה שלך אושרה', body: 'ההצעה שלך מוכנה לפרסום.' }
  },
  offer_rejected: {
    ar: { title: 'تعذّرت الموافقة على عرضك', body: 'راجع التفاصيل أو تواصل مع الدعم.' },
    en: { title: 'Your offer could not be approved', body: 'Review the details or contact support.' },
    he: { title: 'לא ניתן היה לאשר את ההצעה שלך', body: 'בדקו את הפרטים או פנו לתמיכה.' }
  },
  // Support, safety and account
  support_resolved: {
    ar: { title: 'تم حل مشكلتك', body: 'إذا لسا في شي، اكتب لنا.' },
    en: { title: 'Your issue is resolved', body: 'If anything is still wrong, write to us.' },
    he: { title: 'הפנייה שלך נפתרה', body: 'אם עדיין יש בעיה, כתבו לנו.' }
  },
  report_reviewed: {
    ar: { title: 'راجعنا بلاغك', body: 'شكراً لمساعدتنا بإبقاء أخوو آمن.' },
    en: { title: 'We reviewed your report', body: 'Thank you for helping keep AKHOO safe.' },
    he: { title: 'בדקנו את הדיווח שלך', body: 'תודה על העזרה בשמירה על אחוו בטוח.' }
  },
  account_banned: {
    ar: { title: 'تم إيقاف حسابك', body: 'إذا بتعتقد إنه خطأ، تواصل مع الدعم من التطبيق.' },
    en: { title: 'Your account was suspended', body: 'If you think this is a mistake, contact support in the app.' },
    he: { title: 'החשבון שלך הושעה', body: 'אם לדעתכם זו טעות, פנו לתמיכה באפליקציה.' }
  },
  account_unbanned: {
    ar: { title: 'رجعنا فعّلنا حسابك', body: 'فيك تستخدم أخوو من جديد.' },
    en: { title: 'Your account is active again', body: 'You can use AKHOO again.' },
    he: { title: 'החשבון שלך הופעל מחדש', body: 'אפשר להשתמש באחוו שוב.' }
  },
  new_device: {
    ar: { title: 'دخول من جهاز جديد', body: 'إذا مش إنت، غيّر كلمة السر فوراً.' },
    en: { title: 'New device sign-in', body: 'If this was not you, change your password now.' },
    he: { title: 'כניסה ממכשיר חדש', body: 'אם זה לא אתם, החליפו סיסמה מיד.' }
  },
  // Alerts for the admins
  admin_support_message: {
    ar: { title: 'رسالة دعم جديدة', body: 'مستخدم كتب لفريق الدعم.' },
    en: { title: 'New support message', body: 'A user wrote to support.' },
    he: { title: 'הודעת תמיכה חדשה', body: 'משתמש כתב לתמיכה.' }
  },
  admin_report: {
    ar: { title: 'بلاغ جديد', body: 'وصل بلاغ جديد بانتظار المراجعة.' },
    en: { title: 'New report', body: 'A new report is waiting for review.' },
    he: { title: 'דיווח חדש', body: 'דיווח חדש ממתין לבדיקה.' }
  },
  admin_offer_pending: {
    ar: { title: 'عرض بانتظار موافقتك', body: 'شريك قدّم عرض جديد للمراجعة.' },
    en: { title: 'Offer waiting for approval', body: 'A partner submitted a new offer for review.' },
    he: { title: 'הצעה ממתינה לאישור', body: 'שותף הגיש הצעה חדשה לבדיקה.' }
  }
} satisfies Record<string, Record<Lang, Text>>

export type EventKey = keyof typeof copy

export const levelNames: Record<'bronze' | 'silver' | 'gold' | 'green', Record<Lang, string>> = {
  bronze: { ar: 'مساعد برونزي', en: 'Bronze Helper', he: 'עוזר/ת ברונזה' },
  silver: { ar: 'مساعد فضي', en: 'Silver Helper', he: 'עוזר/ת כסף' },
  gold: { ar: 'مساعد ذهبي', en: 'Gold Helper', he: 'עוזר/ת זהב' },
  green: { ar: 'أخوو الأخضر', en: 'AKHOO Green', he: 'אחוו ירוק' }
}

export const serviceLabels: Record<string, Record<Lang, string>> = {
  battery: { ar: 'بطارية', en: 'Battery', he: 'מצבר' },
  tire: { ar: 'بنشر', en: 'Flat tire', he: 'פנצ׳ר' },
  fuel: { ar: 'وقود', en: 'Fuel', he: 'דלק' },
  locked_car: { ar: 'سيارة مقفلة', en: 'Locked car', he: 'רכב נעול' },
  other: { ar: 'مساعدة', en: 'Help', he: 'עזרה' }
}

export function asLang(value: string | null | undefined): Lang {
  return value === 'en' || value === 'he' ? value : 'ar'
}

export function render(event: EventKey, language: string | null | undefined, vars: Record<string, string | number> = {}): Text {
  const text = copy[event][asLang(language)]
  const fill = (template: string) => template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole))
  return { title: fill(text.title), body: fill(text.body) }
}

// Same thresholds as src/lib/activityLevel.ts (completed missions).
export function levelFor(completed: number): 'none' | 'bronze' | 'silver' | 'gold' | 'green' {
  if (completed >= 60) return 'green'
  if (completed >= 30) return 'gold'
  if (completed >= 15) return 'silver'
  if (completed >= 5) return 'bronze'
  return 'none'
}

export const MILESTONES = [10, 25, 50, 100]
