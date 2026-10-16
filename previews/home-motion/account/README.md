# Account — local visual preview

Run `node previews/home-motion/serve.cjs` from the repository root and open
`/account/`. `/account` redirects to `/account/`. Home and Activity link here;
Account navigation returns to both.

Default server port: 4178. This review uses <http://127.0.0.1:4179/account/>
because automatic approval review rejected the command to stop/restart the
existing 4178 server. A separate hidden process runs the updated server on 4179;
the original process remains running. To choose an available port in PowerShell:

```powershell
$env:AKHOO_PREVIEW_PORT = '4179'
node previews/home-motion/serve.cjs
```

## Design and scope

All eight reference destinations remain: profile editing moves into the compact
identity card; language, navigation and night mode share Preferences; guide,
privacy, support and unavailable billing share Help and Security. Logout remains
separate. Colored icon tiles and floating navigation follow Activity's design.
Light/dark themes cover the page, navigation, dialogs, forms and feedback.

This isolated HTML/CSS/JS preview imports no app code, calls no account/auth API,
uses no local/session storage, and changes no Expo/native, Vercel, backend or
dependency configuration. The name and `demo@example.com` are fixtures; private
name/email from the reference are not copied into code or QA images.

- Profile: trimmed 2–50 character name, optional demo phone, local photo preview.
  PNG/JPEG/WebP up to 10 MiB are decoded before use. Images use object URLs,
  never uploads. Save applies only in memory; Close/Escape cancels drafts.
  Replaced/cancelled URLs are revoked and stale decodes cannot replace newer
  choices or update a closed editor.
- Language/navigation: native radio dialogs, Save and Cancel. Language selection
  **does not translate this Arabic design preview**, explicitly stated in the
  dialog. No external navigation app opens.
- Night mode affects only this page. Reload restores light theme, sample
  identity and Arabic/Waze choices.
- Three-step guide: Next/Previous/Done, restarting at step one, with existing
  battery/helper artwork and trophy icon.
- Support provides local FAQs. Privacy/Perks show labeled preview explanations.
  Billing stays unavailable. Logout offers staying or returning to local Home;
  it does not sign out a real account. No password entry or support messages.
- Native dialogs trap focus, close with Escape/outside click and restore opener
  focus. Press/hover/switch effects respect reduced motion.

Existing city artwork and Arabic fonts are reused. The regular font comes from
`../activity/assets/arabic-regular.ttf`; its OFL license is
`../assets/FONT-LICENSE.txt`. Flaticon sources are recorded in
[assets/ATTRIBUTION.md](assets/ATTRIBUTION.md), with visible author credits below
the page. Utility icons are inline SVG. No new animation/3D model or dependency.

## Verification

Checked name validation; local photo decode/save; cancelled drafts; non-image
rejection; focus restoration and defaults after reload. Checked language
Cancel/Save, navigation preference, keyboard night-mode switch, guide steps,
Back/Done, Support FAQs, Privacy and the Logout explanation. Home → Account and
Account ↔ Activity load correctly. At 320/390/480px there is no horizontal
overflow and rows are at least 58px. At 320×568, scrolling to the bottom leaves
Logout and attribution above fixed navigation. Reduced motion makes transitions
zero. Syntax, scoped ESLint and diff checks pass. Account retains the server's
`connect-src 'none'` policy. Light/dark screenshots and runtime evidence live
under ignored `test-results/account-motion/`.
