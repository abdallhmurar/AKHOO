# READ ME FIRST — AKHOO shared working file

**For every agent (Claude Code, Codex, anyone else) and for the owner.**
Read this whole file before you change anything. When you finish a piece of work, add an entry to the **Change log** (section 8) in the same commit, and update the **Current state** (section 3) if it changed. If something here is out of date, fix it. This file lives on `main`; read the latest with `git fetch origin && git show origin/main:READ_ME_FIRST.md`.

## ملخص بالعربي (للمالك)
- هاد الملف هو "الدفتر المشترك": فيه وين وصلنا، مين مسؤول عن شو، وكل تعديل بنعمله.
- أي حدا بيشتغل (Claude أو Codex) لازم يقراه قبل ما يبدأ، ويكتب سطر بسجل التعديلات بعد ما يخلص.
- **ممنوع** إطلاق رسمي (تقديم لـApple، نشر Production، لمس الأندرويد) بدون كلمة صريحة من المالك. وأي خطوة خارجية بتنشرح قبل ما تنعمل.
- الأندرويد مجمّد لحد ما Google توافق على الإنتاج.

## 1. Rules (non-negotiable)
1. **No official release without the owner's explicit OK**: no App Store review submission, no Play production request, no store listing change that goes live. Building, TestFlight uploads and OTA updates are allowed only when the owner asked for them in that task. Explain every outward-facing step to the owner **before** doing it.
2. **Android is frozen** until Google approves production access (closed test: 12 testers, 14 days). Do not build, publish, OTA or change Play Console for Android. iOS OTAs must always use `--platform ios`.
3. **Separate working copies.** Each agent works in its own git worktree/folder and its own branches; never switch branches or commit inside another agent's folder, never push to another agent's branch. Never force-push. Keep unrelated changes.
4. **Secrets never go in git.** Tokens and keys live in the git-ignored `credentials/` folder (Expo, Supabase, App Store Connect key, Play service account). Never print them in logs or commit them.
5. **Do not invent data.** Do not claim something is verified unless you checked it; say "not verified" and why.
6. **Version numbers are shared state.** Reserve the next iOS/Android build number **and the next SQL migration number** in section 5 *before* using them, so two builds or two migrations never collide (two files were both named `0045` once).
7. Follow `AGENTS.md` (commit and push finished work to the intended branch after validation).

## 2. Who owns what (suggested split — owner may change it)
| Area | Owner |
|---|---|
| iOS/web design, motion, UI screens (`*.ios.tsx`, `*.web.tsx`, `components/motion`) | Codex |
| Supabase (SQL migrations, edge functions, auth config), admin panel, translations, email, build/OTA pipeline | Claude |
| Decisions, official releases, store accounts, legal | Owner |

If you must touch another owner's area, say so in the change log and keep the change small.

## 3. Current state (updated 2026-10-22)
**Apps**
- **App Store update in review again**: 2.0.2 build 28 is `WAITING_FOR_REVIEW`, resubmitted 2026-10-22 by Claude at the owner's request (new review `62a81be4-eb0f-4bc5-b9cc-aadce54fc68b`; Codex's first one, `71dd1830-…`, was cancelled so the screenshots could be replaced, because Apple blocks screenshot edits while waiting for review). `releaseType: MANUAL` (changed from `AFTER_APPROVAL`): after Apple approves, **nothing goes live until the owner says "release"**, then press "Release This Version" in App Store Connect or `PATCH` the version with a release request. No scheduled date. Version `4ded2e33-c382-493f-9d39-9a720fce5d17`. Source `64dd4ec`, recorded on `release/ios-appstore-20261022`. Same binary, no new build or OTA. Build 28 has OTA disabled, including when distributed through the App Store.
- **App Store (live)**: 2.0.1 build 17, `READY_FOR_SALE`. Gets iOS OTAs on channel `production`, runtime `2.0.1`, published from branch `ota/ios-2.0.1-translations` (latest OTA contains: AKHOO+ removal, Hebrew name fix, business/user-text translation, legal text, offers-list fix, billing row removed).
- **TestFlight (owner's iPhone)**: 2.0.2 builds 18–28 exist; **latest is 28** (internal group "Test"). It is built from branch `ios/testflight-fixes-20261020` (Codex's design branch + fixes). TestFlight binaries have `updates.enabled: false`, so **an OTA can never reach them**; only a new build can. Builds 26 and 27 are superseded.
- **Android**: build 7 (2.0.0, versionCode 7) in the closed test; **12 testers, day 10 of 14 on 2026-10-22** (confirmed from Play Console screenshots); "request production access" unlocks about 2026-10-26. Frozen (rule 2).
- **Web** `akhoo.vercel.app` and **Admin** `akhoo-admin.vercel.app` deploy from `main` (Vercel; the third Vercel project `dist` is the marketing website, see below, and must NOT build from `main`). Since 2026-10-22 the website runs the new design (build 28 source). CI runs on `main`.
- **Marketing website**: folder `website/` on branch `web/marketing-local-20261021` (Codex). It reads the public partner feed `get_website_partners` with the anon key. Hosted as a `noindex` preview on the Vercel project `dist` at https://dist-mu-lilac-59.vercel.app/?lang=ar (`?lang=en|he` too). **It is deployed by hand as static files** (`website/dist/` uploaded with the Vercel CLI), never from the repo root. The project is still linked to the GitHub repo by accident, so on 2026-10-22 pushes to `main` made Vercel build the whole Expo app there and replaced the site with a 404 (output directory empty, it served `public/`). Fixed the same day: the last good deployment (`dpl_Dqfoj9oeB5dQe2gnmhfXv7xJLBYe`, 2026-10-21 21:19) was promoted back and the owner set "Ignored Build Step: Don't build anything" (`commandForIgnoringBuildStep: exit 0`). Do not remove that setting. The deployment-specific `dist-*.vercel.app` URLs need a Vercel login; only the alias above is public.
- **Admin "website partners" card**: lets an admin choose which businesses appear on the website and their display names (Codex, branch `feat/admin-website-partners-20261022`). Merged into `main` by Claude on 2026-10-22; the live admin shows it after the Vercel deploy.

**Backend** (Supabase project `zmpwdufahjmlxfwzafvr`)
- Migrations `0001`–`0047` applied. `0045` business translations, `0046` translation quota, `0047` revoked anonymous execute on SECURITY DEFINER functions and limited request-photo listing to the owner.
- Website partners (Codex): table `website_partners` (RLS, admin read only), `admin_save_website_partner` (admin only) and `get_website_partners` (callable by anyone by design; returns only name, logo and caption of enabled, verified, active businesses). Applied to production on 2026-10-21 under the file name `0045_website_partners.sql`; the repo file is renamed `0048_website_partners.sql` because `0045` was already taken. 2 businesses enabled (the AKHOO store and the lawyer). Note: migration `0047` revokes anonymous execute on every SECURITY DEFINER function that exists when it runs; it ran before `get_website_partners` existed, so do not re-run `0047` on this database.
- Edge functions deployed: `delete-account`, `geocode`, `notify-new-message`, `notify-new-request`, `notify-support-reply`, `send-broadcast-notification`, `translate-content`, `translate-user-text`.
- Auth: Google and Apple sign-in on; email auto-confirm **on**; default Supabase mailer (2 emails/hour, effectively unusable for password reset) — custom SMTP **pending** (plan: Gmail app password). Redirect allow-list includes `akhoo.vercel.app`.
- Content: 2 verified businesses and 2 live offers (sticker, lawyer consultation), all translated to he/en. The owner reports the lawyer agreed to the offer.
- A broadcast announced "new look on 27 October" (sent 2026-10-18, shown until 2026-10-28).

**Branches**
| Branch | What it is | Owner |
|---|---|---|
| `main` | Web + admin + backend + the iOS design + shared fixes. Since 2026-10-22 it contains the build 28 source (merge `a5c041d`), so it **can be bundled for native again** and the website shows the new design. | Claude |
| `ota/ios-2.0.1-translations` | Hotfix line for the live App Store 2.0.1; the only base for production iOS OTAs. | Claude |
| `ios/testflight-design-20261017` | The approved iOS design (builds 18–25). Do not push here except Codex. | Codex |
| `ios/testflight-fixes-20261020` | Design branch + fixes (builds 26–28). Next TestFlight builds come from here. | Claude |
| `fix/translate-everything` | Mirror of `main` used for pushes. | Claude |
| `release/ios-appstore-20261022` | Exact build 28 source plus official App Store submission record and release notes. | Codex |
| `feat/admin-website-partners-20261022` | Admin card for the website partner strip + its migration and SQL test. Merged into `main` 2026-10-22. | Codex |
| `web/marketing-local-20261021` | The local marketing website (`website/`). Not deployed; not merged. | Codex |

## 4. How to ship (checked recipes)
- **iOS OTA to the live App Store build**: cherry-pick the fix onto `ota/ios-2.0.1-translations` in a separate worktree with `npm ci`; run `npx expo export --platform ios`; then `eas update --branch production --platform ios --environment production`. Never from `main`: it now holds the 2.0.2 design and the live 2.0.1 binary must only receive the 2.0.1 hotfix line.
- **TestFlight build**: new commit on `ios/testflight-fixes-20261020`, bump `AKHOO_IOS_BUILD_NUMBER` in `eas.json`, `eas build --platform ios --profile testflight`, then `eas submit --platform ios --profile testflight --id <build>` (needs `credentials/ios`).
- **Supabase**: SQL through the Management API with the token in `credentials/supabase-token.txt`; functions with `supabase functions deploy <name> --project-ref zmpwdufahjmlxfwzafvr --use-api --no-verify-jwt`. Test risky DB behaviour inside a `DO` block that ends with `raise exception` so everything rolls back. Reads can lag a few seconds after a config PATCH.
- **Admin/web**: push to `main`; Vercel deploys.
- **After 2.0.2 is live on the App Store**: that binary was built with the TestFlight profile and has OTA updates disabled, so `ota/ios-2.0.1-translations` only reaches the remaining 2.0.1 users. Any fix for 2.0.2 users needs a new binary (next free build 29) and a new App Store review.
- **Official release of the new design (in review, manual release)**: Apple accepts the already uploaded, store-signed 2.0.2 (28), marked `APP_STORE_ELIGIBLE`. It contains the approved design and native fixes. That exact binary was submitted with the Arabic listing, release notes, new screenshots and updated review notes through `reviewSubmissions` (create submission, add the version as an item, PATCH `submitted: true`). Codex's first submission used automatic release after approval; the resubmission uses `MANUAL`. The owner's 2026-10-22 instruction supersedes the earlier 27 October plan. Do not rebuild or send an OTA merely to rename the TestFlight profile. Details: `docs/appstore-release-2026-10-22.txt`.

## 5. Version registry (reserve before building)
| Platform | Used | Next free |
|---|---|---|
| iOS App Store | 2.0.0 (builds ≤16), 2.0.1 (17); 2.0.2 (28) in review, manual release | Build **29**, not reserved. Builds 18–28 already exist; build 28 reused without rebuilding. |
| Android | versionCode 7 | 8 (do not build yet) |
| Supabase SQL migrations | `0001`–`0048` (`0048` = website partners, applied under the name `0045`) | **0049** |

## 6. Credentials map (never commit)
`credentials/expo-token.txt`, `credentials/supabase-token.txt`, `credentials/ios/AuthKey_*.p8`, `credentials/android/*.json`. Planned: `credentials/smtp-app-password.txt`.

## 7. Open items and decisions
**Decisions waiting for the owner**: what to tell Android users about 27 October; widen push notifications after launch or not; which Gmail account to use for app emails. The native release source decision is resolved: exact build 28 source, no blanket merge from `main`.
**Work not done**: Apple's approval of 2.0.2 (28), then the manual release once the owner says so; the "I want to help" (volunteer) screenshot is missing from the new store set (the capture harness has no volunteer view); additional English/Hebrew store listing localizations (only the Arabic listing exists); owner to confirm the App Privacy answers now that user-written text can be sent to Google Cloud Translation on tap; custom SMTP; key manual QA on two real phones (request flow with push, delete account, password reset); make `request-photos` private (needs an Android release first because build 7 reads public URLs); human legal review of the English/Hebrew text (review file generated 2026-10-21, not committed); the minor icon duplication on the account screen; backlog: audit-log page and admin management in the admin panel, game file release, R8/DEX warning (deadline 2027).

**Owner instructions on 2026-10-22**: (a) the owner cancels the in-app "27 October" announcement himself in the admin panel (the date is no longer valid because iOS ships right after Apple approves); (b) Codex has no credits left, so Claude replaces the 2.0.2 App Store screenshots (see the change log for status); (c) merge Codex's admin work into `main` and push this file.

## 8. Change log (newest first; append yours)
Format: `date — who — what — where (branch/commit) — external effect — verified how`

- 2026-10-23 — Claude — Found why the marketing website (Vercel project `dist`) returned 404 and restored it at the owner's request: `vercel promote` of the last good production deployment (`dpl_Dqfoj9oeB5dQe2gnmhfXv7xJLBYe`, Codex CLI upload from `web/marketing-local-20261021` `191a30c`); the owner then set Ignored Build Step to "Don't build anything" in the Vercel dashboard (Claude was blocked from changing it) — Vercel project `dist` only — alias `dist-mu-lilac-59.vercel.app` back to HTTP 200, rendered in a headless browser at 390 px and 1440 px (no page errors, no failed requests); API read-back shows `commandForIgnoringBuildStep: exit 0` and the production deployment unchanged. Cause: the project was linked to the GitHub repo, so every push to `main` since 2026-10-22 10:33 UTC built the whole app there with no output directory.

- 2026-10-22 — Claude — At the owner's request cancelled Codex's App Store submission of 2.0.2 (28), replaced the store screenshots (iPhone 6.5-inch: home, request help, perks, activity; iPad 13-inch: the same four; real captures of the iOS components with the owner's real account numbers and the two real public offers; the old nine are saved outside git in `Downloads\AKHOO-store-screenshots\old-from-appstore\`), and rewrote the App Review notes (the old text still said "build 16" and "no AI/ML services"; it now describes 2.0.2 and discloses the on-tap Google Cloud Translation call) — Apple App Store Connect only: version `4ded2e33-…` is now `DEVELOPER_REJECTED` (editable), submission `71dd1830-…` is `COMPLETE` (cancelled) — API read-back of both screenshot sets (all `COMPLETE`, right sizes), review notes `200`, demo account `playstore.review@akhoo.app` signs in. **Then, after the owner said "yes, publish":** set `releaseType` to `MANUAL`, created review `62a81be4-eb0f-4bc5-b9cc-aadce54fc68b`, added the version and submitted; API read-back: version `WAITING_FOR_REVIEW`, `MANUAL`, build 28 `VALID`. Capture harness: branch `chore/store-screenshots-20261022` (local only, not pushed).

- 2026-10-22 — Claude — Merged the iOS 2.0.2 (build 28) design source into `main` at the owner's request (no conflicts) — `main` `a5c041d` — Vercel production deploy of the website (admin unchanged) — typecheck, edge typecheck, lint, 222 + 36 tests, production web build, iOS bundle export from `main`, local smoke test, then production smoke test (welcome, privacy, terms, reset-password, delete-confirm routes; no script errors); CI and the three Vercel projects green. Rollback: `git revert -m 1 a5c041d`.
- 2026-10-22 — Claude — Read Codex's work from git, Apple and the production database (read-only), merged `feat/admin-website-partners-20261022` into `main`, renamed its migration file `0045` → `0048` (file only; the database already has the objects), reconciled this file (Codex's copy was the newer base) and added the coordination paragraph to `AGENTS.md` — `main` — Vercel redeploys admin and web — admin typecheck, lint, 36 tests, build; root 191 tests; grants and RLS of the website tables checked in the catalog.
- 2026-10-21 to 2026-10-22 — Codex (recorded by Claude from git and the live database; Codex please correct) — Built the local marketing website, the admin website-partners card and its migration, applied the migration to production on 2026-10-21 (audit log shows the owner saving two partners from a local admin) — branches `web/marketing-local-20261021`, `feat/admin-website-partners-20261022` — production database only.
- 2026-10-22 — Codex — Owner authorized immediate public iOS release and explicitly excluded Android. Submitted 2.0.2 (28) for App Store review with automatic release after approval and no scheduled date — `release/ios-appstore-20261022`, exact binary source `64dd4ec` — Apple App Store only; no new TestFlight upload, OTA, Play, backend or Vercel change — API read-back `WAITING_FOR_REVIEW`, typecheck, 27 tests, signed IPA identity and 18 bundled videos, inherited metadata and nine complete screenshots. No physical iPhone test performed in this task.
- 2026-10-21 — Claude — Migration `0047` applied (see section 3); auth redirect allow-list gained `akhoo.vercel.app`; admin cleanup (old name, Content and Pro Max pages, member-only checkbox) — `main` `8d36a45`, `970c8b5` — Supabase + Vercel admin — dry run rolled back, post-state queries, live admin bundle checked, CI green.
- 2026-10-21 — Claude — Critical-flow database test (request lifecycle, points once, block, ban, privilege escalation, account deletion) on synthetic users inside a rolled-back transaction — no data left — all scenarios passed.
- 2026-10-21 — Claude — Created this file; legal-text review file (ar | en | he) generated outside git.
- 2026-10-20 — Claude — Removed the "Billing — coming soon" row — `main` `1c0b315`, OTA `da94ac9`, TestFlight 28 — iOS OTA (production) — typecheck, tests, iOS bundle export.
- 2026-10-20 — Claude — "I want to help" header fixed (art sized by percent inside padded box, grey box in dark mode, back button side) — `ios/testflight-fixes-20261020` `64dd4ec` — TestFlight build 28 — typecheck, tests, iOS export; **not seen on a device by the agent**.
- 2026-10-20 — Claude — Offers list invisible on the perks screen: root cause was `Animated.stagger` stopping all stages when the points card unmounted; fixed with independent stages (`useStaggeredReveal`) — `main` `c9c43cd`, OTA `b4591d1`, TestFlight 27/28 — OTA + TestFlight — unit test; owner confirmed they tried the app.
- 2026-10-20 — Claude — Business content translation (migration `0045`, `translate-content`, admin "Translate all"), on-demand translation of user text (migration `0046`, `translate-user-text`, `TranslatableText`), delete-account phrase localized — `main` `cc31e3b`, `a2a759c` — Supabase + OTA + TestFlight.
- 2026-10-20 — Claude — AKHOO+ removed from the app and from the privacy policy / terms (ar/en/he), Hebrew old app name fixed — `main`, OTA, TestFlight.
- 2026-10-20 — Claude — TestFlight builds 26, 27, 28 uploaded and processed (27 and 28 are the ones to use).
- 2026-10-19 — Codex — TestFlight build 25 (design branch) delivered.
- Before 2026-10-19 — Claude/Codex — SAND rescue branding removed, App Store 2.0.1 approved and live (2026-10-14), Android build 7 in the closed test with the foreground-service permission removed; admin email search; web motion design by Codex. See `git log` for details.
