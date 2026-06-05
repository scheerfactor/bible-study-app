# Beta Tester Start Here

Thank you for helping test Father's Business Bible Study.

The goal of this beta is stability, clarity, and usefulness for real Bible reading, study, prayer, journaling, library reading, and sermon or lesson preparation.

Production app:

https://bible-study-app-eight.vercel.app/

## What Works Now

- KJV Bible reader with quick navigation.
- John 3 and other passages can open the Passage Guide.
- Study Drawer supports notes, highlights, bookmarks, dictionary lookup, cross references, commentary, memory, and connected actions.
- Today dashboard shows reading, prayer, journal, memory, library, playlist, sermon, and smart resume cards.
- Prayer requests save locally and can be exported.
- Scripture Journal entries save locally and can be exported.
- Library has verified public-domain resources with reader, listening, progress, bookmarks, notes, and exports.
- Sermon Workspace can load a John 3 sample sermon, export notes, build slides, preview slides, and export a PowerPoint MVP.
- Settings exports beta study data as JSON.
- Feedback page is available from the beta notice, Settings, Library, and Teaching areas.

## What Saves Where

- Signed out: data saves locally in this browser on this device.
- Signed in: Bible notes, highlights, and bookmarks can sync with Supabase when production Supabase is configured.
- Prayer, Journal, Library progress, playlists, memory, and sermon work are local-first in this beta unless later sync is explicitly added.
- Use exports before doing heavy testing.

## Main Tester Path

1. Open Today.
2. Confirm Smart Resume and Ministry Dashboard appear.
3. Open Bible and jump to `John 3:16`.
4. Tap a verse and open the Study Drawer.
5. Add a note, highlight, bookmark, and add the verse to Sermon.
6. Open Passage Guide for John 3.
7. Open Library, search for a book, open the reader, and try Listen and Stop.
8. Create a prayer request and export the prayer list.
9. Create a Scripture Journal entry and export it.
10. Open Sermons, load the John 3 sample sermon, open Slides, and copy or download the slide outline.
11. Open Settings and export JSON.
12. Submit feedback.

## Devices To Try

- iPhone-sized browser around 390x844.
- Desktop browser around 1280px wide or larger.
- Safari and Chrome if available.

## What To Report

- Broken buttons.
- Confusing labels.
- Anything that looks unfinished without a clear beta label.
- Mobile overflow or text cut off.
- Slow screens.
- Export buttons that do not download or copy.
- Any case where data disappears after refresh.
