# Official marketing domain — 2026-10-29

The owner explicitly requested connecting the newly purchased `akhoo.app` domain to the existing AKHOO marketing website. The result is **https://akhoo.app**, with `www.akhoo.app` redirecting to the apex. This is the public introduction site, not the authenticated Expo app or admin.

## Applied configuration

- Vercel team: `abad003-6200s-projects`; project: `dist` (`prj_OQAAoAUvWmMBN1gVm7aMkhzTdhNz`). Both custom domains are attached and verified.
- Serving the existing deployment `dpl_FrQrBVSV7AxFt9dVWfEiXaTuHydM`, also available at `dist-mu-lilac-59.vercel.app`. No rebuild, promotion, application release, OTA or backend mutation was performed.
- Vercel project-domain redirect: `www.akhoo.app` → `akhoo.app`, HTTP 308, with path and query preserved.
- Cloudflare remains the authoritative DNS provider. Existing nameservers `kirk.ns.cloudflare.com` and `perla.ns.cloudflare.com` are unchanged.
- Added the following DNS-only records, using the current recommendations returned by Vercel for this project. All have TTL 300 and `proxied: false`:

| Type | Name | Value |
| --- | --- | --- |
| A | `akhoo.app` | `216.198.79.1` |
| A | `akhoo.app` | `64.29.17.1` |
| CNAME | `www.akhoo.app` | `34e0cc0f3a84392b.vercel-dns-017.com` |

All nine existing DNS records were compared by ID, type, name, content, priority, TTL and proxy status before/after and are unchanged, including Cloudflare Email Routing, SPF/DKIM and Resend records. Private snapshots and validation artifacts remain in ignored `credentials/`, outside git. No email message was sent as part of this task.

## Verification

Visitor story: the official URL resolves through Cloudflare DNS to the existing Vercel website; HTTPS serves the page and assets, language selection renders the correct text, and the existing public partner feed loads on the new origin.

| Boundary | Evidence |
| --- | --- |
| Domain ownership and routing | Vercel verification for apex and www: `ok: true`, `misconfigured: false`, project attached/verified. |
| Public DNS | External resolver returned the added apex addresses and www CNAME. |
| HTTPS | Requests/browser loads succeeded without certificate bypass for both domains. Local TLS is inspected by Norton; no claim is made about the public certificate issuer from that local inspection. |
| Redirects | www root and `/privacy.html?lang=he` returned 308 to the same apex path/query. HTTP apex redirects to HTTPS. |
| Correct website | HTML, JS, CSS, brand image and privacy/terms/deletion pages are byte-identical to the existing public marketing alias. |
| Browser render | Arabic, English and Hebrew at 390px render the appropriate title/heading/direction, without horizontal overflow or broken loaded images. Arabic desktop and mobile screenshots inspected. |
| Partner data | Public `get_website_partners` returned 200 on each checked page; no browser page errors or failed requests. No forms submitted. |

## Handoff

- Existing `noindex,nofollow` metadata remains, so connecting the domain does **not** enable search indexing. This was disclosed to the owner; search-launch/content work is separate.
- The website's existing Android availability wording and WhatsApp partnership flow were not changed by this domain task.
- Keep `commandForIgnoringBuildStep: exit 0` on the Vercel marketing project. The connection preserves the currently working deployment; future website deployments must still upload only the static `website/dist/` output.
- This branch disables its own automatic app/admin Vercel previews. GitHub synchronization documents the domain work without deploying either app. Changes in Claude-owned areas are limited to DNS coordination and branch-specific deployment suppression.
- If routing must be rolled back, remove only these three added web records and the two corresponding project domains. Preserve existing email/verification records and nameservers; no rollback has been executed.

Official references used: [Vercel custom domain configuration](https://vercel.com/docs/domains/working-with-domains/add-a-domain), [project-domain redirects](https://vercel.com/docs/rest-api/projects/update-a-project-domain), [Cloudflare DNS record creation](https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/create/).
