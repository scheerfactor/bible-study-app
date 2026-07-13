# Church Presentation QA

Use this checklist before trusting remote presentation control in a live service.

## Service-Day Rule

For the first live use, treat the app as a preaching and slide-support tool, not the only copy of the service. Keep a PowerPoint export, PDF/printed notes, and a manual advance option ready.

## Required Setup

- Presenter computer opens Presentation Workspace.
- Display computer or projector browser opens Presentation View.
- Phone or tablet opens Controller View.
- Supabase environment variables are configured.
- `presentation_sessions` includes Phase 4 columns: `control_mode`, `controller_lock`, `controllers`, `display_last_seen_at`, and `expires_at`.
- The deck has been exported to PowerPoint and opened on the church presentation computer.
- The presenter has sermon notes exported or printed.
- The church Wi-Fi, projector resolution, and browser zoom have been checked before people arrive.

## Core Flow

1. Create or open a presentation with at least two slides.
2. Start Presentation View.
3. Confirm the session code is visible.
4. Confirm display status changes from "Not connected yet" to "Connected now."
5. Open Controller View on another device.
6. Join with the session code.
7. Confirm the controller appears in Connected controllers.

## Open Control Mode

1. Set controller approval to "Anyone with code."
2. Join from the controller.
3. Confirm the controller can advance slides.
4. Confirm Previous, Next, First Slide, Last Slide, Blank Screen, Show Slide, and Restart Timer work.

## Approval Mode

1. Set controller approval to "Require approval."
2. Join from the controller.
3. Confirm controller status shows "Waiting."
4. Confirm unapproved controller buttons are disabled.
5. Approve the controller from the presenter screen.
6. Confirm controller status changes to "Approved."
7. Confirm approved controller can advance slides.
8. Block the controller.
9. Confirm blocked controller cannot advance slides.

## Owner Controls

- Signed-in presenter should own the session.
- Signed-out sessions should be clearly treated as beta session-code control.
- Emergency End Session should be available to the presenter.
- Emergency End Session should not be available to a normal controller.
- Ending a session should show "Presentation ended" on display and controller.

## Session Safety

- Refresh the display and confirm it rejoins from `#presentation-session-ABC-123`.
- Refresh the controller and confirm it can rejoin by code.
- Expired sessions should not accept slide-control actions.
- Ended sessions should remain inactive.
- Local fallback should still work if Supabase sync fails.

## Mobile Checks

- Controller buttons should be large enough for phone use.
- Approval status should be visible without hunting.
- Blank Screen and Emergency End should not be easy to hit accidentally.
- No horizontal scrolling at 390x844.

## iPad And Pulpit Checks

- Open the sermon and presentation on the iPad you plan to use.
- Confirm landscape and portrait both remain readable.
- Confirm tap targets are large enough from the pulpit.
- Confirm the screen does not dim or lock during a 30-minute test.
- Confirm the sermon manuscript can be read without horizontal scrolling.
- Confirm slides can be advanced from the iPad if the phone controller is unavailable.
- Keep a charger nearby if the service, Sunday School, or setup time will run long.

## Proclaim Replacement Checklist

The app is ready to replace Proclaim for a simple service only when all are true:

- PowerPoint export opens correctly.
- Present mode works on the projector computer.
- Controller mode works from a phone or iPad on the church network.
- Blank/unblank works.
- Emergency End Session works.
- The deck can be advanced manually if sync fails.
- The pastor/teacher has printed or PDF notes.
- No copyrighted background, image, song lyric, audio, or video is used without permission.

## Known Beta Limitations

- Approval is enforced by app workflow and session metadata.
- Production-grade enforcement should move controller actions to RPC or Edge Functions.
- Session cleanup is expiry-based in the app; a scheduled cleanup job is still recommended.
- Remote control should be tested on the church network before service.
- For a first Sunday use, prefer exported PowerPoint plus app notes over app-only presentation.
