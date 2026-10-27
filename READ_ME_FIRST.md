# READ ME FIRST — AKHOO shared working file

**For every agent (Claude Code, Codex, anyone else) and for the owner.** Read sections 0 to 3 before you change anything (about 5 minutes). When you finish, add a SHORT entry to section 8 in the same commit (3 lines at most; long reports go in `docs/`) and update sections 0 and 3 if they changed. The file lives on `main`: `git fetch origin && git show origin/main:READ_ME_FIRST.md`.

The complete text of this file as it was before the 2026-10-27 restructure (every old state detail, the 45 change-log entries, the owner's earlier instructions) is kept in `docs/archive/READ_ME_FIRST-until-2026-10-27.md`. Nothing was deleted, only moved.

## 0. الوضع الآن (للمالك) — محدّث 2026-10-27
- **آيفون:** 2.0.3 حي عند الناس. 2.0.4 (التصميم الجديد: بانر الشركاء وكرت المساعدة الوردي) بمراجعة Apple من 27/10. أول ما توافق، Claude بينزّلها (إذنك الدائم من 27/10). إذا ما كان Claude شغّال، قول له "انزّلها".
- **أندرويد:** 2.0.3 (رقم 8) أرسلتها لمراجعة Google لإسرائيل بتاريخ 27/10. لسا ما ظهرت على Play.
- **الويب والأدمن وموقع التسويق:** حيين وبآخر نسخة. تطبيق الويب صار بنفس تصميم TestFlight 2.0.4 (31).
- **بانتظارك:** (1) نموذج الشركاء تجريبي ولا بيبعت شي. القرار: نربطه بطلب حقيقي ولا نخبّيه؟ (2) حساب Gmail لإيميلات التطبيق. (3) نوسّع الإشعارات بعد الإطلاق ولا لأ؟
- **بانتظار طرف ثالث:** Apple (2.0.4) وGoogle (أندرويد 2.0.3).
- **معاينة محلية عند Codex:** «أثر مساعدتك» صارت شجرة 3D بتكبر مع المساعدات، مع معاينة نمو محلية. لسا بدها رأيك وتجربة آيفون حقيقي؛ ما نُشر أي تحديث.
- **ما انفحص:** ولا شي من اللي طلع اليوم انجرّب على جهاز حقيقي (آيفون 2.0.3 و2.0.4، أندرويد 2.0.3، الويب الجديد على سفاري).

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
| — | nothing claimed | — | — |

## 3. Current state (2026-10-27)
**iOS** (App Store Connect app `6809610412`, bundle `app.akhoo.help`)
- **2.0.4 (31): WAITING_FOR_REVIEW** since 2026-10-27, `releaseType: MANUAL`. Version `120ab703-e74f-40f4-aaa9-226475e3aa66`, submission `cacd940f-c883-409a-9766-95d052145596`, build `e01db523-d49b-499f-9871-b93e7cd86306` (the TestFlight binary). It has the partner banner, rose help card and rewards ticket. The partner form is a labelled test that sends nothing, and the review notes say so. Store screenshots are still the 2.0.3 ones.
- **2.0.3 (29): LIVE** since 2026-10-27 (video player in announcements, notification events and sounds). 2.0.2 (28) is the previous live version.
- Users still on 2.0.1 (build 17) get iOS OTAs (channel `production`, runtime 2.0.1) from `ota/ios-2.0.1-translations`. **Builds 28 and later have OTA disabled** (built with the `testflight` profile), so only a new App Store version can change their screens.
- TestFlight: latest 2.0.4 (31) in the internal group "Test"; TestFlight binaries never receive OTAs.
- The Expo Free plan has no cloud iOS builds until 2026-11-01: build iOS on the GitHub macOS runner (`.github/workflows/ios-release-build.yml`, `ios-partner-testflight.yml`; repo secret `EXPO_TOKEN`).

**Android** (`app.akhoo.help`)
- **2.0.3 (versionCode 8)** is on the Production track for **Israel only**, sent for review by the owner on 2026-10-27, not visible on Play yet. EAS build `71dbeb05-6575-4993-8668-2434a3c89434`, source `main`. The closed test still has 2.0.0 (7) for the 12 testers.
- No background-location permission (it needs Google's declaration first). The bundle was inspected: new launcher icon, four notification sounds, no foreground-service permission. Checklist: `docs/android-production-release-2.0.3.md`.

**Web and admin** deploy from `main`. The web app home follows the TestFlight 2.0.4 (31) layout since 2026-10-26. CI runs on `main`.

**Local rewards review (Codex):** `ios/live-rewards-preview-20261026` now implements approved concept C as a procedural 3D impact tree with growth, native/localized text and the existing points/count data contract. Review at `http://127.0.0.1:4186/` via `npm run preview:rewards` (sample data, no writes). No deployment, backend or store action; no build/migration numbers consumed. Physical iPhone performance and real-account refresh are not verified in this isolated preview.

**Marketing website**: folder `website/` (Codex). Public `noindex` preview https://dist-mu-lilac-59.vercel.app/?lang=ar (`en`, `he`) on the Vercel project `dist` (`prj_OQAAoAUvWmMBN1gVm7aMkhzTdhNz`). It is **deployed by hand** as static files (`website/dist/`), never from the repo root, and the project's "Ignored Build Step" (`exit 0`) must stay, or pushes to `main` replace the site with a 404 (it happened on 2026-10-22). It reads the public partner feed `get_website_partners`. Last deployed 2026-10-26, identical to the source on `main`.

**Backend** (Supabase project `zmpwdufahjmlxfwzafvr`)
- Migrations `0001`–`0052` applied (`0048` website partners, applied under the file name `0045`; `0049` announcement video; `0050` GIF allowed in the `content` bucket; `0051` notification events; `0052` push sound pack). Migration `0047` revokes anonymous execute on every SECURITY DEFINER function that exists when it runs; do not re-run it.
- Website partners: table `website_partners`, `admin_save_website_partner` (admin), `get_website_partners` (public by design: name, logo, caption of enabled, verified, active businesses). Two businesses are enabled.
- Edge functions deployed: `delete-account`, `geocode`, `notify-event`, `notify-new-message`, `notify-new-request`, `notify-support-reply`, `send-broadcast-notification`, `translate-content`, `translate-user-text`. Notification events run through `notify-event` and a `pg_cron` job every 2 minutes.
- Auth: Google and Apple sign-in on; email auto-confirm on; the default Supabase mailer (2 emails an hour) is unusable for password reset, custom SMTP is pending.
- Content: 2 verified businesses and 2 live offers, translated to he/en.

**Branches** (everything else is merged into `main`; old names are in the archive)
| Branch | What it is | Owner |
|---|---|---|
| `main` | Everything shipped or shippable: web, admin, backend, apps, website source, build settings. Native exports (iOS, Android, web) pass. | Claude |
| `ios/live-rewards-preview-20261026` | Local 3D impact-tree implementation and growth controls for review. Not merged or deployed. | Codex |
| `ota/ios-2.0.1-translations` | The only base for iOS OTAs to the live 2.0.1 users. Never merge it. | Claude |
| `ios/testflight-partner-home-20261024` | Codex's TestFlight beta line (2.0.4 builds 30 and 31); its code is already in `main`, gated by `extra.partnerHomeBeta`. | Codex |
| `android/release-2.0.3-20261025` | Source of the Android 2.0.3 build; merged into `main`. | Claude |

## 4. How to ship (checked recipes)
- **Web and admin:** push to `main`, Vercel deploys. A Vercel preview of the admin is blank (its variables exist only for Production); for a real preview build locally with the public values and `VITE_BASE_PATH=/` and run `vercel deploy --prebuilt`. Remove deployments with `vercel remove <url> --yes`.
- **Marketing website:** `node website/build.mjs` (needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the environment or the root `.env.local`), then upload `website/dist/` to the project `dist` with the Vercel CLI (`vercel deploy --prod` from a folder linked to that project).
- **iOS App Store version:** build on the GitHub macOS runner or reuse a valid TestFlight build; create the version through the API (Apple copies the previous listing and screenshots), set the Arabic "what's new" and review notes, attach the build, submit with `reviewSubmissions` (create, add the version as an item, PATCH `submitted: true`). Release an approved version with `POST /v1/appStoreVersionReleaseRequests` (worked on 2026-10-27; on 2026-10-22 the permission system blocked it and the owner pressed the button).
- **iOS OTA to 2.0.1 users:** cherry-pick onto `ota/ios-2.0.1-translations` in a separate worktree, `npm ci`, `npx expo export --platform ios`, then `eas update --branch production --platform ios --environment production`. Never from `main`.
- **TestFlight build:** bump the build number in `eas.json`, `eas build --platform ios --profile testflight` (or the macOS runner), then `eas submit --platform ios --profile testflight --id <build>`.
- **Android:** `eas build --platform android --profile production` works on the Free plan (about 35 minutes, versionCode auto-increments). `eas submit --profile android-production` fails with "Release in track targeting no countries" until the Production track has countries; the owner sets them in Play Console (Production, Countries/regions) and sends the release and the countries for review together as one change set. A draft release can be uploaded with the Play Developer API and the service account key. Fallback build without Expo: the manual GitHub workflow "Android release build" (never run).
- **Supabase:** SQL through the Management API with `credentials/supabase-token.txt`; functions with `supabase functions deploy <name> --project-ref zmpwdufahjmlxfwzafvr --use-api`. Test risky database changes inside a `DO` block that ends with `raise exception`, so everything rolls back.
- **Gotchas:** `expo export` caches environment variables, so use `--clear` when they change. Git Bash rewrites values that start with `/` (for example `VITE_BASE_PATH=/`); set `MSYS_NO_PATHCONV=1`. Copies of `credentials/` inside a worktree stay git-ignored; delete them afterwards.

## 5. Version registry (reserve before using)
| Platform | Used | Next free |
|---|---|---|
| iOS App Store / TestFlight | 2.0.0 (≤16), 2.0.1 (17), 2.0.2 (28), 2.0.3 (29, live), 2.0.4 (30 beta, 31 in review) | build **32** |
| Android | versionCode 7 (closed test), 8 (2.0.3, production) | **9** |
| Supabase SQL migrations | `0001`–`0052` | **0053** |

## 6. Credentials map (never commit)
`credentials/expo-token.txt`, `credentials/supabase-token.txt`, `credentials/ios/AuthKey_*.p8`, `credentials/android/*.json` (the Play service account, used by EAS Submit and the Play API). Planned: `credentials/smtp-app-password.txt`.

## 7. Open items
**Decisions waiting for the owner:** the partner form (real submission flow or hide it); which Gmail account the app emails use; widen push notifications after launch or not.
**Not done:** manual QA on real phones (request flow with push, delete account, password reset, the new releases); the volunteer screenshot is missing from the store set and the store screenshots show the old Home; English and Hebrew store listing texts (only Arabic exists); custom SMTP; make the `request-photos` bucket private (after most Android users run 2.0.3, because build 7 reads public URLs); human legal review of the English and Hebrew text; background location for Android volunteers (needs Google's permission declaration and a new build); iOS notification settings screen and tap routing for the new events; backlog: audit-log page, admin management, R8/DEX warning (deadline 2027).

## 8. Change log (newest first, 3 lines at most per entry; older entries are in the archive)
Format: `date — who — what (where) — external effect — verified how`

- 2026-10-27 — Codex — Owner requested a different idea: prepared roadside-help journey concept D with built-in ImageGen, visually reviewed; awaiting design selection.
  Review image only (`previews/live-rewards/concepts/`), GitHub sync with deployment disabled. Tree-detail draft paused and left uncommitted; no application, store or backend change.

- 2026-10-27 — Codex — Implemented approved impact-tree concept for local iOS/web review: curved bark, individual leaves, grassy base, progressive growth and responsive live text. Added only related ar/en/he translation keys in Claude's area.
  GitHub branch sync only, Vercel disabled; no store, OTA, Android/backend or production change. Typecheck/lint, 310 tests and iOS/web exports passed; browser QA in ar/en/he. Real iPhone and live-account flow not verified.
- 2026-10-27 — Codex — Owner rejected the medal direction. Prepared impact/tree concept C; archived the uncommitted medal-layout draft and kept A/B as rejected history.
  Visual review only, built-in ImageGen, sample data; no application implementation, deployment, store/OTA or backend action. Awaiting owner feedback.
- 2026-10-27 — Codex — Prepared two rewards-card mock-ups (navy / pearl) for owner selection, per the new review-first rule. Updated local main and this notebook; prior interrupted code draft preserved.
  Review files: `previews/live-rewards/concepts/`. GitHub branch sync only; no implementation of either proposal, deployment, store/OTA/backend action. Visually reviewed; no runtime tests needed for these image-only concepts.
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
