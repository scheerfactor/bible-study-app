# Commentary Expansion Sprint Report

Date: 2026-06-08

## Current Status

- Public in-app commentary coverage remains 4,016 entries.
- `npm run validate:commentary` currently validates 6,394 rows across public import files and staging/review files.
- The staged/review rows are not counted as public coverage until they are intentionally promoted into the app.
- Existing public coverage remains built from reviewed commentary data already present in the repository.

## Source Review Decision

No new Pulpit Commentary, Biblical Illustrator, or Matthew Poole text was imported in this sprint.

Reason:

- No clean local source file, parser, source URL manifest, edition notes, and rights metadata were available in the repository for those sets.
- The app should not import large commentary text unless the source, edition, rights status, and parser quality are documented.

## Next Safe Actions

1. Add source manifests for each candidate commentary set.
2. Record edition, publication year, source URL, and rights basis.
3. Stage parsed entries as review-only.
4. Promote only reviewed entries to public Library and Passage Guide display.

## Priority Candidates

- Pulpit Commentary
- Biblical Illustrator
- Matthew Poole
- H. A. Ironside
- William Kelly
- F. W. Grant
- Arno C. Gaebelein

## Rule

Scripture remains primary. Commentary is imported only when source and rights are clean enough for public beta use.
