# READ ME FIRST — AKHOO shared working file

**For every agent (Claude Code, Codex, anyone else) and for the owner.** Read sections 0 to 3 before you change anything (about 5 minutes). When you finish, add a SHORT entry to section 8 in the same commit (3 lines at most; long reports go in `docs/`) and update sections 0 and 3 if they changed. The file lives on `main`: `git fetch origin && git show origin/main:READ_ME_FIRST.md`.

The complete text of this file as it was before the 2026-10-27 restructure (every old state detail, the 45 change-log entries, the owner's earlier instructions) is kept in `docs/archive/READ_ME_FIRST-until-2026-10-27.md`. Nothing was deleted, only moved.

## 0. الوضع الآن (للمالك) — محدّث 2026-10-29
- **آيفون:** 2.0.4 (التصميم الجديد) نزلت للناس بتاريخ 27/10 بعد موافقة Apple. اللي عند الناس هلأ هو التصميم الجديد (بانر الشركاء وكرت المساعدة الوردي) مع نموذج الشركاء التجريبي.
- **أندرويد:** 2.0.5 (10) منشورة على Google Play. تصحيح الميدالية والهدية وصل، والمالك أكد بتاريخ 29/10 إن «مزايا أخوو» و«نشاطي» وزر المزايا بالرئيسية صاروا يفتحوا على تلفونه. التوزيع الحالي لإسرائيل.
- **الويب والأدمن وموقع التسويق:** حيين وبآخر نسخة. تطبيق الويب صار بنفس تصميم TestFlight 2.0.4 (31).
- **بانتظارك:** (1) نموذج الشركاء تجريبي ولا بيبعت شي. القرار: نربطه بطلب حقيقي ولا نخبّيه؟ (2) حساب Gmail لإيميلات التطبيق. (3) نوسّع الإشعارات بعد الإطلاق ولا لأ؟
- **بانتظار طرف ثالث:** لا يوجد انتظار متعلق بتصحيح إغلاق المزايا والنشاط؛ المالك أكد نجاحه.
- **ما انفحص:** باقي فحوص الأجهزة بالبنود المفتوحة في القسم 7؛ تأكيد المالك الحالي خاص بالأزرار الثلاثة اللي كانت بتسكر التطبيق.

- **معاينة لوكل:** كرت المستوى لحاله صار بدائرة تقدّم متحركة، بدون نجمة؛ باقي الصفحة زي ما هو. المعاينة: `http://localhost:4190/level-card-preview`. محفوظ للمراجعة فقط، بدون نشر.

## 1. Rules (non-negotiable)
1. **Official steps need the owner's explicit OK in that task**, his own words in chat: submit to App Review, release an approved iOS version, upload or send for review on Google Play, change a store listing, deploy the marketing site. Say in one line what you are about to do. Standing OKs are listed in section 0 and nowhere else. Builds and TestFlight uploads only when he asked.
2. **Android** has production access since 2026-10-27, so it follows rule 1 like every store. iOS OTAs always use `--platform ios` and come only from `ota/ios-2.0.1-translations`.
3. **Separate working copies.** Each agent works in its own git worktree and its own branches. Never switch branches or commit inside another agent's folder, never push to another agent's branch, never force-push, keep unrelated changes.
4. **A push to `main` is a production deploy** of the web app and the admin (Vercel). Push only after typecheck, lint and tests pass, and say so in the report.
5. **Secrets never go in git.** They live in the git-ignored `credentials/` folder. Never print them in logs or commit them.
6. **Do not invent data.** Do not say something is verified unless you checked it; write "not verified" and why.
7. **Numbers are shared state.** Reserve the next iOS build number, Android versionCode and SQL migration number in section 5 *before* using them.
8. **Claim your work** in section 2 before you start and remove the line when you finish, so two agents never do the same thing.
9. **Talking to the owner:** very short, Levantine Arabic, a few lines: what is done, what he must decide, any real risk. No branch names, hashes or "how it works" unless he asks. Before a visual redesign, show one or two small mock-ups and let him pick; do not build and deploy it first (two admin redesigns were rejected and deleted on 2026-10-24).
10. Follow `AGENTS.md` (commit and push finished work to the intended branch after validation).

## 2. Who owns what, and who is working on what now
| Area | Owner |
|---|---|
| iOS/web design, motion, UI screens (`*.ios.tsx`, `*.web.tsx`, `components/motion`), marketing website | Codex |
| Supabase (migrations, edge functions, auth), admin panel, translations, email, build/OTA/store pipeline | Claude |
| Decisions, official releases, store accounts, legal | Owner |

If you must touch another owner's area, say so in the change log and keep the change small.

**Active work (claim before you start, remove when done)**
| Agent | What | Branch | Since |
|---|---|---|---|

## 3. Current state (2026-10-29)
**iOS** (App Store Connect app `6809610412`, bundle `app.akhoo.help`)
- **2.0.4 (31): LIVE** since 2026-10-27: approved by Apple, released through the API at the owner's standing OK (`READY_FOR_SALE`). Version `120ab703-e74f-40f4-aaa9-226475e3aa66`, build `e01db523-d49b-499f-9871-b93e7cd86306` (the TestFlight binary): partner banner, rose help card, rewards ticket. The partner form is a labelled test that sends nothing. Store screenshots are still the 2.0.3 ones.
- 2.0.3 (29) and 2.0.2 (28) are the previous live versions; users update normally.
- Users still on 2.0.1 (build 17) get iOS OTAs (channel `production`, runtime 2.0.1) from `ota/ios-2.0.1-translations`. **Builds 28 and later have OTA disabled** (built with the `testflight` profile), so only a new App Store version can change their screens.
- TestFlight: latest 2.0.4 (31) in the internal group "Test"; TestFlight binaries never receive OTAs.
- The Expo Free plan has no cloud iOS builds until 2026-11-01: build iOS on the GitHub macOS runner (`.github/workflows/ios-release-build.yml`, `ios-partner-testflight.yml`; repo secret `EXPO_TOKEN`).

**Android** (`app.akhoo.help`)
- **2.0.5 (10): LIVE in Production (Israel), confirmed 2026-10-29 02:21 UTC.** Full published-iOS presentation, including request/helper/mission/activity/account/perks, fonts, motion and Android insets/video adapters; OAuth callback retained. EAS build `238792da-a807-4eea-985c-11c39d2ebcb3`, source `a10d00be8fe152ae63899d76bc804d8a544de2ed` on `android/ios-parity-release-20261029`; runtime 2.0.5. Not merged to main or published to Apple/Vercel. Release report: `docs/android-ios-parity-2.0.5.md`. Android-only OTA group `6967256c-e01a-4320-9216-99aebf641cc1` published at 02:48 UTC from `c18123a` to mitigate benefits/activity exits: native gift/medal replace WebGL. Delivery verified; on 29/10 the owner confirmed all three reported entry points open on the affected phone. Details: `docs/android-benefits-activity-crash-2026-10-29.md`.
- **2.0.4 (9): LIVE**, confirmed by `RELEASE_LIFECYCLE_STATE_PUBLISHED` on 2026-10-29. This version ported the partner home/form only; 2.0.5 completes the remaining presentation. EAS build `4a679c37-8373-4651-ad87-4258ef53fe04`; source `android/partner-home-20261028` merged into main. Its Android OTA (runtime 2.0.4, group `636bde81-f12d-4223-a7bf-12322016eef1`) fixes `akhoo://auth-callback`. Internal/closed testing remain on 9; the owner tried that version on his phone.
- No background-location permission (it needs Google's declaration first). The bundle was inspected: new launcher icon, four notification sounds, no foreground-service permission. Checklist: `docs/android-production-release-2.0.3.md`.

**Local level-card review:** `ui/level-card-local-20261029` changes only the original Activity level card: animated progress ring, no star, real completed-help count. Dev-web preview: `http://localhost:4190/level-card-preview`; example controls are labelled and production-guarded. No Benefits/full-page redesign, release or deployment. Report: `docs/level-card-local-2026-10-29.md`.

**Web and admin** deploy from `main`. The web app home follows the TestFlight 2.0.4 (31) layout since 2026-10-26. CI runs on `main`.

**Marketing website**: folder `website/` (Codex). Public `noindex` preview https://dist-mu-lilac-59.vercel.app/?lang=ar (`en`, `he`) on the Vercel project `dist` (`prj_OQAAoAUvWmMBN1gVm7aMkhzTdhNz`). It is **deployed by hand** as static files (`website/dist/`), never from the repo root, and the project's "Ignored Build Step" (`exit 0`) must stay, or pushes to `main` replace the site with a 404 (it happened on 2026-10-22). It reads the public partner feed `get_website_partners`. Last deployed 2026-10-26, identical to the source on `main`.

**Backend** (Supabase project `zmpwdufahjmlxfwzafvr`)
- Migrations `0001`–`0052` applied (`0048` website partners, applied under the file name `0045`; `0049` announcement video; `0050` GIF allowed in the `content` bucket; `0051` notification events; `0052` push sound pack). Migration `0047` revokes anonymous execute on every SECURITY DEFINER function that exists when it runs; do not re-run it.
- Website partners: table `website_partners`, `admin_save_website_partner` (admin), `get_website_partners` (public by design: name, logo, caption of enabled, verified, active businesses). Two businesses are enabled.
- Edge functions deployed: `delete-account`, `geocode`, `notify-event`, `notify-new-message`, `notify-new-request`, `notify-support-reply`, `send-broadcast-notification`, `translate-content`, `translate-user-text`. Notification events run through `notify-event` and a `pg_cron` job every 2 minutes.
- Auth: Google and Apple sign-in on; email auto-confirm on; the default Supabase mailer (2 emails an hour) is unusable for password reset, custom SMTP is pending.
- Content: 2 verified businesses and 2 live offers, translated to he/en.

**Branches** (the Android 2.0.5 release below is not merged into `main`; old names are in the archive)
| Branch | What it is | Owner |
|---|---|---|
| `main` | Everything shipped or shippable: web, admin, backend, apps, website source, build settings. Native exports (iOS, Android, web) pass. | Claude |
| `ota/ios-2.0.1-translations` | The only base for iOS OTAs to the live 2.0.1 users. Never merge it. | Claude |
| `ios/testflight-partner-home-20261024` | Codex's TestFlight beta line (2.0.4 builds 30 and 31); its code is already in `main`, gated by `extra.partnerHomeBeta`. | Codex |
| `android/release-2.0.3-20261025` | Source of the Android 2.0.3 build; merged into `main`. | Claude |
| `android/ios-parity-release-20261029` | Android 2.0.5 (10) production submission; complete published-iOS presentation, isolated Android profile. Not merged; Vercel deploy disabled on this branch. | Codex |
| `ui/level-card-local-20261029` | Only the level card, no star, local animated review; original remaining screens. No deploy; not merged. | Codex |

## 4. How to ship (checked recipes)
- **Web and admin:** push to `main`, Vercel deploys. A Vercel preview of the admin is blank (its variables exist only for Production); for a real preview build locally with the public values and `VITE_BASE_PATH=/` and run `vercel deploy --prebuilt`. Remove deployments with `vercel remove <url> --yes`.
- **Marketing website:** `node website/build.mjs` (needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the environment or the root `.env.local`), then upload `website/dist/` to the project `dist` with the Vercel CLI (`vercel deploy --prod` from a folder linked to that project).
- **iOS App Store version:** build on the GitHub macOS runner or reuse a valid TestFlight build; create the version through the API (Apple copies the previous listing and screenshots), set the Arabic "what's new" and review notes, attach the build, submit with `reviewSubmissions` (create, add the version as an item, PATCH `submitted: true`). Release an approved version with `POST /v1/appStoreVersionReleaseRequests` (worked on 2026-10-27; on 2026-10-22 the permission system blocked it and the owner pressed the button).
- **iOS OTA to 2.0.1 users:** cherry-pick onto `ota/ios-2.0.1-translations` in a separate worktree, `npm ci`, `npx expo export --platform ios`, then `eas update --branch production --platform ios --environment production`. Never from `main`.
- **TestFlight build:** bump the build number in `eas.json`, `eas build --platform ios --profile testflight` (or the macOS runner), then `eas submit --platform ios --profile testflight --id <build>`.
- **Android:** `eas build --platform android --profile production` works on the Free plan (about 35 minutes, versionCode auto-increments). `eas submit --profile android-production` fails with "Release in track targeting no countries" until the Production track has countries; the owner sets them in Play Console (Production, Countries/regions) and sends the release and the countries for review together as one change set. A draft release can be uploaded with the Play Developer API and the service account key. Fallback build without Expo: the manual GitHub workflow "Android release build" (never run).
- **Android 2.0.5 recipe:** profile `android-parity` pins version/code/runtime; reserve and change the numbers before a future build. Play API bundle upload → Production `completed` → validate → commit with `changesNotSentForReview=false` succeeded on 29/10. `GET /androidpublisher/v3/applications/app.akhoo.help/tracks/production/releases` returns actual review/publication state; edit-track `completed` alone does not. Countries already contain `IL`.
- **Supabase:** SQL through the Management API with `credentials/supabase-token.txt`; functions with `supabase functions deploy <name> --project-ref zmpwdufahjmlxfwzafvr --use-api`. Test risky database changes inside a `DO` block that ends with `raise exception`, so everything rolls back.
- **Gotchas:** `expo export` caches environment variables, so use `--clear` when they change. Git Bash rewrites values that start with `/` (for example `VITE_BASE_PATH=/`); set `MSYS_NO_PATHCONV=1`. Copies of `credentials/` inside a worktree stay git-ignored; delete them afterwards.

## 5. Version registry (reserve before using)
| Platform | Used | Next free |
|---|---|---|
| iOS App Store / TestFlight | 2.0.0 (≤16), 2.0.1 (17), 2.0.2 (28), 2.0.3 (29), 2.0.4 (30 beta, 31 live) | build **32** |
| Android | versionCode 7 (closed test), 8 (2.0.3), 9 (2.0.4), **10 (2.0.5 live, confirmed 2026-10-29)** | **11** |
| Supabase SQL migrations | `0001`–`0052` | **0053** |

## 6. Credentials map (never commit)
`credentials/expo-token.txt`, `credentials/supabase-token.txt`, `credentials/ios/AuthKey_*.p8`, `credentials/android/*.json` (the Play service account, used by EAS Submit and the Play API). Planned: `credentials/smtp-app-password.txt`.

## 7. Open items
**Decisions waiting for the owner:** the partner form (real submission flow or hide it); which Gmail account the app emails use; widen push notifications after launch or not.
**Not done:** manual QA on real phones (request flow with push, delete account, password reset, the new releases); the volunteer screenshot is missing from the store sets (Arabic, English, Hebrew all show Home, request, perks, activity); a native Hebrew reader for the Hebrew store text; custom SMTP; make the `request-photos` bucket private (after most Android users run 2.0.3, because build 7 reads public URLs); human legal review of the English and Hebrew text; background location for Android volunteers (needs Google's permission declaration and a new build); iOS notification settings screen and tap routing for the new events; backlog: audit-log page, admin management, R8/DEX warning (deadline 2027).

## 8. Change log (newest first, 3 lines at most per entry; older entries are in the archive)
Format: `date — who — what (where) — external effect — verified how`

- 2026-10-29 — Codex — Implemented only the approved animated level card without a star, with dev-only local preview. No release/deployment; original other screens preserved.
  Claude-area edits limited to new locale keys and branch deploy suppression. Typecheck/lint, 342 tests, mobile-width browser interactions and platform exports; physical devices/authenticated RPC unverified. Report: `docs/level-card-local-2026-10-29.md`.

- 2026-10-29 — Codex — Refined the mobile concept after reviewing official Revolut RevPoints, Starbucks Rewards and Strava activity documentation: points wallet, affordable-offer filter, period summary and compact activity rows. Image preview only; illustrative data labelled, owner review pending; no app/deployment change.

- 2026-10-29 — Codex — Generated a preview-only mobile concept: benefits wallet/offer cards and activity impact/timeline. Illustrative data labelled; owner review pending. No app code, runtime update or deployment.

- 2026-10-29 — Codex — Published Android 2.0.5 OTA replacing WebGL medal/tab gift with native artwork to mitigate benefits/activity exits. TypeScript/lint, 327 tests, platform exports and downloaded bundle/artwork hashes pass; owner confirmed all three entry points now open on the affected phone.
  Release-pipeline work in Claude's area limited to Android runtime 2.0.5; report `docs/android-benefits-activity-crash-2026-10-29.md`. No backend, Apple or Vercel change.

- 2026-10-29 — Codex — Android 2.0.5 (10) submitted to public Production after owner's explicit OK; full published-iOS presentation with Android adapters. Google lifecycle read-back: 10 `IN_REVIEW`, 9 `PUBLISHED`.
  Touched Claude's build/store area only for this release. Typecheck/lint, 319 tests, native exports, signed build and AAB/Play hash checks passed; report `docs/android-ios-parity-2.0.5.md`. No Apple, OTA, backend or Vercel action; device QA unverified.

- 2026-10-28 — Claude — Google Play listing: new Arabic screenshots (current design) plus new `en-US` and `iw-IL` listings (translated text, own 4 screenshots each) committed through the Play API after his OK; Google reviews them. Not verified: Hebrew wording by a native reader; Google's result. English Home banner title touches the wrench icon on a 405 px screen (web CSS, not changed).
- 2026-10-28 — Claude — Android 2.0.4 (9) = the iPhone partner/home design ported to Android; built on EAS, tested by the owner from the internal/closed tracks, then sent to Production (Israel) through the Play API after his OK. During his test he found "Unmatched Route" after Google sign-in: added `app/auth-callback.tsx` and shipped it as an Android OTA (runtime 2.0.4). Not verified: Google's review result; the layout on a real phone beyond the owner's own look.

- 2026-10-28 — Claude — Android 2.0.3 (8) is live on Google Play for Israel (Play Console shows Published; the public page opens). The Google watcher was stopped. Not verified: installing it on a phone.

- 2026-10-27 — Claude — iOS 2.0.4 (31) approved by Apple and released through the API (`READY_FOR_SALE`) under the owner's standing OK. The release is public. Not verified: the public store page and an update on a real phone.

- 2026-10-27 — Claude — Restructured this file (status board, shorter rules, claim table, trimmed log); the full old text is in `docs/archive/`. No external effect.
- 2026-10-27 — Claude — iOS 2.0.4 (31) submitted to App Review (manual release, listing copied from 2.0.3, notes say the partner form is a test). The owner gave a standing OK to release it as soon as Apple approves. Verified: API read-back `WAITING_FOR_REVIEW`.
- 2026-10-27 — Claude — iOS 2.0.3 (29) released through the API (`READY_FOR_SALE`). Not verified: an update on a real phone.
- 2026-10-27 — Claude — Android 2.0.3 (8) built on EAS cloud, bundle inspected, uploaded as a draft Production release through the Play API (EAS Submit refused: no countries). The owner added Israel and sent it for review. Not verified: on a phone, Google's result.
- 2026-10-26 — Claude — Web app home now follows TestFlight 2.0.4 (31) (partner banner, rose card, helper card, rewards ticket, test-only partner form); production redeploy. Verified live with the review demo account in ar/en/he, light/dark, phone and desktop.
- 2026-10-26 — Claude — Vercel update: merged Codex's build-31 work into `main`; the marketing website was stale (19 of 56 files) and was redeployed by hand.
- 2026-10-26 — Codex — TestFlight 2.0.4 (31) rose help card delivered (build `e01db523…`, internal group Test only, OTA off). Report: `docs/testflight-help-rose-2026-10-25.md`.
- 2026-10-25 — Claude — Integration: merged every open branch into `main` (App Store docs, iOS 2.0.3/2.0.4 settings and workflows, marketing website source, Android icon fix); prepared the Android release candidate. Left out on purpose: `ota/ios-2.0.1-translations`, a duplicate `0045_website_partners.sql`.
- 2026-10-24 — Codex — TestFlight 2.0.4 (30) partner/home beta delivered. Report: `docs/testflight-partner-home-2026-10-24.md`.
- 2026-10-24 — Claude — Android launcher icon fixed (dedicated adaptive foreground, logo inside the safe zone). Two admin motion/redesign attempts were rejected by the owner and deleted before any merge.
