import { useTranslation } from 'react-i18next'
const ar = {
  title: 'دليل الاستخدام', next: 'التالي', previous: 'السابق', finish: 'فهمت', skip: 'تخطي الشرح', restart: 'إعادة دليل الاستخدام', error: 'تعذّر حفظ التقدّم. حاول مرة ثانية.', counter: 'من',
  steps: {
    'home.request': ['محتاج مساعدة على الطريق؟', 'اضغط هون، اختار المشكلة وحدّد موقعك عشان تطلب مساعدة من شخص قريب.'],
    'home.help': ['بتقدر تساعد؟', 'هون بتشوف طلبات المساعدة القريبة منك وبتختار الطلب المناسب إلك.'],
    'home.perks': ['اكتشف مزايا أخوو', 'شوف العروض المتاحة ورصيد نقاطك ومستواك كمساعد.'],
    navigation: ['تنقّل بين صفحاتك', 'من الشريط تحت بتوصل للرئيسية والمزايا وسجل نشاطك وحسابك. كل صفحة إلها شرح عند أول زيارة.'],
    'request.services': ['اختار المشكلة', 'حدّد نوع المساعدة المطلوبة. اختيار الكرت لحاله ما بيبعث طلب.'],
    'request.next': ['كمّل الخطوة الجاية', 'اضغط التالي بعد اختيار المشكلة. بتقدر ترجع وتغيّر اختيارك.'],
    'details.note': ['احكي تفاصيل المشكلة', 'اكتب ملاحظة تساعد الشخص يفهم الحالة. لا تكتب كلمات مرور أو معلومات حساسة.'],
    'details.photo': ['صورة بتوضّح أكثر', 'إضافة صورة اختيارية. تأكد إنها بتوضح المشكلة وما بتكشف معلومات خاصة.'],
    'details.next': ['راجع الموقع بعد التفاصيل', 'التالي بينقلك لتحديد الموقع. لسه ما انبعت طلب المساعدة.'],
    'location.position': ['تأكّد من موقعك', 'راجع الموقع قبل الإرسال. بتقدر تحدّثه أو تحدّد مكانك يدوياً.'],
    'location.submit': ['إرسال الطلب', 'بعد التأكد من التفاصيل والموقع، زر إرسال طلب المساعدة بنشر طلبك. الدليل ما بيبعثه عنك.'],
    'helper.availability': ['حالتك كمساعد', 'التوفّر بيتحدّث تلقائياً. إذا طلبت مساعدة لنفسك بتتوقف إتاحتك لحد ما ينتهي طلبك.'],
    'helper.map': ['طلبات قريبة على الخريطة', 'حرّك الخريطة وكبّرها، واضغط علامة الطلب لتشوف تفاصيله. زر الموقع بيرجعك لمكانك.'],
    'helper.nearby': ['شوف الطلب قبل ما تقبله', 'هون أقرب طلب، ومن عرض الكل بتشوف الباقي. افتح التفاصيل وراجعها قبل قبول المساعدة.'],
    'perks.points': ['نقاطك ومستواك', 'النقاط رصيد للمزايا. المستوى والميدالية حسب المساعدات المكتملة، وصرف النقاط ما بنزّل مستواك.'],
    'perks.offers': ['تفاصيل العروض', 'افتح العرض واقرأ الشروط وتكلفة النقاط إن وجدت. فتح التفاصيل ما بيخصم نقاط.'],
    'activity.stats': ['ملخّص نشاطك', 'هون مجموع المساعدات ومستواك ورصيد نقاطك. فلتر الفترة بيغيّر السجل فقط.'],
    'activity.filters': ['فلتر السجل', 'اختار الكل، المساعدات اللي قدّمتها، اللي تلقيتها، أو النقاط.'],
    'activity.history': ['تفاصيل نشاطك', 'راجع حالة الطلب وتاريخه، وافتح النشاط المتاح لعرض تفاصيل المهمة.'],
    'account.profile': ['معلومات حسابك', 'راجع بياناتك وعدّل معلوماتك الشخصية من هون.'],
    'account.settings': ['إعداداتك ومساعدتك', 'غيّر اللغة وتطبيق الملاحة والمظهر، ووصل للدعم من قائمة حسابك.'],
    'account.guide': ['ارجع للدليل بأي وقت', 'من هون بتقدر تعيد الجولة. تخطي الشرح بيوقف كل الشروحات التلقائية لحد ما تعيده.']
  }
}
type Copy = { [K in Exclude<keyof typeof ar, 'steps'>]: string } & { steps: Record<keyof typeof ar.steps, readonly string[]> }
const en: Copy = {
  title:'User guide',next:'Next',previous:'Back',finish:'Got it',skip:'Skip guide',restart:'Restart user guide',error:'Could not save progress. Please try again.',counter:'of',
  steps:{
    'home.request':['Need roadside help?','Choose your problem and confirm your location to request help from someone nearby.'],
    'home.help':['Ready to help?','See nearby requests and find one you can help with.'],
    'home.perks':['Explore AKHOO Perks','Discover available offers, your points balance and helper level.'],
    navigation:['Your main pages','Use the bottom bar for Home, Perks, Activity and Account. Each page has a short guide on your first visit.'],
    'request.services':['Choose your problem','Select the help you need. Selecting a card does not send a request.'],
    'request.next':['Continue when ready','Select a problem, then tap Next. You can go back and change it.'],
    'details.note':['Describe the problem','Add a useful note for your helper. Avoid passwords or sensitive information.'],
    'details.photo':['Add an optional photo','A photo can explain the problem. Make sure it does not expose private information.'],
    'details.next':['Check your location next','Next opens the location step. Your help request has not been sent yet.'],
    'location.position':['Confirm your location','Check the location before sending. You can refresh it or choose it manually.'],
    'location.submit':['Send your request','After checking your details and location, Send Help Request publishes it. This guide never sends it for you.'],
    'helper.availability':['Your availability','Availability updates automatically. Requesting help for yourself pauses it until your request ends.'],
    'helper.map':['Nearby requests on the map','Pan and zoom, then tap a request marker for details. The location button returns to your position.'],
    'helper.nearby':['Review before accepting','See the closest request here, or open View all. Read the details before accepting.'],
    'perks.points':['Points and helper level','Points are your rewards balance. Your medal depends on completed helps. Spending points does not lower your level.'],
    'perks.offers':['Explore offer details','Read the terms and points cost, if any. Opening details does not spend points.'],
    'activity.stats':['Your activity summary','View lifetime helps, level and points balance. The date filter changes the history only.'],
    'activity.filters':['Filter your history','Choose all activity, help given, help received, or points.'],
    'activity.history':['Your activity details','Check status and dates. Open available entries to view mission details.'],
    'account.profile':['Your account details','Review and edit your personal information here.'],
    'account.settings':['Settings and support','Change language, navigation app and appearance, or contact support.'],
    'account.guide':['Replay anytime','Restart the tour here. Skip guide stops all automatic tips until you restart it.']
  }
}
const he: Copy = {
  title:'מדריך שימוש',next:'הבא',previous:'הקודם',finish:'הבנתי',skip:'דלג על המדריך',restart:'הפעלת המדריך מחדש',error:'שמירת ההתקדמות נכשלה. נסו שוב.',counter:'מתוך',
  steps:{
    'home.request':['צריכים עזרה בדרך?','בחרו את הבעיה ואשרו את המיקום כדי לבקש עזרה ממישהו קרוב.'],
    'home.help':['יכולים לעזור?','כאן רואים בקשות קרובות ובוחרים בקשה שתוכלו לעזור בה.'],
    'home.perks':['גלו את ההטבות','כאן נמצאים המבצעים, יתרת הנקודות ורמת העזרה שלכם.'],
    navigation:['העמודים שלכם','בסרגל התחתון תמצאו את הבית, ההטבות, הפעילות והחשבון. בכל עמוד יוצג הסבר קצר בביקור הראשון.'],
    'request.services':['בחרו את הבעיה','בחרו את סוג העזרה. בחירת הכרטיס בלבד אינה שולחת בקשה.'],
    'request.next':['ממשיכים לשלב הבא','אחרי בחירת הבעיה לחצו הבא. אפשר לחזור ולשנות את הבחירה.'],
    'details.note':['תארו את הבעיה','הוסיפו הערה שתעזור להבין את המצב. אין לכתוב סיסמאות או מידע רגיש.'],
    'details.photo':['תמונה יכולה לעזור','הוספת תמונה היא רשות. ודאו שהיא מסבירה את הבעיה ולא חושפת מידע פרטי.'],
    'details.next':['עוברים לבדיקת המיקום','הבא פותח את שלב המיקום. בקשת העזרה עדיין לא נשלחה.'],
    'location.position':['אשרו את המיקום','בדקו את המיקום לפני השליחה. אפשר לרענן אותו או לבחור אותו ידנית.'],
    'location.submit':['שליחת הבקשה','לאחר בדיקת הפרטים והמיקום, לחצן שליחת הבקשה מפרסם אותה. המדריך לא שולח אותה עבורכם.'],
    'helper.availability':['הזמינות שלכם','הזמינות מתעדכנת אוטומטית. בקשת עזרה לעצמכם משהה אותה עד לסיום הבקשה.'],
    'helper.map':['בקשות קרובות במפה','הזיזו והגדילו את המפה ולחצו על סימון בקשה לפרטים. לחצן המיקום מחזיר אתכם למיקומכם.'],
    'helper.nearby':['בדקו לפני שמקבלים','כאן הבקשה הקרובה ביותר. הצגת הכול פותחת את היתר. קראו את הפרטים לפני קבלת הבקשה.'],
    'perks.points':['נקודות ורמת עזרה','הנקודות הן יתרת ההטבות. המדליה נקבעת לפי עזרות שהושלמו. שימוש בנקודות לא מוריד רמה.'],
    'perks.offers':['פרטי ההטבות','קראו את התנאים ואת עלות הנקודות, אם יש. פתיחת הפרטים לא משתמשת בנקודות.'],
    'activity.stats':['סיכום הפעילות','כאן סך העזרות, הרמה ויתרת הנקודות. סינון התאריכים משנה רק את ההיסטוריה.'],
    'activity.filters':['סינון ההיסטוריה','בחרו הכול, עזרה שנתתם, עזרה שקיבלתם או נקודות.'],
    'activity.history':['פרטי הפעילות','בדקו מצב ותאריך ופתחו רשומות זמינות לפרטי המשימה.'],
    'account.profile':['פרטי החשבון','כאן אפשר לבדוק ולעדכן את הפרטים האישיים.'],
    'account.settings':['הגדרות ותמיכה','שנו שפה, יישום ניווט ומראה, או פנו לתמיכה.'],
    'account.guide':['אפשר לחזור למדריך','כאן מפעילים את הסיור מחדש. דילוג מפסיק את כל ההסברים האוטומטיים עד להפעלה מחדש.']
  }
}
export const guideTranslations = { ar, he, en }
export function useGuideCopy(): Copy {
  const { i18n } = useTranslation()
  return i18n.language.startsWith('he') ? he : i18n.language.startsWith('en') ? en : ar
}
