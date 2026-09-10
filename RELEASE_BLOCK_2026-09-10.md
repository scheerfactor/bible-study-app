# Bible Study release block — September 10, 2026

## Release decision

**The full milestone statement cannot yet truthfully be claimed.** Offline reading, local lesson preparation, saving, and visible teaching/pre-class countdowns passed against the production build in Chromium. Physical iPad/iPhone installation and a two-device authenticated remote session remain unverified. Nothing was deployed.

## Implementation and source

Release branch: `codex/bible-offline-release-20260910`.

Base: `origin/codex/pre-class-countdown` at `1a1c09e`. Integrated the existing Sunday School workflow commit `34b2961`, resolving four page conflicts and one package-script conflict while retaining newer controls, resource tools, countdowns, and image selection. The resulting integration commit is `658ae08`.

This is based on the newer teaching release branch, **not current origin/main** (`ddf1291`). The release patch must be applied to `1a1c09e` or reviewed against that baseline; applying it blindly to main would omit earlier release work. The older local checkout and its extensive uncommitted content changes were left untouched.

New work:

- Web app manifest, standalone display, Apple installation metadata, 192/512 icons and a 180-pixel Apple icon derived from the existing brand asset.
- An explicit “Install app & offline study” panel with Safari instructions, download progress, completion verification, and clear online-only limits.
- A build-generated service worker with an exact public asset allowlist. It downloads the root page, app code/styles/fonts, icons, and all four KJV parts. The current build includes 67 assets and 10.6 MB of app assets plus Scripture.
- Failed initial downloads remove their incomplete cache. Missing cached files prevent a ready status and can be repaired. New builds wait for existing app tabs to close. Only this app's older offline caches are removed.
- Account traffic, authorization-bearing requests, library APIs, query-token URLs, cross-origin resources, and server-component requests are excluded. No third-party book, recording, or hymn content was imported.
- Lesson creation waits for the complete KJV corpus, avoiding incomplete Scripture slides during startup.

Integrated existing work now available alongside the countdown:

- The existing “The Ministry of Forgiveness” lesson for 2 Corinthians 2:1–17, with a 35-minute, four-section teaching plan, discussion questions, teacher answer guides, application, and prayer.
- 2 Corinthians 6:1–18 retains October 11, 2026, with its 35-minute teaching plan. Chapter 3 remains part of the existing lesson set.
- Prepare to teach, generated Scripture slides, local saving, teaching notes, and audience-only offline presentation export.
- Existing doctrinal cautions and content-rights guidance remain intact. Lesson drafts still require teacher review. The chapter 2 test used the repository's existing lesson template; no unavailable attachment from the referenced conversation was reconstructed.

## Verification

Passed:

- Production build: `npm run build -- --webpack`, including TypeScript and the postbuild offline worker. The default Turbopack build was blocked by this environment's local process/port restriction; it was not counted as passing.
- `npm run test:offline`: failed-install cleanup, readiness, missing-file repair, version cleanup, and sensitive-request exclusions.
- Sunday School tests: lesson schedules, normalization, malformed imports, export escaping, teacher-note exclusion.
- Pre-class countdown tests: KJV checks, timing boundaries, zero clamp, invalid imports, local/account countdown-storage separation, background identifiers.
- Presentation security source-contract audit. This checks repository code, not the live database's readiness.
- PowerPoint privacy tests inspect actual exported archives for public/private note separation and preserved Scripture text.
- Targeted lint for the added UI/manifest and integrated lesson components; diff whitespace check.
- `npm run test:release-browser` against the production server, with the browser switched offline before reloading: all 31,102 KJV verses available, including all 257 verses of 2 Corinthians; chapter 2 saved with the final verse present; teacher answers excluded from audience fields; teaching countdown changes from 35:00 to 34:49; pre-class countdown ticks at 390-pixel phone width without horizontal dialog overflow; chapter 6 retains October 11 and its final verse; saved lesson survives reload. No browser page errors. Screenshots visually inspected.

These were signed-out local browser tests, not authenticated cloud-save or physical Apple-device tests. Online reference lookups, books/audio, cloud sync, and cross-device control are not offline features. Lessons are saved locally; a successful local save does not prove cloud persistence. Browser storage can be cleared or evicted, so exported backups remain necessary.

## Remaining Bible Study gates

1. Deploy/review this branch through the existing release process. Ensure deployment runs the npm build script including `postbuild`; invoking `next build` directly omits `public/sw.js` generation. Confirm `/sw.js`, `/manifest.webmanifest`, all precache paths, and HTTPS in the deployed environment.
2. On real iPad and iPhone: install through Safari, finish the offline download, close the app, enable airplane mode, reopen from the Home Screen, read 2 Corinthians 2 and 6, save/reopen the lesson, and rehearse teaching. Check interruption/resume and available storage.
3. The live Bible database `fmwgvgdmmlkcgyqalwfe` has presentation-session RLS and Realtime publication, but **no public presentation RPC functions**. The new frontend calls `apply_presentation_session_action`, whose repository migration is `20260827164153_authorize_presentation_actions_with_rpc.sql`. Therefore shared remote control is blocked. Review/apply that migration in the deployment process and verify independent signed-in device sessions, approval, lock, next/back, blank, expiry, and reconnect. Do not weaken RLS to make a session code work.
4. Shared timer restart is also not established: the repository RPC accepts `restart_timer` but does not persist a dedicated timer-start field; controller timing is local. Local teaching countdowns passed. Do not advertise synchronized cross-device timer resets.
5. Supabase's security advisor reports leaked-password protection disabled. See [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Margin Mastery — bounded launch verification

No product features or production data changed. Inspected the existing `Budget Web app/lovable-app` source, built a disposable copy, ran tests, and used read-only aggregate database queries.

- **Build/data integrity:** production build passes; all 12 existing beta-stability tests pass, including rollover math, failed inserts, invalid money, account switching, and stale-response protection. Live tables have RLS enabled and existing persisted data; this does not establish a new end-to-end authenticated write/reload flow.
- **Auth/SMTP:** existing auth code inspected; fresh signup, confirmation delivery, password reset, and session restoration were not tested with an email/account. SMTP is not verified.
- **Onboarding: blocked.** A failure-injection harness reproduced completion being saved before a failed paycheck insert. Repeated attempts can also repeat earlier inserts because the multi-table workflow lacks a transaction/idempotent completion boundary. A second reproduction confirmed Skip clears the local draft and navigates despite a failed settings write.
- **Payments: provider mismatch.** The inspected live backend deploys SureCart webhook/redemption functions, not a Paddle handler. It has no subscription rows and two live, redeemed SureCart entitlements. Paddle purchase/renewal/cancellation/refund/replay cannot be marked verified.
- **Entitlements:** both redeemed entitlements have matching profiles/tiers, with no missing profile or conflicting user IDs in the checked join. This does not prove renewal/revocation behavior.
- **Webhook history:** 14 events: seven processed, five errors, one ignored, one manual review. The errors are historical June records, mostly missing/invalid signatures (some with audit markers), not evidence of five current customer failures. One generic webhook failure and one unconfigured product/price event also exist. Reconcile their outcomes before paid launch.
- **Feedback:** one persisted feedback row exists. A new authenticated submission, admin visibility, and any notification delivery remain untested.

Margin Mastery is **not launch-verified**. Next verification must use a test account and the intended payment provider's sandbox to cover signup/email, onboarding success and failure recovery, payment lifecycle/replayed events, entitlement refresh and revocation, feedback, and logout/login persistence. Keep this separate from adding features.

No Planner or Digital Safety dashboard work was performed.
