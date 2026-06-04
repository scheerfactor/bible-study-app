# Known Limitations

This app is in private beta. These limitations should be visible, expected, and safe.

## Storage And Sync

- Signed-out use is local to the device and browser.
- Supabase sync requires the production project, schema, RLS policies, and environment variables to be configured.
- Journal and Prayer are local-first in beta. Supabase table plans exist, but full account sync for every new workflow should be tested carefully before public launch.
- Testers should use exports before heavy testing.

## Audio

- Bible, commentary, and library listening use browser/device speech synthesis.
- This is not licensed Bible audio.
- This is not AI narration.
- Voice availability depends on the device and browser.
- Stop should always cancel active speech, but testers should report any case where refresh is required.

## Content

- KJV Bible text is central.
- Webster definitions and Strong's data are useful but still expanding.
- Commentary coverage is meaningful but not complete.
- Staged or needs-review commentary is not public reviewed content.
- Some library resources are metadata, planned, permission-needed, or review-only.
- David Cloud / Way of Life and modern copyrighted works must remain Permission Needed unless written permission exists.
- Doctrinal labels such as Use with discernment and Not all doctrine endorsed are intentional.

## Features Not Ready Yet

- Paid plans, marketplace, subscriptions, and purchases.
- AI sermon tools, AI narration, and generated voiceovers.
- Full Strong's scholar-level grammar tools.
- Sermon slide builder, Proclaim export, PowerPoint, Keynote, and production PDF exports.
- Public personal uploads.
- Church management, messaging, social features, and member directories.
- Full licensed audiobook or Bible audio hosting.

## Admin And Import Areas

- Admin Import Dashboard is a review workflow, not a public publishing tool.
- TXT and Markdown preview are the safest import paths.
- DOCX, EPUB, PDF, ZIP, audio, video, and cover upload paths are placeholders unless clearly labeled otherwise.
- No uploaded or imported content should become public automatically.

## Beta Expectations

- The app should feel useful for Bible reading, study, prayer, journaling, and library reading.
- It is not expected to replace every Logos-style feature yet.
- The goal of beta feedback is stability, clarity, mobile usability, and Bible-centered usefulness.
