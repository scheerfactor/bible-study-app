# Library Duplicate Audit

Last reviewed: 2026-06-05

## Result

The public Library manifest currently has no duplicate public resources by:

- title + author
- source URL
- text checksum

The app also deduplicates loaded resources by normalized title + author before rendering Library shelves. This keeps a future audiobook/media import from creating a second public card for the same work.

## Display Policy

- One public resource card should represent one work.
- Read, Listen, and Add to Playlist actions should live inside the same card/detail flow when the audio is browser text-to-speech for the same text.
- A separate audiobook card should only be used for a distinct licensed audio edition with its own rights metadata.
- Permission-needed, personal-use-only, and needs-review resources must stay out of the public Library.

## Current Import Status

The existing bulk import source list has already been consumed. A dry run against `data/library/bulk-import-sources.csv` skipped all rows as duplicate title/author matches, which means the importer is protecting the Library from re-adding existing works.

## Next Safe Content Step

Add fresh source rows only after confirming:

- exact title
- author
- source URL
- public-domain basis
- commercial-use notes
- doctrinal review status
- no duplicate title/author/source/checksum match
