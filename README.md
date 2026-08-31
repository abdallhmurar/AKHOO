# AKHOO — Jerusalem Roadside & Civic Assistance

AKHOO (أخوو) is a Jerusalem-first mutual-aid platform for safe, non-emergency community and roadside support. Arabic is the primary language, with complete Hebrew and English support. Arabic and Hebrew render RTL; English renders LTR.

أخوو منصة مساندة مدنية تبدأ من القدس، وتربط من يحتاج مساعدة مجتمعية آمنة بمن يستطيع تقديمها. المنصة ليست بديلاً لخدمات الطوارئ.

## V2 status

This repository has been transformed in place from the V1 manual-screen architecture to AKHOO V2:

- Expo Router with typed, protected routes and deep links.
- Civic Signal design system and shared accessible components.
- Requester, helper, live-mission, community, rewards, activity, account, and safety flows.
- Arabic, Hebrew, and English fonts, copy, layout direction, and mirrored navigation.
- TanStack Query plus repository/service boundaries; active screens no longer call Supabase directly.
- Additive Supabase V2 migration with RLS, secured RPCs, private request media, and realtime mission data.

The V2 database migration is prepared but is not automatically applied to any linked production project. Validate it on staging first.

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
npm run test:migration
npm run e2e
```

The committed browser suite is deliberately read-only against Supabase. It covers authentication navigation and validation, first-launch language direction, and responsive mobile/web behavior without creating production data.

## Architecture

```text
app/                         Expo Router routes and route-group guards
  (auth)/                    welcome, login, signup, verification, recovery
  (tabs)/                    Home, Community, Activity, Account
  (requester)/requester/     emergency-to-matching request journey
  (helper)/helper/           onboarding-to-nearby-request journey
  mission/[missionId]/       live mission, chat, completion, rating, safety
  community/                 businesses, offers, AKHOO+, rewards, points
  account/                   profile, settings, language, privacy, safety
src/
  components/ui/             reusable Civic Signal primitives
  components/v2/             product-level composed components
  features/                  screen implementations by product domain
  providers/                 auth, language/direction, query, mission state
  repositories/              typed data access; Supabase boundary
  services/                  errors, media, preferences, query keys
  domain/                    civic categories, scenarios, and shared rules
supabase/migrations/
  0001_initial_schema.sql    preserved V1 baseline
  0017_sanad_v2_civic_platform.sql  additive V2 upgrade
```

See [SANAD V2 architecture](docs/SANAD_V2_ARCHITECTURE.md) for route ownership, data flow, security, and release gates.

## Database rollout

1. Back up the linked Supabase project.
2. Create or refresh a staging branch/project from production.
3. Run `npm run test:migration`.
4. Apply migrations to staging with the Supabase CLI.
5. Exercise requester/helper missions with two disposable staging users.
6. Verify RLS, signed private media, realtime events, push credentials, and rollback procedures.
7. Apply to production only after the staging sign-off.

The migration is additive: it preserves `profiles`, `help_requests`, existing partner/offer data, and legacy RPC fallbacks while adding V2 entities and synchronization.

## Visual previews

- [Arabic first launch](docs/previews/sanad-v2-language-ar.png)
- [English welcome](docs/previews/sanad-v2-welcome-en.png)
- [Arabic login RTL](docs/previews/sanad-v2-login-ar.png)
- [Hebrew login RTL](docs/previews/sanad-v2-login-he.png)
- [English login](docs/previews/sanad-v2-login-en.png)

## Release gates

- Apply and verify migration `0017` on staging.
- Configure EAS Android/iOS signing plus APNs/FCM credentials.
- Run physical-device checks for maps, location background mode, image permissions, push notifications, and RTL screen-reader navigation.
- Connect a production payment provider before enabling paid AKHOO+ membership; the current flow records a safe membership request and does not charge the user.
- Complete App Store / Google Play privacy, safety, moderation, and emergency-disclaimer review.
