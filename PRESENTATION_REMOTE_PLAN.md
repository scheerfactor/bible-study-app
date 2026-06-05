# Presentation Remote Plan

## Current Phase

Presentation Remote Phase 3 adds real shared-session structure with Supabase Realtime support and a local fallback.

Works now:

- Presentation Session ID
- Join Presentation
- Controller View
- Presentation View
- Presenter tools with current slide, next slide, notes, elapsed time, remaining time, slide count, and progress
- Controller actions for next slide, previous slide, jump to slide, blank screen, and end presentation
- Display reconnect from URLs like `#presentation-session-ABC-123`

The app tries Supabase first when it is configured and the `presentation_sessions` tables exist. If Supabase is unavailable, it falls back to local browser storage so presentations can still be tested.

## Important Limitation

The current Supabase policies are beta-friendly and session-code based. Anyone with the session code can control that presentation. For public release, add host approval, controller permissions, and optional signed-in presenter ownership.

## Current Shared Architecture

1. `presentation_sessions` stores the active slide deck, current slide index, blank-screen state, active/ended state, and short session code.
2. `presentation_session_events` logs controller actions such as start, join, next, previous, blank, unblank, jump, refresh, and end.
3. Display and controller views subscribe to `presentation_sessions` updates through Supabase Realtime.
4. Local storage mirrors the same session state as a fallback.

## Future Production Hardening

Recommended next step:

1. Add host controls so only the presenter/admin can start, end, or grant controller access.
2. Add controller approval and revocation.
3. Add connection status: connected, reconnecting, offline, and controller locked.
4. Add fail-safe local keyboard controls in Presentation View.
5. Add audit cleanup for stale sessions.

## Session Data Model

Fields:

- session_id
- presentation_id
- title
- current_slide_index
- is_blank
- is_active
- presenter_user_id
- created_at
- updated_at

Current beta table also stores:

- title
- theme_id
- slides
- target_minutes
- notes

## Controller Actions

Supported now:

- next slide
- previous slide
- jump to slide
- blank screen
- end presentation

Future:

- confidence monitor mode
- countdown timer sync
- slide notes toggle
- lower-third Scripture display
- announcement loop
- worship/service order integration

## Safety Rules

- Do not require page refresh during a service.
- Presentation View must keep working if the controller disconnects.
- Keyboard navigation must always remain available.
- Remote control should be hidden from public users until permissions and realtime sync are ready.
- Never expose private sermon notes publicly unless the presenter chooses to show them.

## QA Flow

1. Open Presentation Workspace.
2. Create or open a presentation.
3. Add at least two slides.
4. Start Presentation View.
5. Open Controller View in another tab.
6. Join the same Session ID.
7. Test Next, Previous, Jump, Blank, Show Slide, and End.
8. Confirm Presentation View updates without refresh.
9. Refresh the Presentation View and confirm it rejoins the same session from the URL.
10. Confirm Presenter View still shows current slide, next slide, notes, elapsed time, remaining time, and progress.
