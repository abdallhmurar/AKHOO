# AKHOO — Jerusalem Roadside & Civic Assistance

AKHOO (أخوو) is a Jerusalem-first mutual-aid platform for safe, non-emergency community and roadside support. Arabic is the primary language, with complete Hebrew and English support. Arabic and Hebrew render RTL; English renders LTR.

أخوو منصة مساندة مدنية تبدأ من القدس، وتربط من يحتاج مساعدة مجتمعية آمنة بمن يستطيع تقديمها. المنصة ليست بديلاً لخدمات الطوارئ.

## V2 status

This repository has been transformed in place from the V1 manual-screen architecture to AKHOO V2:

- Expo Router with typed, protected routes and deep links.
- Civic Signal design system and shared accessible components.
- Requester, helper, live-mission, community, activity, and account flows.
- Arabic, Hebrew, and English fonts, copy, layout direction, and mirrored navigation.
- TanStack Query plus repository/service boundaries; active screens no longer call Supabase directly.
- RLS-secured Supabase schema (`supabase/migrations/0001`-`0016`), applied incrementally - no separate staged V2 migration exists.

An earlier, broader "civic assistance" rewrite (nine assistance categories, in-app chat, a rewards marketplace, paid membership billing) was scoped back out after review because it didn't match the real product or a migration that was ever applied. What's described in this README is the current, real app.

## Stack

- Expo SDK 57 / React Native 0.86 / React 19 / TypeScript strict mode
- Expo Router typed routes
- Supabase Auth, Postgres, Storage, Realtime, and Edge Functions
- TanStack Query for server state
- MapLibre on native and web
- i18next with Arabic and Hebrew RTL
- Noto Sans Arabic, Noto Sans Hebrew, and Inter

## Run locally

```bash
npm install
cp .env.example .env
npm run web
```

Required public client variables:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Never place a `service_role` key in the Expo client.

MapLibre requires a custom development client on Android and iOS; it does not run inside Expo Go:

```bash
npx eas build --profile development --platform android
npx expo start --dev-client
```

## Quality commands

```bash
npm run typecheck
npm run lint
npm test
npm run e2e
```

The committed browser suite is deliberately read-only against Supabase. It covers authentication navigation and validation, first-launch language direction, and responsive mobile/web behavior without creating production data.

## Architecture

```text
app/                         Expo Router routes and route-group guards
  (auth)/                    welcome, login, signup, forgot-password, reset-password
  (tabs)/                    Home, Community, Activity, Account
  (requester)/requester/     emergency-to-matching request journey
  (helper)/helper/           onboarding-to-nearby-request journey
  mission/[missionId]/       live mission screen
  community/                 businesses, offers, AKHOO+ membership
src/
  components/ui/             reusable Civic Signal primitives
  components/v2/             product-level composed components
  features/                  screen implementations by product domain
  providers/                 auth, language/direction, query, mission state
  repositories/              typed data access; Supabase boundary
  services/                  errors, media, preferences, query keys
supabase/migrations/
  0001_initial_schema.sql    baseline schema
  0002-0016                  incremental features, hardening, and fixes
```

## Database rollout

1. Back up the linked Supabase project before applying new migrations.
2. Create or refresh a staging branch/project from production.
3. Apply pending migrations to staging with the Supabase CLI.
4. Exercise requester/helper missions with two disposable staging users.
5. Verify RLS, realtime events, push credentials, and rollback procedures.
6. Apply to production only after the staging sign-off.

## Visual previews

- [Arabic first launch](docs/previews/sanad-v2-language-ar.png)
- [English welcome](docs/previews/sanad-v2-welcome-en.png)
- [Arabic login RTL](docs/previews/sanad-v2-login-ar.png)
- [Hebrew login RTL](docs/previews/sanad-v2-login-he.png)
- [English login](docs/previews/sanad-v2-login-en.png)

## Release gates

- Apply and verify pending migrations on staging before production.
- Configure EAS Android/iOS signing plus APNs/FCM credentials.
- Run physical-device checks for maps, location background mode, image permissions, push notifications, and RTL screen-reader navigation.
- Connect a production payment provider before enabling paid AKHOO+ membership; the current flow records a safe membership request and does not charge the user.
- Complete App Store / Google Play privacy, safety, moderation, and emergency-disclaimer review.
