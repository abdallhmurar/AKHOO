# E2E tests

```bash
npm run e2e
```

Boots `expo start --web` on port 8090 and runs the suite against it (see `playwright.config.ts`).

## What's in this committed suite

Only things that are **safe to run unattended, repeatedly, with no test database of their own**:

- `auth.spec.ts` - client-side form validation and navigation between login/signup/forgot-password. No submission ever succeeds; nothing reaches Supabase.
- `language.spec.ts` - AR/HE/EN detection and RTL/LTR rendering, driven via the browser's locale (the same signal `src/lib/i18n.ts`'s `detectDeviceLanguage()` reads), not by logging in and using the language picker.
- `responsive.spec.ts` - no horizontal overflow on the auth screen at 390/430/768/1024/1440/1920px.

## What's deliberately NOT in this committed suite

This project has one Supabase project - the real one, linked via `npx supabase link`. There is no separate, disposable test project. Committing tests that sign up real accounts, create real help requests, or call RPCs would mean every CI/local run mutates production data, which is exactly what section 30 of the stabilization brief said not to do ("Do NOT point destructive tests at production data").

Instead, the full backend-dependent lifecycle is exercised via **throwaway scripts** (`node .e2e-*.mjs` at the repo root, using `@supabase/supabase-js` directly with disposable `sanad-e2e-*@example.com` accounts, always deleted afterward with `npx supabase db query --linked "delete from auth.users where email like 'sanad-e2e-%'"`). This is the pattern used throughout this project's development for anything that touches real data. It covers:

- Full signup -> login -> logout.
- Requester creates a request -> volunteer sees it -> accepts (atomic claim) -> status updates -> volunteer marks "تمت المساعدة" -> requester confirms -> `completed` + exactly one points ledger row.
- The reject-confirmation path (status reverts to `arrived`, no points).
- RLS/security regressions (see the security-fix verification pattern used in this project's stabilization round - disposable account attempts a self-privilege-escalation write, asserts it's neutralized).
- Concurrent-accept race (two clients calling `accept_help_request` on the same row - exactly one should win).

If a second, disposable Supabase project is ever provisioned specifically for CI, these throwaway scripts should be promoted into this committed suite pointed at that project - not at the one linked today.

## Manual-only

- Real push notification delivery (requires physical device tokens).
- The Android dev-client build itself (`eas build`) - not something Playwright can exercise.
- Visual/RTL spot-checks across every screen (not just the auth screen) in all three languages - see the stabilization round's report for the screenshots taken during that pass; repeating that fully automatically would need a maintained visual-regression baseline, which hasn't been set up.
