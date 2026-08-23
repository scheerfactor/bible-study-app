# September 11 Presentation Readiness

Target teaching date: 2026-09-11. Proclaim On Air renewal date: 2026-09-18.

## Architecture Decision

Do not build a separate native presentation app before September 11. The current web app already has distinct surfaces that can run on separate devices:

- **Presentation Workspace:** create the lesson and slides.
- **Presenter View:** read private lesson notes and see the current and next slides.
- **Controller View:** advance, go back, jump, blank, unblank, and restart the timer from an iPad or phone.
- **Presentation View:** show the clean full-screen output on the projector computer.

This preserves one lesson and one deck while letting each device do one clear job. A dedicated companion app can be reconsidered only after the web workflow is secure, rehearsed, and proven insufficient.

## September 11 Device Plan

| Device | View | Purpose |
| --- | --- | --- |
| Church projector computer | Presentation View or exported PowerPoint | Full-screen congregation display |
| Pulpit iPad | Presenter View | Lesson manuscript, current slide, next slide, and timer |
| Phone or second tablet | Controller View | Simple backup slide control |

For secure shared control, sign in to the same Father's Business account on all three devices. A signed-out presentation remains local to one browser and is not a cross-device control method.

For the first live use, the exported PowerPoint should be the projector source unless remote-session security hardening and two full rehearsals are complete. The Bible study app can remain open on the iPad for the lesson and notes.

## Rehearsal Deck Available Now

The app already includes a seven-slide, 35-minute John 3 rehearsal lesson titled **Ye Must Be Born Again**. It uses John 3:1-18 and includes exact KJV wording for John 3:16. This is the infrastructure rehearsal deck, not an assumption about Stephen's final September 11 subject.

1. Open **Sermons** and choose **Load John 3 Sample**.
2. Read every outline point and verify every KJV quotation before rehearsal.
3. Save the lesson, then open **Presentations** and attach or generate its slide deck.
4. Export both PowerPoint and PDF copies.
5. Sign in to the same account on the pulpit iPad, projector computer, and controller device.
6. Run the Presenter, Presentation, and Controller views together.
7. Record failures in `CHURCH_PRESENTATION_QA.md`.

To build the actual September 11 deck, replace the rehearsal content after the passage, lesson title, audience, target length, and teaching aim are known. Do not guess the final message or Scripture text.

## Readiness Schedule

### By August 28

- Build one real September 11 lesson in Presentation Workspace.
- Confirm the slide sequence, KJV wording, lesson notes, Scripture references, and timing.
- Export the deck to PowerPoint and PDF.
- Open both exports on the actual church presentation computer.
- Test Presenter, Controller, and Presentation views across two physical devices.

### By September 1

- Complete a 30-minute desk rehearsal without editing the deck mid-run.
- Verify Previous, Next, First, Last, Blank, Show Slide, Restart Timer, and manual keyboard control.
- Confirm the iPad remains readable in portrait and landscape and does not sleep.
- Confirm private notes are absent from every congregation-facing slide and export.

### By September 4

- Run a complete rehearsal on the church Wi-Fi, projector, display resolution, browser, adapters, and sound system.
- Disconnect the controller during the rehearsal and verify the projector can still advance manually.
- Keep a PowerPoint, PDF, and printed lesson backup.
- Record every failure in `CHURCH_PRESENTATION_QA.md` and repeat the failed check.

### By September 8

- Lock the lesson text and slide order except for corrections.
- Repeat the complete church rehearsal with the final deck.
- Place the PowerPoint and PDF on both the church computer and an offline USB drive.
- Charge the iPad and controller device and pack their cables and adapters.

### September 11

- Arrive early enough to test the projector and first/last slides.
- Use the proven primary path from rehearsal.
- Keep keyboard/manual advance and exported files immediately available.
- Do not troubleshoot a new feature during the lesson.

### September 12-17

- Review the live result and every rehearsal failure.
- Cancel or renew Proclaim based on proven church use, not feature count or development confidence.
- Do not cancel unless the PowerPoint fallback, iPad lesson workflow, and chosen slide-control method all worked reliably.

## Remote Control Security Boundary

The prepared database migration now removes anonymous reads and writes and restricts shared sessions to the signed-in presenter account. It must be deployed and verified before the secure cross-device workflow is live. The September 11 plan uses that one trusted account on every device.

Before unrelated guest devices can receive limited controller access:

1. Move slide-control actions behind a server-side RPC or Edge Function.
2. Enforce presenter ownership and approved controller identity on the server.
3. Keep private sermon notes and speaker notes out of guest-accessible payloads.
4. Add controller action auditing and scheduled expired-session cleanup.

Until guest authorization is complete, do not share session access with people who are not signed in to Stephen's account. For September 11, the safe launch path is the same-account web workflow plus a verified PowerPoint or PDF fallback.

## Decision Gate

The presentation feature is ready to replace Proclaim for a simple lesson only after all of these are true:

- The actual lesson has passed two complete rehearsals, including one at church.
- PowerPoint and PDF exports render correctly.
- KJV Scripture text and references have been checked.
- The iPad lesson view is readable for at least 30 minutes without sleep or horizontal scrolling.
- Slide control has a tested manual fallback.
- No private notes appear in public output or shared payloads.
- Every image, hymn, quotation, audio, and video item has recorded rights.
