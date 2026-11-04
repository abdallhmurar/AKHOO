export const nearbyAlertCopy = {
  ar: {
    title: 'ننبّهك إذا حدا احتاج مساعدة قريب منك؟',
    disclosure: 'أخوو بجمع موقعك وبحدّثه على سيرفر أخوو عشان يبعثلك إشعارات طلبات المساعدة القريبة، حتى لما التطبيق بالخلفية أو مش عم تستخدمه. التفعيل اختياري، وبتقدر توقفه بأي وقت من حسابي. على أندرويد بيظهر إشعار مستمر وقت تحديث الموقع. إذا النظام وقف التطبيق بالكامل، بنعتمد آخر موقع حديث وصلنا لحد ما تفتحه من جديد.',
    enable: 'موافق، فعّل', later: 'مش هلا', setting: 'طلبات قريبة بالخلفية',
    off: 'متوقفة', on: 'مفعّلة', needsPermission: 'بدها تفعيل الأذونات',
    permission: 'فعّل إشعارات أخوو، واسمح بالموقع أثناء الاستخدام وبالخلفية. على أندرويد اختار «السماح طوال الوقت». على آيفون اختار «دائمًا». بتقدر تعدّلهم من إعدادات التلفون.',
    failure: 'ما قدرنا نفعّل التنبيهات. تأكد من الإنترنت والأذونات وجرّب مرة ثانية.',
    disableFailure: 'تعذّر حفظ الإيقاف بالكامل. اتصل بالإنترنت وافتح التطبيق لنحاول كمان مرة. بتقدر توقف إذن الموقع من إعدادات التلفون فورًا.',
    settings: 'إعدادات التلفون', cancel: 'إغلاق',
    backgroundTitle: 'أخوو · طلبات المساعدة القريبة',
    backgroundBody: 'عم نحدّث موقعك لتنبيهك لطلب قريب. بتقدر توقفها من حسابي.'
  },
  en: {
    title: 'Get notified when someone nearby needs help?',
    disclosure: 'AKHOO collects your location and updates it on AKHOO servers to send nearby help-request alerts, even when the app is in the background or not in use. This is optional and can be turned off in My Account. Android shows an ongoing notification while location updates run. If the system stops the app completely, we use the last recent location until you reopen it.',
    enable: 'Agree and enable', later: 'Not now', setting: 'Nearby alerts in the background',
    off: 'Off', on: 'Enabled', needsPermission: 'Permissions needed',
    permission: 'Enable AKHOO notifications and allow location while using the app and in the background. Choose “Allow all the time” on Android or “Always” on iPhone in your phone settings.',
    failure: 'Could not enable alerts. Check your connection and permissions, then try again.',
    disableFailure: 'Could not fully save the off setting. Reconnect and reopen the app to retry. You can immediately revoke location access in phone settings.',
    settings: 'Phone settings', cancel: 'Close',
    backgroundTitle: 'AKHOO · Nearby help requests',
    backgroundBody: 'Updating your location for nearby alerts. Turn off in My Account.'
  },
  he: {
    title: 'לקבל התראה כשמישהו קרוב צריך עזרה?',
    disclosure: 'AKHOO אוספת את המיקום שלך ומעדכנת אותו בשרתים שלה כדי לשלוח התראות על בקשות עזרה קרובות, גם כשהאפליקציה ברקע או אינה בשימוש. ההפעלה היא לבחירתך ואפשר לכבות אותה בחשבון שלי. באנדרואיד מוצגת התראה קבועה בזמן עדכון המיקום. אם המערכת עוצרת את האפליקציה לגמרי, נשתמש במיקום האחרון העדכני עד לפתיחה מחדש.',
    enable: 'אישור והפעלה', later: 'לא עכשיו', setting: 'התראות קרובות ברקע',
    off: 'כבוי', on: 'מופעל', needsPermission: 'נדרשות הרשאות',
    permission: 'יש להפעיל התראות ולאפשר מיקום בזמן השימוש וברקע. באנדרואיד יש לבחור באישור מיקום כל הזמן, ובאייפון באפשרות תמיד, בהגדרות הטלפון.',
    failure: 'לא ניתן להפעיל התראות. בדקו את החיבור וההרשאות ונסו שוב.',
    disableFailure: 'לא ניתן לשמור את הכיבוי במלואו. התחברו לאינטרנט ופתחו מחדש כדי לנסות שוב. אפשר לבטל מיד את הרשאת המיקום בהגדרות הטלפון.',
    settings: 'הגדרות הטלפון', cancel: 'סגירה',
    backgroundTitle: 'AKHOO · בקשות עזרה קרובות',
    backgroundBody: 'המיקום מתעדכן לצורך התראות קרובות. ניתן לכבות בחשבון שלי.'
  }
} as const
export function getNearbyAlertCopy(language: string) {
  return nearbyAlertCopy[language.startsWith('he') ? 'he' : language.startsWith('en') ? 'en' : 'ar']
}
