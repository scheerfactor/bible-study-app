# Father's Business Bible Study Private Beta Checklist

Use this checklist before inviting the first private beta testers.

## Local Setup

- Install dependencies with `npm install`.
- Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Start the app with `npm run dev`.
- Open the local URL on desktop and phone.
- Confirm the app loads without console errors.

## Supabase Setup

- Run `supabase/schema.sql` in the Supabase SQL Editor.
- Confirm these tables exist: `dictionary_entries`, `cross_references`, `commentary_entries`, `user_notes`, `user_highlights`, `user_bookmarks`, and `resource_sources`.
- Confirm RLS is enabled on all public tables.
- Confirm public read policies exist for Bible/reference data.
- Confirm notes, highlights, and bookmarks are user-owned.
- Never expose or commit a service-role key.

## Test Account Setup

- Create at least one test email account.
- Sign in with the Settings magic-link flow.
- Confirm the header says `Signed in — syncing to Supabase`.
- Sign out and confirm the header says `Signed out — saving locally`.
- Keep one signed-in test and one signed-out local test for comparison.

## Required Test Flows

- Open John 3 from the Today screen.
- Jump to John 3:16.
- Tap John 3:16 and confirm the Study Drawer opens on Study.
- Use drawer height controls: Low, Half, Full.
- Tap a key word such as `begotten` and confirm Webster's 1828 appears.
- Open Full Study and use the table of contents.
- Tap Back to Bible and confirm John 3:16 stays in view.
- Highlight John 3:16.
- Bookmark John 3:16.
- Add and update a note for John 3:16.
- Refresh the page and confirm saved data remains.
- Search a word or phrase and open a result.
- Use Settings to export notes, highlights, and bookmarks as JSON.

## Import Readiness Tests

- Run the Webster sample import before any full dictionary import.
- Run the TSK sample import before any full cross-reference import.
- Add only verified public-domain commentary samples.
- Confirm every imported source has a `resource_sources` rights record.
- Keep import files out of the public app unless they are intentionally included.

## Known Limitations

- Audio is a placeholder only.
- Commentary content is placeholder/sample only.
- Webster's 1828 is not fully imported yet.
- TSK cross references are not fully imported yet.
- Search is local/browser-side for the current prototype.
- Account sync depends on the Supabase project and RLS setup.
- Local storage data stays on one device/browser unless exported.

## Do Not Test Yet

- Strong's numbers.
- AI audio or generated voiceovers.
- Full library import.
- Paid plans or marketplace.
- Sermon builder.
- Slide builder.
- Social features.
