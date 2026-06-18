# Public Beta Readiness Audit

## Current Recommendation

The app is ready to keep moving toward a small public beta, but it should launch free first with optional support/donation rather than paid access. Paid plans should wait until account sync, admin separation, licensed-resource tracking, and support workflows are proven with real testers.

## Public-Ready Areas

- Bible Reader and Quick Jump
- reviewed public-domain Library resources
- commentary comparison and Passage Guide
- prayer, journal, sermon, and presentation workflows in beta form
- feedback form
- public-domain audio pilot records

## Protected Admin Areas

These must stay hidden from normal public users:

- Library Acquisition Center
- Rights Management Center
- import queue
- permission tracker
- OCR cleanup queue
- media intake drafts
- permission-needed resources
- personal-use-only resources
- internal acquisition notes

Production admin access now requires:

- Supabase sign-in configured
- `NEXT_PUBLIC_ADMIN_EMAILS` configured with allowed admin email addresses

Localhost can still preview admin tools for development.

## Recommended Launch Order

1. Private beta with 5-10 trusted testers.
2. Free public beta with clear feedback flow.
3. Optional donation/support button.
4. Signed-in accounts for sync.
5. Paid tier only after demand is proven.
6. Licensed/premium books only after written permission.

## Donation Before Payments

Donation is lower-risk than subscriptions because it does not require deciding which Bible study features are locked. Keep Scripture reading and core public-domain study free during early beta.

## Copyright Permission Path

Start asking permission now, but do not block launch on it.

Good first targets:

- smaller Baptist publishers and ministries
- living authors you can contact directly
- sermon ministries that may approve audio/video use
- trusted KJV/Baptist study resources where rights holders are reachable
- modern books only when written permission is granted

Rules:

- owning a physical book does not grant public digital distribution rights
- no response does not equal permission
- permission-needed resources stay hidden
- personal-use uploads must remain private to that user
- AI/TTS narration requires explicit permission when the work is copyrighted

## Remaining Before Wider Public Launch

- verify admin routes are locked on production for signed-out users
- configure `NEXT_PUBLIC_ADMIN_EMAILS`
- run mobile QA at 390px
- confirm no import/planning notes appear in public Library
- add a gentle donation/support page only after tester feedback
- confirm feedback submissions are captured reliably
- finish one or two real audio/listening flows before advertising audio heavily
