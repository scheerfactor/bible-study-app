# Presentation Remote Plan

## Current Phase

Presentation Workspace Phase 2 adds a local remote-control foundation for testing the church presentation workflow.

Works now:

- Presentation Session ID
- Join Presentation
- Controller View
- Presentation View
- Presenter tools with current slide, next slide, notes, elapsed time, remaining time, slide count, and progress
- Controller actions for next slide, previous slide, jump to slide, blank screen, and end presentation

This first version uses browser local storage events. It is useful for testing multiple tabs on the same device/browser and proving the workflow without adding server risk.

## Important Limitation

The current remote control is local-only. A phone and a computer on separate devices will need a shared realtime backend before this can be used in a live church service.

## Future Production Architecture

Recommended next step:

1. Create presentation sessions in Supabase.
2. Store the active slide index, blank-screen state, ended state, current deck ID, and controller permissions.
3. Use Supabase Realtime channels for controller-to-presentation updates.
4. Add a short join code for the phone or tablet controller.
5. Add host controls so only the presenter/admin can start, end, or grant controller access.
6. Add connection status: connected, reconnecting, offline, and controller locked.
7. Add fail-safe local keyboard controls in Presentation View.

## Session Data Model

Fields:

- session_id
- presentation_id
- title
- active_slide_index
- blank
- ended
- started_at
- updated_at
- controller_user_id
- host_user_id
- notes_visible_to_controller

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
9. Confirm Presenter View still shows current slide, next slide, notes, elapsed time, remaining time, and progress.
