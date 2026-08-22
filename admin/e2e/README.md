# Admin E2E tests

```bash
npm run e2e
```

Boots `vite --port 5174` and runs the suite against it (see `playwright.config.ts`).

## What always runs, no setup required

- `login.spec.ts` - login form, empty-submit, invalid-credentials error. No account created, no mutation.
- `protected-routes.spec.ts` - unauthenticated direct navigation to every protected path shows the login form, never the admin shell.
- `non-admin-denial.spec.ts` - signs up a real disposable `sanad-e2e-admindeny-*@example.com` account, confirms it's denied access. Safe: this project has one Supabase project (the real one), same posture as the root project's `e2e/README.md` - only ever creates a throwaway, never-admin account.
- `rtl-ltr.spec.ts` (unauthenticated part) / `responsive.spec.ts` (unauthenticated part) - AR/HE/EN + RTL/LTR and no-horizontal-overflow checks against the Login page.
- `businesses-offers-security.spec.ts` - a disposable `sanad-e2e-r2security-*@example.com` account, confirms every Round 2 admin RPC (`admin_upsert_business`, `admin_set_business_active`, `admin_upsert_offer`, `admin_set_offer_status`, `admin_set_review_hidden`) rejects it with "Not authorized", and that it can't read `admin_audit_log`.

## What requires a one-time manual setup

`dashboard.spec.ts`, `pages-render.spec.ts`, `businesses-offers-reviews.spec.ts`, and the authenticated halves of `rtl-ltr.spec.ts`/`responsive.spec.ts` need a **real, permanent admin account** to log in as - `admin_bootstrap_first_admin()` only works while zero admins exist (not true on this linked project), and there is no promote-to-admin RPC by design.

**One-time setup:**

1. Create a normal account through the admin login screen's Supabase project (or reuse an existing non-production test account you control).
2. In the Supabase SQL editor, run:
   ```sql
   select set_config('sanad.privileged_write', 'on', true);
   update profiles set is_admin = true where id = '<that account's uuid>';
   ```
3. Copy `admin/.env.e2e.example` to `admin/.env.e2e` (gitignored) and fill in its email/password.

**Important:** do not use the `sanad-e2e-*@example.com` prefix for this account - it would be swept up by the mobile suite's `email like 'sanad-e2e-%'` cleanup query.

Every gated spec calls `test.skip(!process.env.E2E_ADMIN_EMAIL, ...)`, so the suite stays green on a fresh clone with none of this configured, and becomes fully real once it is. These specs only ever *read* real production data through this account, or create+mutate their own disposable target rows - never a real user/request/volunteer.

## What's deliberately NOT in this suite

Anything that bans/unbans a real user, cancels a real request, or verifies/unverifies a real volunteer. Those RPCs (`admin_set_user_banned`, `admin_cancel_help_request`, `admin_set_volunteer_verified`) are exercised the same way the root project exercises its own mutating RPCs: throwaway `node .e2e-*.mjs` scripts against disposable target rows, run manually, never committed.
