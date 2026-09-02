# Presentation chapter lookup — August 30, 2026

## Scope

The earlier deferred-loader correction already includes Presentations. The next gap was that the Reviewed Content Finder searched only commentary loaded elsewhere in the session. It now offers a book/chapter lookup through the existing indexed commentary APIs without loading the complete collection into the browser.

No new third-party resources, rights grants, KJV changes, database changes, deployment, or outreach are included.

## Verification

Tested against the isolated production webpack build on port 3031, opening Presentations directly without visiting Bible or Commentary first.

| Check | Result |
| --- | --- |
| Starter notes load directly in Presentations | 164 notes available |
| Select Romans 8 and load | 12 entries; scope explicitly says Romans 8 only |
| Search for a nonexistent phrase | Chapter-specific empty state; no stale results |
| Search Adam Clarke and add a commentary slide | One Quote slide with Romans 8 title, author, excerpt, source URL, rights basis, and KJV comparison reminder |
| Switch to Song of Solomon 2 | 11 entries; existing book-name alias works |
| Stop local server and request Genesis 1 | Connection error with retry instructions; no misleading zero-results message |
| Restart server and retry Genesis 1 | 11 entries loaded successfully |
| Back to loaded notes | Returns to the original 164-entry session scope and clears the query |
| Phone viewport, 390 × 844 | Chapter workflow usable; document width equals viewport width |
| Tablet viewport, 768 × 1024 | No document overflow; chapter form adjusted after visual review to put Load on its own row |
| Save and reopen after a page reload | Test deck retains its chapter excerpt and source notes; test-only deck archived afterward |

Lint and `npm run build -- --webpack` pass. The browser checks above use the real UI and DOM assertions, not mocked API responses. They are not physical iPhone/iPad or Safari tests.

## Repeating the user journey

1. Open Presentations → New Presentation → Slide Deck → Commentary.
2. Select a book/chapter and choose Load chapter notes.
3. Search the returned notes by author or words, then choose Add commentary slide.
4. Review the slide text and its Speaker notes before teaching or exporting.
5. To return to session-wide loaded notes, choose Back to loaded notes.

## Remaining gates and next improvement

- This local environment reports that shared remote control is not configured. Real authenticated cross-device control and a physical church/iPad rehearsal remain unverified here.
- Keep the existing PowerPoint/PDF fallback and the readiness gates in `SEPTEMBER_11_PRESENTATION_READINESS.md`; this change does not establish public-launch readiness.
- Commentary remains secondary material. Rights documentation is not doctrinal endorsement; inspect each source's perspective and compare with Scripture.
- Next useful content improvement: allow selecting a relevant passage within a long chapter note before adding it to a slide. Currently the existing excerpt action uses the beginning of the note.
- Further tablet polish is needed for the existing five-mode finder toolbar, whose labels are tight alongside the desktop sidebar.
