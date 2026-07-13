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
- Matthew Henry and JFB coverage expanded for private beta, but not every commentary author is complete.
- TSK cross references are expanding and should remain quality-reviewed before being treated as complete.
- Bible geography and chronology are strongest for selected beta chapters and are still expanding chapter by chapter.
- Staged or needs-review commentary is not public reviewed content.
- Some library resources are metadata, planned, permission-needed, or review-only.
- David Cloud / Way of Life shareable categories must follow their published sharing policy with source links and citation; Store/paid items remain Permission Needed unless written permission exists.
- Modern copyrighted works must remain Permission Needed unless written permission exists.
- Doctrinal labels such as Use with discernment and Not all doctrine endorsed are intentional.

## Features Still Limited

- Paid plans, marketplace, subscriptions, and purchases are not live public features yet.
- Membership must not charge for copied public-domain or free-use-only resource material itself; future paid value should be app tools, sync, storage, workflows, original premium content, or explicitly licensed resources.
- AI sermon tools, AI narration, and generated voiceovers.
- Full Strong's scholar-level grammar tools.
- Sermon slide builder is a beta MVP. It supports slide creation, preview, presenter mode, and PowerPoint export, but should still be tested carefully before Sunday use.
- Print/save-as-PDF fallback is available, but full PDF export, Keynote export, Proclaim-specific export, and full presentation replacement workflows are not complete.
- Remote control should be tested on the actual church network before service.
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
- Sermon and lesson preparation should be usable for a John 3 beta test, but exported slides, presentation remote control, and notes still need review before live preaching.
- Daniel 7, Revelation 13, Amos 1, Romans 8, and John 3 are the best current depth-test chapters.
- It is not expected to replace every Logos-style feature yet.
- The goal of beta feedback is stability, clarity, mobile usability, and Bible-centered usefulness.
