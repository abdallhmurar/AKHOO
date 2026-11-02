# Request photo privacy — implementation and rollout

**الحالة (2/11):** طبّقنا صلاحيات السيرفر 0054 بعد تجربة ناجحة مع التراجع، وفحصنا صورة تجريبية عبر السيرفر والمتصفحات. إصلاح التطبيقات جاهز ومفحوص، ولم يُنشر تحديث للتلفونات. مخزن الصور لا يزال عامًا لحد وصول النسخ المتوافقة واتخاذ قرار بخصوص النسخ القديمة؛ الحماية الكاملة ليست مفعّلة بعد.

## Implemented

- All request-photo renderers use `RequestPhoto`: requester waiting/tracking, helper selection/active mission, legacy native screens, iOS/web variants and admin request detail.
- Existing `photo_url` values are treated as object references, never direct image sources. The parser accepts only this Supabase project's legacy request-photo URL or a safe UUID-prefixed object path. Foreign URLs, traversal, other buckets and query strings are rejected.
- Storage authorizes signing with the current user session. Signed URLs request a 300-second lifetime, refresh before expiry, and revalidate on foreground/network return. They are not saved to database/local storage. Failed/denied image loads show a retry; there is no public-URL fallback.
- Account changes, logout, stale async results, expired URLs and obsolete image errors cannot restore a prior account's photo in the component.
- A stalled signing request now stops loading after 20 seconds and offers retry. A late response from that timed-out attempt cannot restore a photo; the regression test failed before this fix and passes with it.
- Uploaders retain the existing reference format so old clients can interoperate during rollout. Newly uploaded request photos use `cacheControl: '0'`; other media buckets are unchanged. A URL-shaped database value does not make a private bucket public.
- Migration `0054_request_photo_authorized_reads.sql` follows existing **help_requests RLS** for assigned helpers, eligible nearby helpers and admins. Uploaders can also preview their own unreferenced files. Banned accounts cannot read/sign or upload. A request cannot grant access to another requester's folder by re-linking its photo.
- The migration deliberately preserves the bucket's public flag. The private switch is a separate guarded manual operation, outside the automatic migration directory.
- Admin Vite deduplicates React/React Query so the shared hook uses the admin application's instances.
- Admin TypeScript resolves the shared hook's React/Query imports using the admin dependencies. An isolated build outside the repo with only `admin/node_modules` reproduced missing-module errors before this fix; typecheck passes with the explicit paths. This matches Vercel's `admin` root, which includes outside-root source but does not install the Expo dependencies.

## Release sources — preserve Android fixes

- Main-compatible implementation: `fix/request-photo-privacy-20261101`, based on `7a983d1`. iOS production source is `ios/release-2.0.6-20261031` (`1ebae4b`); its app source matches this base apart from a release-config test. This change does not reserve/bump a native build number or alter release settings.
- Android candidate: `fix/android-photo-privacy-20261101`, based on the **actual published OTA source** `android/partner-form-205-20261029` (`3ba06c0`). It preserves the real partner form, native safe-area handling, platform adapters and benefits/activity crash fix. Only photo UI/shared logic and upload cache options were ported. It must NOT be replaced by an OTA built directly from main.
- The backend migration and admin/web changes live only on the main-compatible branch. Do not merge the entire Android release branch into main just to deliver this fix.

## Verified locally

- Main-compatible app: TypeScript passed; full existing suite plus new privacy tests passed (354 tests across 58 files). ESLint has no errors; an existing resolver warning remains in `medal-element.js`.
- Admin: TypeScript passed, 41 tests passed, ESLint no errors (two existing fast-refresh warnings), production Vite build passed with the actual public project configuration. Existing bundle-size warning remains.
- Expo exports passed again November 2 for iOS, Android and web. The Windows all-platform export initially hit `EMFILE`; rerunning with `--max-workers 2` succeeded. The separate Android export used runtime 2.0.5/versionCode 10 release settings on the Android candidate, with its TypeScript/lint and 359 tests passing. Admin production build also passed after the timeout change.
- PostgreSQL tests execute the **complete migration chain** in isolated PGlite, including real RLS, lifecycle RPCs and the guarded cutover. Cases cover anonymous, owner, unreferenced files, nearby/far/stale/unavailable/busy helpers, assigned/completed missions, admin, bans, foreign-folder uploads and malicious re-linking.
- Component/hook tests cover safe sources, visible retry, logout/account switch, failed signing, image load failure, renewal, expired/stalled results, reconnect/foreground and stale callbacks.
- Initial production inspection on November 1 was read-only. On November 2, migration 0054 was tested in a transaction ending in an intentional exception; a subsequent read confirmed the exact original policies and public flag. The migration was then applied and read back: `request photos authorized read`, `request photos owner insert`, bucket still `public=true`.
- Hosted verification on November 2 created two temporary confirmed auth accounts and one synthetic 1×1 PNG, without email, request creation or push registration. Owner upload, signed download with matching bytes, unrelated/anonymous signing denial, and unrelated listing denial passed. The signed image decoded in Chromium and WebKit. The public URL still opened, as required for this stage. The file and both synthetic accounts were deleted successfully. No real user photos were downloaded or request rows modified.
- Reusable opt-in check: `scripts/verify-request-photo-access.mjs --allow-test-accounts --browsers`, with `SUPABASE_PROJECT_REF` and `SUPABASE_ACCESS_TOKEN_FILE` set by the operator. Use `--expect-private` only after cutover. Results and any synthetic cleanup-recovery manifest are git-ignored; credentials and signed URLs are never logged. The first browser attempt lacked Chromium; backend checks and cleanup still passed. After installing the local browser runtime, the complete check passed.
- Not yet verified: physical iPhone/Android interaction, full hosted requester/helper/admin UI flows, CDN invalidation/anonymous public-URL denial after private cutover. Browser image decoding is not a native-device test, and successful policy tests do not mean public URLs are blocked.

## Deployment sequence

1. Fetch latest main and both release sources; recheck claims, migration 0054 reservation and version registry. Claim the release task. Obtain the owner's explicit approval for the store release/OTA scope, per READ_ME_FIRST section 1. Do not reuse an old publication authorization.
2. **DONE November 2:** migration 0054 applied after the rollback rehearsal and policy read-back above. `request-photos.public = true`; hosted upload/public read compatibility passed. Do not repeat this step blindly. This is compatibility preparation, not completion of the privacy fix.
3. Deploy updated web/admin through main only after required checks. Reserve the next free iOS version/build and ship through the approved App Store process (current builds have OTA disabled). Publish Android only from the candidate above with `--platform android`, targeting runtime 2.0.5; preserve the existing release environment. Updating only one platform is insufficient for the cutover.
4. Test on real phones with a harmless synthetic photo: upload; requester waiting/tracking; eligible helper preview; accept/complete; admin view; logout and unrelated account. Use the Storage API with each identity to confirm permitted signing and denied signing for unrelated/anonymous identities. Verify app resume and network recovery. Do not copy tokens or personal photos into logs or git.
5. Confirm the client rollout and decide how to handle users who have not updated. **A new release being available does not update every installed app.** All old direct-public-URL clients, including iOS 2.0.6/older and Android installations without the new OTA, lose request-photo display after closure. No minimum-version enforcement or usage telemetry was added by this task. The owner must explicitly accept/handle that remaining compatibility impact; do not claim it is solved by store approval alone.
6. Only then run `supabase/operations/request-photo-private-cutover.sql` in a reviewed session after `SET akhoo.request_photo_clients_ready = 'yes'`. It refuses to run without the acknowledgement and the phase-1 policy. Check all Storage SELECT policies for unexpected broader grants before execution. Read back `public=false`.
7. Check CDN propagation as well as the database flag. On a project with supported Smart CDN purge, use a server-side secret with `supabase.storage.purgeBucketCache('request-photos')`, then verify the old public URL both from a fresh client and against a previously cached synthetic URL. Do not put privileged credentials in client code. If purge is unavailable, determine the real cache duration and verify old access is denied before marking the fix live; do not guess from the SQL result.
8. Independently verify: old public URL denied without auth; unrelated user's signing request denied; authorized fresh signing and display succeed on web/admin/iOS/Android. Verify denial of an expired token from an uncached request and account for caching below. Record release IDs, deployment IDs, API results and physical-device results in the shared notebook.

## Limits and recovery

- Signed URLs are bearer links: a recipient can share them while valid. Supabase documents that CDN/browser caches and token expiry are independent. A 300-second signing lifetime is **not** a promise that already cached bytes disappear after five minutes. New uploads disable cache reuse, but historical objects and old uploaders may retain earlier cache metadata. CDN purge cannot revoke a file already downloaded by a user.
- Phase-1 SQL was applied November 2. No real-media deletion/rewrite, URL backfill, forced logout, store submission, OTA or marketing-site deployment was performed. Only the synthetic verification accounts/file were created and removed.
- If a client fails during phase 1, leave the bucket public while correcting the client/policy; do not proceed to phase 2. Once closed, prefer fixing authorized access forward. Reopening the bucket restores public exposure and requires an explicit owner decision; do not automatically roll it back to public.
- After accepting old-client retirement, storing plain paths and restricting new writes to them can be a separate migration. It is intentionally not coupled to this rollout.

## Sources checked

- [Supabase bucket access models](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- [Creating signed URLs](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl)
- [Smart CDN and signed-token caching](https://supabase.com/docs/guides/storage/cdn/smart-cdn)
- [Purging CDN cache](https://supabase.com/docs/guides/storage/cdn/purge-cdn-cache)
