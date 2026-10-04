# Published content translation

Admin-only endpoint. Arabic originals are stored alongside English/Hebrew translations for offers, announcements and support replies. Images and text embedded in images are not translated. Internal support notes and user-authored chat messages are not sent to the provider.

## Activate

1. In the owner's Google Cloud project, enable **Cloud Translation API** and configure billing/quotas for that project.
2. Create an API key restricted to Cloud Translation API. Store it as **`GOOGLE_TRANSLATE_API_KEY`** in the linked Supabase project's **Edge Functions → Secrets**. Never put it in an `EXPO_PUBLIC_*` or `VITE_*` variable, commit it, or paste it into chat.
   Alternatively, store a service account JSON as **`GOOGLE_TRANSLATE_SERVICE_ACCOUNT`**, a server-only Supabase secret. The endpoint signs translation-scoped OAuth tokens, caches them and refreshes before expiry. The API key takes precedence if both are configured. Never expose either credential to clients.
3. Reload an admin offer form. Its translation status should say enabled.
4. In a test environment, approve an Arabic offer and inspect its English/Hebrew text. Publish a test announcement only to an authorized test audience/account; do not broadcast a test to real users.

Reference: https://docs.cloud.google.com/translate/docs/reference/rest/v2/translate

The server sends only the selected text fields, not identifiers, emails, image URLs or device tokens. API failures never log the message or the provider response.

## Behavior

- Without a configured credential, the admin sees a setup notice and a warning when saving; publishing continues with the original text. This is not a successful translation.
- With a configured key, translation finishes before approving an offer, saving edits to an approved offer, or sending a message. Draft saves do not call the provider. Support pushes and in-app messages use the same stored text. Provider failures prevent that new publication and preserve the composer for retry.
- Editing source text invalidates old translations. Unchanged offer text reuses its translations, including image-only edits. Reapproving an older offer generates its translations. Older announcements and replies are not backfilled automatically.
- The app selects translations on every language change. The source is always the fallback. Push language belongs to each installation, updated at sign-in and language changes; devices that have not received this app update still default to Arabic.
- `get_push_recipients` and the original text fields remain backward compatible. The new localized recipients RPC is service-role-only.

## Verification

`npm test`, `npm run typecheck`, `npm run typecheck:edge`, and the admin test/build cover input bounds, complete provider responses, source freshness, language switching, private support access, announcement eligibility/receipts and per-device push ownership. A live provider smoke test is still required after setting a real key.
