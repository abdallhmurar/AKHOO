# SANAD V2 browser checks

Run `npm run e2e`. Playwright starts the Expo Router web build on port 8090.

The committed suite is intentionally read-only against Supabase. It covers:

- the V2 login, signup, and recovery route graph;
- client-side validation without submitting credentials;
- first-launch Arabic, Hebrew, and English direction handling;
- the 390 px mobile target and wider responsive layouts.

Mission lifecycle, RLS, push delivery, and payment verification require a disposable Supabase staging project. They must not run against the production Jerusalem project from unattended CI.
