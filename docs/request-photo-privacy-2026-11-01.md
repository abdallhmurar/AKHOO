# Request photo privacy — implementation and rollout

**الحالة:** الإصلاح جاهز بالفروع المخصصة وفحوصه ناجحة. لم يُنشر تحديث تطبيق، ولم تُطبَّق الهجرة أو يُغلق مخزن الصور الحي. الوصول العام الحالي لا يزال قائمًا حتى إكمال مراحل النشر أدناه.

## Implemented

- All request-photo renderers use `RequestPhoto`: requester waiting/tracking, helper selection/active mission, legacy native screens, iOS/web variants and admin request detail.
- Existing `photo_url` values are treated as object references, never direct image sources. The parser accepts only this Supabase project's legacy request-photo URL or a safe UUID-prefixed object path. Foreign URLs, traversal, other buckets and query strings are rejected.
- Storage authorizes signing with the current user session. Signed URLs request a 300-second lifetime, refresh before expiry, and revalidate on foreground/network return. They are not saved to database/local storage. Failed/denied image loads show a retry; there is no public-URL fallback.
- Account changes, logout, stale async results, expired URLs and obsolete image errors cannot restore a prior account's photo in the component.
- Uploaders retain the existing reference format so old clients can interoperate during rollout. Newly uploaded request photos use `cacheControl: '0'`; other media buckets are unchanged. A URL-shaped database value does not make a private bucket public.
- Migration `0054_request_photo_authorized_reads.sql` follows existing **help_requests RLS** for assigned helpers, eligible nearby helpers and admins. Uploaders can also preview their own unreferenced files. Banned accounts cannot read/sign or upload. A request cannot grant access to another requester's folder by re-linking its photo.
- The migration deliberately preserves the bucket's public flag. The private switch is a separate guarded manual operation, outside the automatic migration directory.
- Admin Vite deduplicates React/React Query so the shared hook uses the admin application's instances.

## Release sources — preserve Android fixes

- Main-compatible implementation: `fix/request-photo-privacy-20261101`, based on `7a983d1`. iOS production source is `ios/release-2.0.6-20261031` (`1ebae4b`); its app source matches this base apart from a release-config test. This change does not reserve/bump a native build number or alter release settings.
- Android candidate: `fix/android-photo-privacy-20261101`, based on the **actual published OTA source** `android/partner-form-205-20261029` (`3ba06c0`). It preserves the real partner form, native safe-area handling, platform adapters and benefits/activity crash fix. Only photo UI/shared logic and upload cache options were ported. It must NOT be replaced by an OTA built directly from main.
- The backend migration and admin/web changes live only on the main-compatible branch. Do not merge the entire Android release branch into main just to deliver this fix.

## Verified locally

- Main-compatible app: TypeScript passed; full existing suite plus new privacy tests passed (353 tests across 58 files). ESLint has no errors; an existing resolver warning remains in `medal-element.js`.
- Admin: TypeScript passed, 41 tests passed, ESLint no errors (two existing fast-refresh warnings), production Vite build passed with the actual public project configuration. Existing bundle-size warning remains.
- Expo exports passed for iOS, Android and web. Separate Android export used runtime 2.0.5/versionCode 10 release settings on the Android candidate, with its TypeScript/lint and 358 tests passing.
- PostgreSQL tests execute the **complete migration chain** in isolated PGlite, including real RLS, lifecycle RPCs and the guarded cutover. Cases cover anonymous, owner, unreferenced files, nearby/far/stale/unavailable/busy helpers, assigned/completed missions, admin, bans, foreign-folder uploads and malicious re-linking.
- Component/hook tests cover safe sources, visible retry, logout/account switch, failed signing, image load failure, renewal, expired/stalled results, reconnect/foreground and stale callbacks.
- Production inspection was **read-only**: bucket/public flag, policy definitions and aggregate reference-format compatibility only. Existing reference formats match this parser/policy. No production photos were downloaded, request rows modified, test requests submitted, or notifications sent.
- Not yet verified: real iPhone/Android interaction; the hosted Storage HTTP endpoint after deployment; CDN invalidation/anonymous denial after private cutover. A successful SQL policy test is not proof that public URLs are blocked.

## Deployment sequence

1. Fetch latest main and both release sources; recheck claims, migration 0054 reservation and version registry. Claim the release task. Obtain the owner's explicit approval for the store release/OTA scope, per READ_ME_FIRST section 1. Do not reuse an old publication authorization.
2. Review/apply migration 0054 **before** delivering these clients. First execute it against the production schema inside a transaction that intentionally raises an exception to roll back. Then apply and read back the policies. Keep `request-photos.public = true` at this stage; check old-client uploads/public reads still work. This is compatibility preparation, not completion of the privacy fix.
3. Deploy updated web/admin through main only after required checks. Reserve the next free iOS version/build and ship through the approved App Store process (current builds have OTA disabled). Publish Android only from the candidate above with `--platform android`, targeting runtime 2.0.5; preserve the existing release environment. Updating only one platform is insufficient for the cutover.
4. Test on real phones with a harmless synthetic photo: upload; requester waiting/tracking; eligible helper preview; accept/complete; admin view; logout and unrelated account. Use the Storage API with each identity to confirm permitted signing and denied signing for unrelated/anonymous identities. Verify app resume and network recovery. Do not copy tokens or personal photos into logs or git.
5. Confirm the client rollout and decide how to handle users who have not updated. **A new release being available does not update every installed app.** All old direct-public-URL clients, including iOS 2.0.6/older and Android installations without the new OTA, lose request-photo display after closure. No minimum-version enforcement or usage telemetry was added by this task. The owner must explicitly accept/handle that remaining compatibility impact; do not claim it is solved by store approval alone.
6. Only then run `supabase/operations/request-photo-private-cutover.sql` in a reviewed session after `SET akhoo.request_photo_clients_ready = 'yes'`. It refuses to run without the acknowledgement and the phase-1 policy. Check all Storage SELECT policies for unexpected broader grants before execution. Read back `public=false`.
7. Check CDN propagation as well as the database flag. On a project with supported Smart CDN purge, use a server-side secret with `supabase.storage.purgeBucketCache('request-photos')`, then verify the old public URL both from a fresh client and against a previously cached synthetic URL. Do not put privileged credentials in client code. If purge is unavailable, determine the real cache duration and verify old access is denied before marking the fix live; do not guess from the SQL result.
8. Independently verify: old public URL denied without auth; unrelated user's signing request denied; authorized fresh signing and display succeed on web/admin/iOS/Android. Verify denial of an expired token from an uncached request and account for caching below. Record release IDs, deployment IDs, API results and physical-device results in the shared notebook.

## Limits and recovery

- Signed URLs are bearer links: a recipient can share them while valid. Supabase documents that CDN/browser caches and token expiry are independent. A 300-second signing lifetime is **not** a promise that already cached bytes disappear after five minutes. New uploads disable cache reuse, but historical objects and old uploaders may retain earlier cache metadata. CDN purge cannot revoke a file already downloaded by a user.
- No automatic deletion, media rewrite, URL backfill, forced logout, store submission, OTA, marketing-site deployment or live SQL change is part of this prepared branch.
- If a client fails during phase 1, leave the bucket public while correcting the client/policy; do not proceed to phase 2. Once closed, prefer fixing authorized access forward. Reopening the bucket restores public exposure and requires an explicit owner decision; do not automatically roll it back to public.
- After accepting old-client retirement, storing plain paths and restricting new writes to them can be a separate migration. It is intentionally not coupled to this rollout.

## Sources checked

- [Supabase bucket access models](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control)
- [Creating signed URLs](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl)
- [Smart CDN and signed-token caching](https://supabase.com/docs/guides/storage/cdn/smart-cdn)
- [Purging CDN cache](https://supabase.com/docs/guides/storage/cdn/purge-cdn-cache)
