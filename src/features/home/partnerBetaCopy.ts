// Copy approved in the local partner preview. No customer-volume or future-price promises.
const ar = {
  brand: 'شركاء أخوو', bannerTitle: 'خلّي شغلك\nينشاف', bannerText: 'عرّف الناس على مصلحتك وعروضك', join: 'صير شريك أخوو',
  rewardsTitle: 'حوّل نقاطك لمزايا', rewardsText: 'عروض من شركاء أخوو', explore: 'شوفها',
  intro: 'نكبر مع بعض', heading: 'شغلك إله مكان معنا.', description: 'عندك مصلحة أو خدمة؟ احكيلنا عنها، وخلّينا نشوف كيف بنقدر نتعاون.',
  faqLabel: 'قبل ما تنضم', faqTitle: 'من البداية، كل إشي واضح',
  faq: [
    { q: 'شو بكلف انضمام مصلحتي؟', a: 'حالياً التسجيل والانضمام مجاني، للمستخدمين وللمصالح كمان. هدفنا الناس تتعرّف على أخوو وتستفيد منه. ممكن تتغيّر السياسات لقدّام، فالمجانية هون بتحكي عن الوضع الحالي.' },
    { q: 'قديش بتتوقعوا مستخدمين بالقدس؟', a: 'لسه ما عنا رقم نقدر نوعدك فيه. خطتنا نعرّف الناس على أخوو من خلال الإعلانات والنشر، ونكبر بالقدس وباقي المناطق شوي شوي.' },
    { q: 'بقدر أشتغل مع تطبيقات ثانية؟', a: 'أكيد، ما في حصرية. إنت حر تشتغل مع تطبيقات وجهات ثانية، ووجودك معنا ما بمنعك من التعاون معهم.' },
    { q: 'بقدر أنسحب بدون غرامة؟', a: 'آه، من حقك تنسحب من التعاون بأي وقت، بدون غرامات.' },
  ],
  details: 'عن مصلحتك', review: 'راجع التفاصيل', business: 'اسم المصلحة', category: 'مجال شغلك', city: 'المدينة', phone: 'رقم للتواصل', offer: 'شو بتحب تقدّم؟ (اختياري)',
  categories: ['خدمات سيارات', 'مطاعم وكافيهات', 'محلات ومتاجر', 'خدمات مهنية', 'مجال ثاني'],
  next: 'نكمل ونراجع', edit: 'عدّل التفاصيل', send: 'جرّب إرسال الطلب', close: 'رجوع للرئيسية', back: 'رجوع',
  notice: 'هاي تجربة للمراجعة؛ زر الإرسال هون ما ببعت طلب فعلي.',
  done: 'طلبك صار جاهز', doneText: 'معاينة فقط — ما تم إرسال طلب. لما نفعّل الخدمة، بنراجع التفاصيل وبنتواصل معك قبل ما تظهر مصلحتك.',
  errors: { business: 'اكتب اسم المصلحة (حرفين على الأقل).', city: 'اكتب اسم المدينة (حرفين على الأقل).', phone: 'اكتب رقم تواصل صحيح مع رمز المنطقة.', category: 'اختار مجال شغلك.' },
} as const

type Copy = { [K in keyof typeof ar]: K extends 'faq' ? readonly { q: string; a: string }[] : K extends 'categories' ? readonly string[] : K extends 'errors' ? Record<keyof typeof ar.errors, string> : string }

export const partnerBetaCopy: Record<'ar' | 'en' | 'he', Copy> = {
  ar,
  en: {
    brand: 'AKHOO partners', bannerTitle: 'Let your\nbusiness shine', bannerText: 'Share your business and offers', join: 'Partner with AKHOO',
    rewardsTitle: 'Turn points into perks', rewardsText: 'Offers from AKHOO partners', explore: 'Explore',
    intro: 'Grow together', heading: 'Your business belongs here.', description: 'Have a business or service? Tell us about it and let’s see how we can work together.',
    faqLabel: 'Before you join', faqTitle: 'Clear from the start',
    faq: [
      { q: 'What does joining cost?', a: 'Joining is currently free for individuals and businesses. We want people to discover and benefit from AKHOO. Policies may change in the future; free access describes the current terms.' },
      { q: 'How many users do you expect in Jerusalem?', a: 'We don’t have a number we can promise yet. We plan to introduce AKHOO through advertising and outreach, growing gradually in Jerusalem and other areas.' },
      { q: 'Can I work with other apps?', a: 'Of course. There is no exclusivity. You are free to work with other apps and organizations while partnering with us.' },
      { q: 'Can I leave without a penalty?', a: 'Yes. You can end the partnership at any time, without a penalty.' },
    ],
    details: 'Your business', review: 'Review details', business: 'Business name', category: 'Business category', city: 'City', phone: 'Contact number', offer: 'What would you like to offer? (optional)',
    categories: ['Car services', 'Food & cafés', 'Shops & retail', 'Professional services', 'Something else'],
    next: 'Continue to review', edit: 'Edit details', send: 'Try sending request', close: 'Back to home', back: 'Back',
    notice: 'This is a test preview. The send button does not submit a real request.',
    done: 'Your request is ready', doneText: 'Preview only — nothing was sent. Once the service is active, we’ll review your details and contact you before listing your business.',
    errors: { business: 'Enter a business name (at least 2 characters).', city: 'Enter a city (at least 2 characters).', phone: 'Enter a valid contact number including area code.', category: 'Choose your business category.' },
  },
  he: {
    brand: 'השותפים של AKHOO', bannerTitle: 'תנו לעסק שלכם\nלבלוט', bannerText: 'הציגו את העסק ואת ההטבות שלכם', join: 'הצטרפו לשותפים',
    rewardsTitle: 'הופכים נקודות להטבות', rewardsText: 'הצעות מהשותפים של AKHOO', explore: 'לגלות',
    intro: 'צומחים יחד', heading: 'יש כאן מקום לעסק שלכם.', description: 'יש לכם עסק או שירות? ספרו לנו עליו ונבדוק איך אפשר לשתף פעולה.',
    faqLabel: 'לפני שמצטרפים', faqTitle: 'הכול ברור מההתחלה',
    faq: [
      { q: 'כמה עולה להצטרף?', a: 'כרגע ההרשמה וההצטרפות בחינם, גם למשתמשים וגם לעסקים. המטרה שלנו היא שאנשים יכירו את AKHOO וייהנו ממנו. המדיניות עשויה להשתנות בעתיד; ההצטרפות בחינם מתייחסת למצב הנוכחי.' },
      { q: 'כמה משתמשים צפויים בירושלים?', a: 'עדיין אין מספר שנוכל להבטיח. אנחנו מתכננים להכיר לאנשים את AKHOO באמצעות פרסום ופעילות הסברה, ולצמוח בהדרגה בירושלים ובאזורים נוספים.' },
      { q: 'אפשר לעבוד עם אפליקציות אחרות?', a: 'בהחלט. אין בלעדיות. אתם חופשיים לעבוד עם אפליקציות וגורמים אחרים במקביל לשיתוף הפעולה איתנו.' },
      { q: 'אפשר לפרוש ללא קנס?', a: 'כן. אפשר להפסיק את שיתוף הפעולה בכל זמן, ללא קנסות.' },
    ],
    details: 'על העסק', review: 'בדיקת הפרטים', business: 'שם העסק', category: 'תחום העסק', city: 'עיר', phone: 'מספר ליצירת קשר', offer: 'מה תרצו להציע? (לא חובה)',
    categories: ['שירותי רכב', 'מסעדות ובתי קפה', 'חנויות', 'שירותים מקצועיים', 'תחום אחר'],
    next: 'המשך לבדיקת הפרטים', edit: 'עריכת הפרטים', send: 'ניסיון שליחת בקשה', close: 'חזרה לראשי', back: 'חזרה',
    notice: 'זוהי תצוגה לניסיון. כפתור השליחה אינו שולח בקשה אמיתית.',
    done: 'הבקשה מוכנה', doneText: 'תצוגה בלבד — לא נשלחה בקשה. כשהשירות יופעל, נבדוק את הפרטים וניצור קשר לפני הצגת העסק.',
    errors: { business: 'הזינו שם עסק (לפחות 2 תווים).', city: 'הזינו עיר (לפחות 2 תווים).', phone: 'הזינו מספר קשר תקין כולל קידומת.', category: 'בחרו את תחום העסק.' },
  },
}
