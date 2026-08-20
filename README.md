# سَنَد

تطبيق يربط بين شخص محتاج مساعدة على الطريق (بطارية، بنشر، وقود، سيارة مقفلة...) ومتطوعين قريبين منه. Expo/React Native + Supabase، عربي RTL أولاً مع دعم عبري وإنجليزي.

## الموجود حالياً

- تسجيل حساب/دخول عبر Supabase Auth، استرجاع كلمة المرور، استعادة الجلسة عند إعادة فتح التطبيق.
- طالب المساعدة: اختيار نوع المشكلة، ملاحظة، صورة اختيارية، GPS، إنشاء بلاغ حقيقي.
- المتطوع: تفعيل التوفر (GPS + إشعارات push)، عرض البلاغات القريبة على خريطة حقيقية (MapLibre)، قبول Atomic (متطوع واحد فقط يفوز بالطلب).
- دورة حياة الطلب: `open → accepted → on_the_way → arrived → awaiting_confirmation → completed` (أو `cancelled`) - **صاحب الطلب هو من يؤكد إنهاء المهمة**، المتطوع لا يقدر يُنهيها من طرفه لحاله.
- نقاط للمتطوع تُمنح فقط بعد تأكيد صاحب الطلب، عبر سجل معاملات (ledger) على السيرفر ما بينكتب مرتين لنفس الطلب.
- تحديثات Realtime عبر Supabase (حالة الطلب، ظهور/اختفاء البلاغات).
- لوحة إدارة: حظر مستخدم، توثيق متطوع، إلغاء طلب - محمية بـ RLS + دوال SECURITY DEFINER.
- ثلاث لغات كاملة (عربي RTL / عبري RTL / إنجليزي LTR) عبر i18next، مع تبديل فوري بدون إعادة تشغيل.
- تجربة سَنَد+ التجارية (مرحلة أولى): تبويبات رئيسية، عرض شركاء/مزايا، تهيئة سوق (market config) للقدس كتجربة تجريبية أولى.

## ما لم يُبنَ بعد

- مدفوعات SANAD+ فعلية، استبدال مكافآت الشركاء عبر QR، لوحة تحكم للشركاء.
- مسار احترافي مدفوع (professional fallback) عند غياب متطوعين.
- بناء iOS (يحتاج حساب Apple Developer - قرار لم يُتخذ بعد).

## البنية التقنية

- **Expo SDK 57 / React Native 0.86 / React 19 / TypeScript (strict)**. لا توجد مكتبة تنقّل (navigation) خارجية - `App.tsx` يدير شاشة/تبويب الحالة يدوياً.
- **Supabase**: Postgres + Auth + Storage + Realtime + Edge Function واحدة (`notify-new-request`، ترسل push عند بلاغ جديد).
- **الخريطة**: `@maplibre/maplibre-react-native` على الموبايل، `maplibre-gl` مباشرة على الويب (بدون WebView، بدون Mapbox) - بلاطات مجانية من OpenFreeMap. راجع "الخريطة" أدناه.
- **i18n**: `i18next` + `react-i18next`، مع `src/lib/direction.ts` لتوفير RTL/LTR يدوياً (التطبيق لا يعتمد على `I18nManager` تبع React Native).

## ⚠️ مهم: هذا التطبيق لا يعمل على Expo Go

`@maplibre/maplibre-react-native` مكتبة native لازم تُبنى ضمن dev client مخصص - لا تعمل داخل تطبيق Expo Go الجاهز من المتجر. لازم:

```bash
npx eas build --profile development --platform android
```

ثم تثبيت الـ APK الناتج على جهازك/المحاكي، وبعدها:

```bash
npx expo start --dev-client
```

للتطوير على الويب (لا يحتاج dev client إطلاقاً):

```bash
npx expo start --web
```

## 1) إعداد Supabase

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push
```

**`supabase/migrations/*.sql` هو مصدر الحقيقة الوحيد للسكيمة** - وليس `supabase/schema.sql` (ذاك الملف أصبح ملف توثيق فقط، راجعه لتفاصيل أكثر). `db push` يطبّق كل الـ migrations بالترتيب على مشروعك.

بعد أول تشغيل، أنشئ حساباً عادياً من داخل التطبيق، ثم فعّل أول أدمن (مرة واحدة فقط، يفشل تلقائياً إذا كان يوجد أدمن أصلاً):

```sql
select public.admin_bootstrap_first_admin();
-- شغّلها من SQL Editor وأنت مسجّل دخول بنفس الحساب اللي بدك تصير أدمن فيه،
-- أو عبر supabase-js بعد تسجيل الدخول بنفس الحساب.
```

الـ Storage buckets (`avatars`, `request-photos`) تُنشأ تلقائياً ضمن الـ migrations.

## 2) متغيرات البيئة

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

**لا تستخدم `service_role` أو أي secret key داخل التطبيق أو أي كود client-side إطلاقاً.** الوحيد اللي يستخدم `service_role` هو Edge Function `notify-new-request`، وهو سيرفر-سايد بالكامل.

## 3) التثبيت والتشغيل

```bash
npm install
npx expo start --web        # ويب، بدون dev client
npx expo start --dev-client # موبايل، يحتاج dev client مبني مسبقاً (راجع أعلاه)
```

## الأوامر المتاحة

```bash
npm run typecheck   # tsc --noEmit
npm run lint         # ESLint
npm test             # اختبارات وحدة (vitest) - منطق نقي فقط: phone.ts, location.ts, rpcErrors.ts...
npm run e2e          # Playwright - يحتاج خادم ويب شغّال على localhost (راجع e2e/README.md)
```

## الخريطة

- **الموبايل**: `src/components/SanadMap.native.tsx` عبر `@maplibre/maplibre-react-native`.
- **الويب**: `src/components/SanadMap.web.tsx` عبر `maplibre-gl` مباشرة. **ملاحظة مهمة**: حزمة الـ Web Worker تبع `maplibre-gl` (`maplibre-gl-worker.mjs` + `maplibre-gl-shared.mjs`) لا يبنيها Metro تلقائياً - لازم تبقى موجودة في `public/` (تُنسخ كما هي ضمن تصدير الويب)، وإلا الخريطة بترجع خلفية فاضية بدون شوارع/تسميات رغم إن الماركر بيظهر.
- التهيئة المشتركة (نقطة مركز احتياطية، حدود الزوم، إلخ) في `src/lib/mapProvider.ts`.
- Provider البلاطات: OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`) - مجاني، بدون مفتاح API.

## تصدير الويب / النشر

```bash
npx expo export --platform web --output-dir dist
```

للنشر على مسار فرعي (مثل GitHub Pages):

```bash
EXPO_WEB_BASE_PATH=/sanad npx expo export --platform web --output-dir dist
```

(`app.config.js` يقرأ هذا المتغير ويضبط `experiments.baseUrl` فقط عند تعيينه - لا يؤثر على التشغيل العادي أو البناء الأصلي).

## الترجمة (i18n)

- الملفات: `src/locales/{ar,en,he}.json` - **يجب أن يبقى نفس مجموعة المفاتيح بالضبط في الثلاثة**. أي شاشة جديدة لازم تستخدم `t('...')` من `react-i18next`، وتستخدم `useIsRTL()` / `dirStyles()` من `src/lib/direction.ts` بدل الاعتماد على اتجاه ثابت.
- نصوص أذونات نظام التشغيل (مثل رسالة إذن الموقع في `app.json`) لا تقدر تستخدم `t()` وقت التشغيل - إذا لزم تعديلها حافظ على وجود النسخ الثلاث بالنص نفسه.

## البنية

```text
App.tsx
src/
  components/     مكونات مشتركة (خريطة، أزرار، بطاقات...)
  lib/            منطق بدون واجهة (supabase client, i18n, location, phone, rpcErrors...)
  screens/        شاشة لكل خطوة بالتطبيق
  locales/        ar.json / en.json / he.json
  types/
supabase/
  migrations/     مصدر الحقيقة للسكيمة - بالترتيب الرقمي
  functions/      Edge Functions (Deno)
  schema.sql      توثيق فقط - يوجّه لـ migrations
e2e/              اختبارات Playwright المُثبّتة بالمستودع
```
