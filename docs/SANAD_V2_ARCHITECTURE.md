# SANAD V2 architecture

## Product boundary

SANAD V2 is a Jerusalem-first, non-emergency civic assistance network. “I Need Help” and “I Can Help” are equal primary actions. Emergency screening happens before a community request is published, and direct-risk cases are handed to official emergency services instead of volunteer matching.

Supported locales:

- Arabic (`ar`) — primary, RTL, Noto Sans Arabic
- Hebrew (`he`) — RTL, Noto Sans Hebrew
- English (`en`) — LTR, Inter

## Navigation ownership

The root Expo Router layout restores language and session state before rendering protected content. `Stack.Protected` gates authenticated and unauthenticated route trees.

| Route group | Responsibility |
| --- | --- |
| `/language` | first launch and account language selection |
| `/(auth)` | welcome, login, signup, verification, reset, offline/session states |
| `/(tabs)` | Home, Community, Activity, Account |
| `/(requester)/requester` | emergency, category, scenario, details, media, location, review, matching, assignment |
| `/(helper)/helper` | value proposition, skills, languages, availability, nearby map, request detail |
| `/mission/[missionId]` | live status, map, identity, conversation, completion, rating, dispute, report, block |
| `/community` | businesses, details, offers, SANAD+, rewards, points |
| `/account` | profile, settings, language, notifications, accessibility, privacy, safety, support |

Typed route objects are used for dynamic mission, request, business, and offer identifiers. The `sanad://` scheme supports deep links; route guards re-check session, account restriction, and first-launch language state.

## Runtime providers

```text
SafeAreaProvider
  LanguageDirectionProvider
    LanguageReadyGate
      QueryProvider
        AuthProvider
          MissionProvider
            Toast + error boundary
              Expo Router outlet
```

- `LanguageDirectionProvider` persists locale and provides logical RTL direction without forcing a process restart.
- `AuthProvider` owns session restoration, profile hydration, auth events, restriction state, and session expiry.
- `QueryProvider` configures server-state caching, retry policy, network mode, and centralized background error feedback.
- `MissionProvider` owns the active mission query and realtime invalidation.

## Data flow

Screens call repositories through TanStack Query or mutations:

```text
screen → feature state → repository/service → Supabase client
       ← query cache  ← normalized errors   ← RLS / secured RPC
```

Direct Supabase access is restricted to repositories, providers that restore authentication, and low-level platform services. User-facing errors are normalized and localized before display.

The requester and helper multi-step forms persist safe drafts in AsyncStorage. Sensitive media is uploaded to the private `request-media` bucket and associated with a request by a server-side RPC.

## Civic Signal design system

Brand anchors:

| Token | Value | Role |
| --- | --- | --- |
| Navy | `#0B1F33` | civic authority and fixed dark brand surfaces |
| Signal Blue | `#1768E5` | requester and primary action |
| Community Teal | `#147D62` | helper, trust, and successful community action |
| Emergency Coral | `#C93D34` | emergency and destructive action only |
| Reward Gold | `#D99B22` | points, rewards, and SANAD+ |
| Fog | `#F3F6FA` | calm application canvas |

Semantic light/dark tokens live in `src/lib/theme.ts`. Primitives in `src/components/ui` implement buttons, inputs, cards, surfaces, sheets, toasts, skeletons, empty/error/offline states, status badges, avatars, modals, and tabs. Product-level components in `src/components/v2` implement the civic brand, screen shell, action cards, map panels, progress headers, mission timeline, list rows, and rating controls.

All interactive controls provide accessibility roles and labels, minimum touch targets, loading/disabled feedback, and mirrored directional icons where appropriate.

## Requester journey

1. Screen immediate danger, medical emergency, fire/violence, and vulnerable-person risk.
2. Select one of nine civic support categories.
3. Select a contextual scenario.
4. Add details and urgency.
5. Optionally attach private media.
6. Confirm an approximate Jerusalem location.
7. Review privacy and non-emergency assertions.
8. `create_civic_request` atomically creates the request, media references, mission, and first mission event.
9. Matching polls/realtime-invalidates until a helper is assigned.
10. The live mission controls chat, map, arrival, completion confirmation, rating, dispute, report, and block.

## Helper journey

1. Review safety boundaries and consent.
2. Select category/scenario skills.
3. Select spoken languages.
4. Enable availability, location, and optional push registration.
5. Browse eligible nearby requests on a map/list.
6. Review redacted request details.
7. `accept_mission` performs atomic assignment and prevents double acceptance.
8. Advance through on-the-way, arrived, in-progress, and completion-requested states.
9. Requester confirmation closes the mission and unlocks private rating.

## V2 database entities

Migration `0017_sanad_v2_civic_platform.sql` adds:

- `categories`, `scenarios`
- `missions`, `mission_events`, `mission_messages`
- `request_media`
- `helper_skills`, `helper_languages`
- `devices`, `notifications`
- `ratings`, `reports`, `blocks`
- `rewards`, `redemptions`

It extends `help_requests` rather than replacing it, and synchronizes compatible legacy requests into V2 missions. Existing profiles, partner businesses, offers, SANAD+ membership data, and legacy mission RPC fallbacks are retained.

Fifteen V2 tables have RLS enabled. Critical writes go through fifteen explicitly secured RPCs. Request media is private, limited to approved image MIME types and 10 MB, and readable only by its owner, the matched mission participant, or an administrator. Mission, event, and message changes are added to realtime publication.

## Security and safety invariants

- The client never receives a Supabase service-role key.
- A helper cannot accept the same request twice or take an already-assigned mission.
- Exact requester location and private media are participant-only.
- Mission status transitions are validated server-side.
- Ratings are participant-only and one per author/mission.
- Reports and blocks are recorded separately from public profile data.
- Rewards and offers are redeemed through locked server-side balance operations.
- Emergency numbers are explicit and SANAD does not promise emergency response.

## Verification strategy

- TypeScript strict check and ESLint for the active application.
- Vitest unit suite for domain rules, localization parity, theme/direction invariants, and existing business logic.
- Static migration verifier for tables, RLS, RPC security, media, realtime, and multilingual seeds.
- Playwright read-only browser tests for authentication, first launch, Arabic/Hebrew RTL, English LTR, and responsive widths.
- Expo web/native bundle export before release.
- Required staging checks with two disposable users for authenticated requester/helper and realtime behavior.

## Production release gates

The repository implementation does not by itself authorize or perform external production changes. Before launch:

1. Apply migration `0017` to a Supabase staging branch and run two-user mission tests.
2. Confirm existing production rows pass new constraints and verify rollback/backup.
3. Configure push credentials and deploy/update notification Edge Functions.
4. Build EAS development and release clients; test MapLibre, foreground/background location, media permissions, and deep links on physical Android and iOS devices.
5. Complete operational safety moderation, support staffing, privacy policy, and store disclosures.
6. Add a compliant payment provider before activating paid SANAD+ checkout.
