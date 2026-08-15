# سَنَد v0.1

أول إصدار حقيقي لتطبيق سَنَد: تطبيق واحد للمحتاج والمتطوع.

## الموجود الآن

- إنشاء حساب وتسجيل دخول فعلي عبر Supabase Auth.
- بعد كل دخول تظهر شاشة اختيار الدور: **بدي مساعدة** أو **بدي أساعد**.
- طالب المساعدة يحدد نوع المشكلة، والتطبيق يأخذ GPS وينشئ بلاغاً حقيقياً في Postgres.
- المتطوع يفعّل توفره، والتطبيق يأخذ موقعه ويعرض البلاغات المفتوحة ضمن 20 كم.
- استلام الطلب Atomic: أول متطوع فقط يستطيع أخذه.
- تحديث حالة المهمة: استلم → في الطريق → وصلت → تمت المساعدة.
- صاحب الطلب يرى تحديث الحالة مباشرة عبر Supabase Realtime.
- ثيم أبيض/أزرق عربي RTL.

## 1) أنشئ مشروع Supabase

أنشئ مشروعاً جديداً ثم افتح **SQL Editor** وشغّل الملف:

`supabase/schema.sql`

## 2) ضع مفاتيح Supabase

انسخ:

`.env.example` → `.env`

ثم ضع Project URL و **Publishable key** من نافذة Connect في Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

لا تستخدم `service_role` أو secret key داخل التطبيق.

## 3) التثبيت والتشغيل

```bash
npm install
npx expo start
```

بعدها افتح Expo Go على Android/iPhone وامسح QR.

## ملاحظة عن تسجيل الحساب

إذا كان **Confirm email** مفعّلاً في Supabase Auth، المستخدم يحتاج تأكيد بريده قبل أول Login. للاختبار السريع تستطيع تعطيله مؤقتاً من إعدادات Auth في مشروع التطوير.

## ما لم ندخله بعد (v0.2)

- Push Notifications عند وصول بلاغ جديد.
- خريطة Native داخل التطبيق.
- إخفاء أرقام الهاتف / اتصال آمن.
- اعتماد المتطوع وخدماته (بنشر/بطارية/فتح سيارة...).
- صور للبلاغ.
- لوحة إدارة ومكافحة إساءة الاستخدام.
- Background location.

## البنية

```text
App.tsx
src/
  components/
  lib/
  screens/
  types/
supabase/
  schema.sql
```
