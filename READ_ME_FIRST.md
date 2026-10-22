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
6. **Version numbers are shared state.** Reserve the next iOS/Android build number in section 5 *before* building, so two builds never collide.
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
- **App Store update submitted**: 2.0.2 build 28 is `WAITING_FOR_REVIEW`, submitted 2026-10-22 at 10:10 UTC. The owner explicitly requested public iOS release now, not TestFlight and not 27 October. `releaseType: AFTER_APPROVAL`, no scheduled date and no phased release. Apple must approve before it is public. Version `4ded2e33-c382-493f-9d39-9a720fce5d17`; review `71dd1830-5b9e-4a31-bba4-b0e2d86e5d15`. Source `64dd4ec`, recorded on `release/ios-appstore-20261022`. This reuses the existing App Store eligible build; no new binary or OTA was published. Build 28 has OTA disabled, including when distributed through the App Store.
- **App Store (live)**: 2.0.1 build 17, `READY_FOR_SALE`. Gets iOS OTAs on channel `production`, runtime `2.0.1`, published from branch `ota/ios-2.0.1-translations` (latest OTA contains: AKHOO+ removal, Hebrew name fix, business/user-text translation, legal text, offers-list fix, billing row removed).
- **TestFlight (owner's iPhone)**: 2.0.2 builds 18–28 exist; **latest is 28** (internal group "Test"). It is built from branch `ios/testflight-fixes-20261020` (Codex's design branch + fixes). TestFlight binaries have `updates.enabled: false`, so **an OTA can never reach them**; only a new build can. Builds 26 and 27 are superseded.
- **Android**: build 7 (2.0.0, versionCode 7) in the closed test; **12 testers, day 10 of 14 on 2026-10-22** (confirmed from Play Console screenshots); "request production access" unlocks about 2026-10-26. Frozen (rule 2).
- **Web** `akhoo.vercel.app` and **Admin** `akhoo-admin.vercel.app` deploy from `main` (Vercel). CI runs on `main`.

**Backend** (Supabase project `zmpwdufahjmlxfwzafvr`)
- Migrations `0001`–`0047` applied. `0045` business translations, `0046` translation quota, `0047` revoked anonymous execute on SECURITY DEFINER functions and limited request-photo listing to the owner.
- Edge functions deployed: `delete-account`, `geocode`, `notify-new-message`, `notify-new-request`, `notify-support-reply`, `send-broadcast-notification`, `translate-content`, `translate-user-text`.
- Auth: Google and Apple sign-in on; email auto-confirm **on**; default Supabase mailer (2 emails/hour, effectively unusable for password reset) — custom SMTP **pending** (plan: Gmail app password). Redirect allow-list includes `akhoo.vercel.app`.
- Content: 2 verified businesses and 2 live offers (sticker, lawyer consultation), all translated to he/en. The owner reports the lawyer agreed to the offer.
- A broadcast announced "new look on 27 October" (sent 2026-10-18, shown until 2026-10-28).

**Branches**
| Branch | What it is | Owner |
|---|---|---|
| `main` | Web + admin + backend + shared fixes. **Cannot be bundled for native** (`app/mission/[missionId]/index.web.tsx` breaks the iOS bundle). | Claude |
| `ota/ios-2.0.1-translations` | Hotfix line for the live App Store 2.0.1; the only base for production iOS OTAs. | Claude |
| `ios/testflight-design-20261017` | The approved iOS design (builds 18–25). Do not push here except Codex. | Codex |
| `ios/testflight-fixes-20261020` | Design branch + fixes (builds 26–28). Next TestFlight builds come from here. | Claude |
| `fix/translate-everything` | Mirror of `main` used for pushes. | Claude |
| `release/ios-appstore-20261022` | Exact build 28 source plus official App Store submission record and release notes. | Codex |

## 4. How to ship (checked recipes)
- **iOS OTA to the live App Store build**: cherry-pick the fix onto `ota/ios-2.0.1-translations` in a separate worktree with `npm ci`; run `npx expo export --platform ios`; then `eas update --branch production --platform ios --environment production`. Never from `main`.
- **TestFlight build**: new commit on `ios/testflight-fixes-20261020`, bump `AKHOO_IOS_BUILD_NUMBER` in `eas.json`, `eas build --platform ios --profile testflight`, then `eas submit --platform ios --profile testflight --id <build>` (needs `credentials/ios`).
- **Supabase**: SQL through the Management API with the token in `credentials/supabase-token.txt`; functions with `supabase functions deploy <name> --project-ref zmpwdufahjmlxfwzafvr --use-api --no-verify-jwt`. Test risky DB behaviour inside a `DO` block that ends with `raise exception` so everything rolls back. Reads can lag a few seconds after a config PATCH.
- **Admin/web**: push to `main`; Vercel deploys.
- **Official release of the new design (submitted)**: Apple accepts the already uploaded, store-signed 2.0.2 (28), marked `APP_STORE_ELIGIBLE`. It contains the approved design and native fixes. Reused that exact binary, inherited the approved Arabic listing/review details/screenshots, added Arabic release notes, and submitted through `reviewSubmissions`. Automatic release after approval; the owner's 2026-10-22 instruction supersedes the earlier 27 October plan. Do not rebuild or send an OTA merely to rename the TestFlight profile. Details: `docs/appstore-release-2026-10-22.txt`.

## 5. Version registry (reserve before building)
| Platform | Used | Next free |
|---|---|---|
| iOS App Store | 2.0.0 (builds ≤16), 2.0.1 (17); 2.0.2 (28) submitted for public release | Build **29**, not reserved. Builds 18–28 already exist; build 28 reused without rebuilding. |
| Android | versionCode 7 | 8 (do not build yet) |

## 6. Credentials map (never commit)
`credentials/expo-token.txt`, `credentials/supabase-token.txt`, `credentials/ios/AuthKey_*.p8`, `credentials/android/*.json`. Planned: `credentials/smtp-app-password.txt`.

## 7. Open items and decisions
**Decisions waiting for the owner**: what to tell Android users about 27 October; whether the new design also goes on the application website; widen push notifications after launch or not; which Gmail account to use for app emails. The native release source decision is resolved: exact build 28 source, no blanket merge from `main`.
**Work not done**: Apple review/approval of the submitted 2.0.2; refreshed store screenshots and additional English/Hebrew store listing localizations (current approved Arabic listing retained); custom SMTP; key manual QA on two real phones (request flow with push, delete account, password reset); make `request-photos` private (needs an Android release first because build 7 reads public URLs); human legal review of the English/Hebrew text (review file generated 2026-10-21, not committed); the minor icon duplication on the account screen; backlog: audit-log page and admin management in the admin panel, game file release, R8/DEX warning (deadline 2027).

## 8. Change log (newest first; append yours)
Format: `date — who — what — where (branch/commit) — external effect — verified how`

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
