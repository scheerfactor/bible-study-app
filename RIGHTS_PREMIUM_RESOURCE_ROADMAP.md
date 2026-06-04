# Rights + Premium Resource Roadmap

Father's Business Bible Study should grow public-domain content now and prepare for licensed/premium content later without mixing unclear rights into the public Library.

## Current Rule

No copyrighted modern work is publicly imported unless written permission, a license, or clear reuse terms are documented.

## Permission Tracker

Structured permission tracking lives in `data/library/manifests/permission-tracker.json`.

Each request tracks:

- author
- publisher/ministry
- contact info
- resource title
- requested rights
- status
- notes

Allowed statuses:

- Not contacted
- Contacted
- Permission granted
- Denied
- Needs follow-up

## Premium Resource Placeholders

Admin-only premium planning lives in `data/library/manifests/premium-resource-placeholders.json`.

Current planning placeholders:

- John Phillips
- J. Vernon McGee
- Mark Cahill
- David Cloud / Way of Life
- S. M. Davis
- modern commentaries/books

These are planning records only. They are not public Library resources and no copyrighted text, transcript, audio, or video is shipped.

## Public-Domain Growth First

The app should keep expanding verified public-domain resources before introducing licensed content:

1. 300 resources: finish priority public-domain dictionaries, missions, Baptist history, prayer, preaching, and commentary volumes.
2. 500 resources: add more verified commentary sets, Bible handbooks/surveys, biographies, and author collections.
3. 1,000 resources: move large text storage to Supabase Storage or R2, keep metadata searchable, and add stronger review tooling.

## Premium Path Later

Premium/licensed content should wait until:

- public-domain Library is stable and fast
- storage strategy is implemented for large files
- permission workflow is documented
- licensing terms are recorded per resource
- user access rules are designed
- payments/subscriptions are explicitly approved for a later phase

## Safety Rules

- Permission-needed records stay hidden/admin-only unless they are clearly marked as planned resources.
- Personal uploads remain private to the signed-in user.
- Do not publish user-purchased books globally.
- Do not import modern sermon audio/video/transcripts without permission.
- Keep Scripture primary and commentary/resources secondary.
