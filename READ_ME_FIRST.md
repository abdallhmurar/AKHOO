# READ ME FIRST — AKHOO shared working file

**For every agent (Claude Code, Codex, anyone else) and for the owner.** Read sections 0 to 3 before you change anything (about 5 minutes). When you finish, add a SHORT entry to section 8 in the same commit (3 lines at most; long reports go in `docs/`) and update sections 0 and 3 if they changed. The file lives on `main`: `git fetch origin && git show origin/main:READ_ME_FIRST.md`.

The complete text of this file as it was before the 2026-10-27 restructure (every old state detail, the 45 change-log entries, the owner's earlier instructions) is kept in `docs/archive/READ_ME_FIRST-until-2026-10-27.md`. Nothing was deleted, only moved.

## 0. الوضع الآن (للمالك) — محدّث 2026-10-27
- **آيفون:** 2.0.4 (التصميم الجديد) نزلت للناس بتاريخ 27/10 بعد موافقة Apple. اللي عند الناس هلأ هو التصميم الجديد (بانر الشركاء وكرت المساعدة الوردي) مع نموذج الشركاء التجريبي. نسخة 2.0.5 (البناء 32، نموذج الشركاء الحقيقي + صورة رئيسية جديدة بالستور) جاهزة بـApp Store Connect وما انبعتت لآبل لسا؛ بانتظار موافقتك على الإرسال.
- **أندرويد:** 2.0.3 حي على Google Play لإسرائيل. 2.0.4 (رقم 9، نفس تصميم الآيفون) انرسلت للإنتاج بتاريخ 28/10 بعد ما جرّبها المالك على جواله من الاختبار الداخلي/المغلق، وبانتظار Google. فلسطين مش موجودة كبلد توزيع عند Google ولا عند Apple.
- **الويب والأدمن وموقع التسويق:** حيين وبآخر نسخة. تطبيق الويب صار بنفس تصميم TestFlight 2.0.4 (31).
- **نموذج الشركاء:** صار حقيقي على الويب من 29/10: الطلب بينحفظ وبيظهر بلوحة الإدارة تحت "طلبات الشراكة". على الأندرويد بده تحديث سريع، وعلى الآيفون بده نسخة جديدة من آبل (النسخة الحالية نموذجها تجريبي). إيميل التنبيه لـ support@akhoo.app بده مفتاح Resend بإعدادات الدالة (لسا ما انحط).
- **بانتظارك:** نوسّع الإشعارات بعد الإطلاق ولا لأ؟ وبدك نكمل نموذج الشركاء على الأندرويد (تحديث سريع) بعد ما تقول.
- **بانتظار طرف ثالث:** Google (أندرويد 2.0.4).
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
| Claude | iOS 2.0.5 (build 32): macOS runner build, App Store version with the real partner form and new screenshots (ar, maybe en/he) | `ios/release-2.0.5-20261029` | 2026-10-29 |

## 3. Current state (2026-10-27)
**iOS** (App Store Connect app `6809610412`, bundle `app.akhoo.help`)
- **2.0.4 (31): LIVE** since 2026-10-27: approved by Apple, released through the API at the owner's standing OK (`READY_FOR_SALE`). Version `120ab703-e74f-40f4-aaa9-226475e3aa66`, build `e01db523-d49b-499f-9871-b93e7cd86306` (the TestFlight binary): partner banner, rose help card, rewards ticket. The partner form is a labelled test that sends nothing. Store screenshots are still the 2.0.3 ones.
- **2.0.5 (32): prepared, NOT submitted** (2026-10-29): App Store version `02393e3d-4044-4947-bbae-a45ae3019496` (`PREPARE_FOR_SUBMISSION`, manual release), build 32 `VALID` (built by `.github/workflows/ios-release-205.yml` on branch `ios/release-2.0.5-20261029`, profile `partner-release-205`, same settings as 2.0.4 plus the real partner form). Arabic "what's new" and review notes updated (the partner form is real now). Screenshots: the Home picture (first one) of the iPhone set was replaced by a new one captured from the web app at 360 px wide (1284x2778); the old Home was removed from the iPad set (3 left). Next: the owner's OK, then `asc-submit` (create `reviewSubmissions`, add the version, PATCH `submitted: true`), then the manual release after Apple approves.
- 2.0.3 (29) and 2.0.2 (28) are the previous live versions; users update normally.
- Users still on 2.0.1 (build 17) get iOS OTAs (channel `production`, runtime 2.0.1) from `ota/ios-2.0.1-translations`. **Builds 28 and later have OTA disabled** (built with the `testflight` profile), so only a new App Store version can change their screens.
- TestFlight: latest 2.0.4 (31) in the internal group "Test"; TestFlight binaries never receive OTAs.
- The Expo Free plan has no cloud iOS builds until 2026-11-01: build iOS on the GitHub macOS runner (`.github/workflows/ios-release-build.yml`, `ios-partner-testflight.yml`; repo secret `EXPO_TOKEN`).

**Android** (`app.akhoo.help`)
- **2.0.4 (versionCode 9) is on the Production track (Israel only), `completed`, in Google review since 2026-10-28**; EAS build `4a679c37-8373-4651-ad87-4258ef53fe04`, source `android/partner-home-20261028` (merged into `main`). It shows the same partner / home layout as the iPhone 2.0.4 (Android files `PartnerHomeScreen.tsx`, `PartnerEnrollment.tsx`, `PartnerMotion.tsx`; the old layout is `LegacyHomeScreen`). It also has an over-the-air update (runtime 2.0.4, update group `636bde81-f12d-4223-a7bf-12322016eef1`) that adds the `akhoo://auth-callback` route, which fixes "Unmatched Route" after Google sign-in on Android. 2.0.3 (8) stays live until Google approves 2.0.4. Internal and closed testing tracks also have 2.0.4 (9). The Android UI was not seen on a device by Claude; the owner tried it on his phone. A second OTA (update group `9f5983f2-fd59-40cd-aeb7-dcf164bd0562`, runtime 2.0.4, 2026-10-29) makes its partner form send real applications.
- No background-location permission (it needs Google's declaration first). The bundle was inspected: new launcher icon, four notification sounds, no foreground-service permission. Checklist: `docs/android-production-release-2.0.3.md`.

**Web and admin** deploy from `main`. The web app home follows the TestFlight 2.0.4 (31) layout since 2026-10-26. CI runs on `main`.

**Marketing website**: folder `website/` (Codex). Public `noindex` preview https://dist-mu-lilac-59.vercel.app/?lang=ar (`en`, `he`) on the Vercel project `dist` (`prj_OQAAoAUvWmMBN1gVm7aMkhzTdhNz`). It is **deployed by hand** as static files (`website/dist/`), never from the repo root, and the project's "Ignored Build Step" (`exit 0`) must stay, or pushes to `main` replace the site with a 404 (it happened on 2026-10-22). It reads the public partner feed `get_website_partners`. Last deployed 2026-10-26, identical to the source on `main`.

**Backend** (Supabase project `zmpwdufahjmlxfwzafvr`)
- Migrations `0001`–`0053` applied (`0053` partner applications; `0048` website partners, applied under the file name `0045`; `0049` announcement video; `0050` GIF allowed in the `content` bucket; `0051` notification events; `0052` push sound pack). Migration `0047` revokes anonymous execute on every SECURITY DEFINER function that exists when it runs; do not re-run it.
- Website partners: table `website_partners`, `admin_save_website_partner` (admin), `get_website_partners` (public by design: name, logo, caption of enabled, verified, active businesses). Two businesses are enabled.
- Partner applications (2026-10-29): table `partner_applications` (RLS: only admins read; rows are written only by the edge function), `admin_set_partner_application` (admin), edge function `submit-partner-application` (public, validated, two per phone a day, sixty an hour). The web form uses it; the Android form needs an OTA and the iPhone form a new App Store version (their source already calls it). The email to the team needs the function secret `RESEND_API_KEY` (the send-only Resend key) and optionally `PARTNER_NOTIFY_EMAIL` (default support@akhoo.app); **not set yet**, the classifier blocked writing secrets, so the owner sets them in the Supabase dashboard (Edge Functions, Secrets) or approves it. Without the secret the application is still stored and shown in the admin. Admin page: "Partner applications" under Commerce, with a badge for new ones.
- Edge functions deployed: `submit-partner-application`, `delete-account`, `geocode`, `notify-event`, `notify-new-message`, `notify-new-request`, `notify-support-reply`, `send-broadcast-notification`, `translate-content`, `translate-user-text`. Notification events run through `notify-event` and a `pg_cron` job every 2 minutes.
- Auth: Google and Apple sign-in on; email auto-confirm on; custom SMTP is on since 2026-10-29 (Resend, `smtp.resend.com:465`, sender "AKHOO" <support@akhoo.app>, limit 30 emails an hour in Supabase; Resend Free = 100 a day, 3,000 a month). The password-reset email (the only one the app triggers) uses a three-language template with the logo: source `supabase/email-templates/recovery.html`, logo `public/email/akhoo-logo.png` (live at akhoo.vercel.app/email/akhoo-logo.png); it is pasted into Supabase through the Management API (`mailer_templates_recovery_content`). The other auth emails keep the Supabase defaults.
- Content: 2 verified businesses and 2 live offers, translated to he/en.

**Branches** (everything else is merged into `main`; old names are in the archive)
| Branch | What it is | Owner |
|---|---|---|
| `main` | Everything shipped or shippable: web, admin, backend, apps, website source, build settings. Native exports (iOS, Android, web) pass. | Claude |
| `ota/ios-2.0.1-translations` | The only base for iOS OTAs to the live 2.0.1 users. Never merge it. | Claude |
| `ios/testflight-partner-home-20261024` | Codex's TestFlight beta line (2.0.4 builds 30 and 31); its code is already in `main`, gated by `extra.partnerHomeBeta`. | Codex |
| `android/release-2.0.3-20261025` | Source of the Android 2.0.3 build; merged into `main`. | Claude |

## 4. How to ship (checked recipes)
- **Web and admin:** push to `main`, Vercel deploys. A Vercel preview of the admin is blank (its variables exist only for Production); for a real preview build locally with the public values and `VITE_BASE_PATH=/` and run `vercel deploy --prebuilt`. Remove deployments with `vercel remove <url> --yes`.
- **Marketing website:** `node website/build.mjs` (needs `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in the environment or the root `.env.local`), then upload `website/dist/` to the project `dist` with the Vercel CLI (`vercel deploy --prod` from a folder linked to that project).
- **iOS App Store version:** (screenshots of a live version are locked by Apple: any change needs a new version; the Build Uploads API commit and the screenshot commit want an **MD5** checksum, SHA_256 gives 409; the artifact of the macOS run must be downloaded by the owner in a logged-in browser) build on the GitHub macOS runner or reuse a valid TestFlight build; create the version through the API (Apple copies the previous listing and screenshots), set the Arabic "what's new" and review notes, attach the build, submit with `reviewSubmissions` (create, add the version as an item, PATCH `submitted: true`). Release an approved version with `POST /v1/appStoreVersionReleaseRequests` (worked on 2026-10-27; on 2026-10-22 the permission system blocked it and the owner pressed the button).
- **iOS OTA to 2.0.1 users:** cherry-pick onto `ota/ios-2.0.1-translations` in a separate worktree, `npm ci`, `npx expo export --platform ios`, then `eas update --branch production --platform ios --environment production`. Never from `main`.
- **TestFlight build:** bump the build number in `eas.json`, `eas build --platform ios --profile testflight` (or the macOS runner), then `eas submit --platform ios --profile testflight --id <build>`.
- **Android:** `eas build --platform android --profile production` works on the Free plan (about 35 minutes, versionCode auto-increments). `eas submit --profile android-production` fails with "Release in track targeting no countries" until the Production track has countries; the owner sets them in Play Console (Production, Countries/regions) and sends the release and the countries for review together as one change set. A draft release can be uploaded with the Play Developer API and the service account key. Fallback build without Expo: the manual GitHub workflow "Android release build" (never run).
- **Supabase:** SQL through the Management API with `credentials/supabase-token.txt`; functions with `supabase functions deploy <name> --project-ref zmpwdufahjmlxfwzafvr --use-api`. Test risky database changes inside a `DO` block that ends with `raise exception`, so everything rolls back.
- **Gotchas:** `expo export` caches environment variables, so use `--clear` when they change. Git Bash rewrites values that start with `/` (for example `VITE_BASE_PATH=/`); set `MSYS_NO_PATHCONV=1`. Copies of `credentials/` inside a worktree stay git-ignored; delete them afterwards.

## 5. Version registry (reserve before using)
| Platform | Used | Next free |
|---|---|---|
| iOS App Store / TestFlight | 2.0.0 (≤16), 2.0.1 (17), 2.0.2 (28), 2.0.3 (29), 2.0.4 (30 beta, 31 live), 2.0.5 (32, in progress) | build **33** |
| Android | versionCode 7 (closed test), 8 (2.0.3, live), 9 (2.0.4, production in review) | **10** |
| Supabase SQL migrations | `0001`–`0053` | **0054** |

## 6. Credentials map (never commit)
`credentials/expo-token.txt`, `credentials/supabase-token.txt`, `credentials/ios/AuthKey_*.p8`, `credentials/android/*.json` (the Play service account, used by EAS Submit and the Play API). Email (2026-10-29): `credentials/resend-api-key.txt` (send-only, used as the SMTP password), `credentials/resend-admin-key.txt` (Full access, manages domains), `credentials/cloudflare-dns-token.txt` (edit DNS of `akhoo.app`). The owner may delete the admin key and the DNS token in Resend / Cloudflare when no longer needed.

## 7. Open items
**Decisions waiting for the owner:** widen push notifications after launch or not; when to ship the real partner form to Android (OTA) and iPhone (new App Store version).
**Not done:** manual QA on real phones (request flow with push, delete account, password reset, the new releases); the volunteer screenshot is missing from the store sets (Arabic, English, Hebrew all show Home, request, perks, activity); a native Hebrew reader for the Hebrew store text; the reset email subject still arrives as the old English "Reset your password" although `mailer_subjects_recovery` is saved (the body and logo did change); per-language emails need the app to store the user language in auth metadata; make the `request-photos` bucket private (after most Android users run 2.0.3, because build 7 reads public URLs); human legal review of the English and Hebrew text; background location for Android volunteers (needs Google's permission declaration and a new build); iOS notification settings screen and tap routing for the new events; backlog: audit-log page, admin management, R8/DEX warning (deadline 2027).

## 8. Change log (newest first, 3 lines at most per entry; older entries are in the archive)
Format: `date — who — what (where) — external effect — verified how`

- 2026-10-29 — Claude — iOS 2.0.5 (32) built on the GitHub macOS runner, uploaded to App Store Connect and prepared at the owner's order: real partner form, new Arabic what's new and review notes, new Home screenshot, old iPad Home removed. NOT sent to Apple yet. Verified: read-back of the version, build `VALID`, screenshots `COMPLETE`. Not verified: the build on a device.
- 2026-10-29 — Claude — Android OTA published at the owner's order (runtime 2.0.4, group `9f5983f2…`): the Android partner form sends real applications. iOS 2.0.5 (build 32) started: same real form plus new store screenshots; needs a new App Store version because Apple locks screenshots of a live version. Not verified: the update on a phone.
- 2026-10-29 — Claude — Partner form made real after the owner's OK: migration 0053 applied to the live database (tested first with a rollback), edge function `submit-partner-application` deployed, admin page "Partner applications", web/Android/iOS forms call it; small edits in Codex files `PartnerEnrollment*.tsx` and `partnerBetaCopy.ts` (the "test" wording is gone in ar/en/he). Not done: the `RESEND_API_KEY` secret (blocked), the Android OTA and the iPhone release. Not verified: the privacy policy mentions partner contact data.
- 2026-10-29 — Claude — Password-reset email redesigned: logo plus Arabic, Hebrew and English in one message (`supabase/email-templates/recovery.html`), applied in Supabase after the owner approved the mock. Verified: real reset emails reached his Gmail inbox with working links. Not verified: how it looks in Outlook or on Android Gmail; the custom subject is ignored by Supabase so far.
- 2026-10-29 — Claude — Domain `akhoo.app` bought by the owner on Cloudflare (renews 2027-10-29, 14.20 USD a year, auto-renew on). `support@akhoo.app` is forwarded by Cloudflare Email Routing to the new inbox `akhooapp@gmail.com` (no mailbox, forward only). Resend sends from it (DNS records added in Cloudflare) and Supabase auth uses it as SMTP. Verified: a real password-reset email for the owner's account reached his Gmail inbox. Not verified: delivery to other providers; the forward into `akhooapp@gmail.com`; Cloudflare says the domain contact email still needs checking only if a warning shows.
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
