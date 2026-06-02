# Content Library Policy

The library must be curated, rights-safe, and useful for Bible study, prayer, evangelism, Christian living, Baptist history, preaching/teaching, missions, and classics. The goal is not to import every old book. The goal is to provide trustworthy, well-labeled resources that help faith and practice without burying the user.

## Core Rules

1. Do not import copyrighted or unclear works.
2. Do not scrape websites for full-text content.
3. Every imported resource must have documented metadata.
4. Every imported resource must have rights notes before it appears in the app.
5. Do not imply doctrinal endorsement merely because a resource is included.
6. Prefer fewer, better-reviewed books over a large unmanaged library.

## Required Metadata

Each resource must include:

- title
- author
- year
- category
- source_url
- file_path
- public_domain_status
- commercial_use_status
- attribution_required
- doctrinal_review_status
- doctrinal_notes
- rights_notes
- import_status

## Resource Status

- `verified`: Rights reviewed, metadata complete, doctrinal notes complete enough for beta use.
- `needs review`: Candidate resource, not yet approved for import.
- `do not import yet`: Rights unclear, doctrinal concerns unresolved, poor source quality, or not useful for current roadmap.

## Categories

- Bible study helps
- Baptist history
- Evangelism
- Prayer
- Christian life
- Preaching/teaching
- Missions
- Fiction/classics

## Rights Review Checklist

Before import:

1. Confirm the author's death date when public-domain status depends on life plus term.
2. Confirm publication year and edition.
3. Confirm the source file is downloadable from a reputable source.
4. Confirm the source permits the intended use.
5. Record attribution requirements.
6. Record commercial-use notes.
7. Save the source URL and access date.
8. Keep the raw source file in the proper review folder.

## Source Preference

Preferred:

- Project Gutenberg
- Internet Archive with clear source scans
- HathiTrust public-domain records where accessible
- Library of Congress records
- Publisher or ministry pages that explicitly state public-domain or permission terms
- Manually verified scans of public-domain works

Avoid:

- Unsourced blog text
- OCR copied from unclear websites
- Modern edited editions with unclear copyright
- Unverified PDFs from file-sharing sites
- Any source that forbids redistribution or commercial use

## Import Process

1. Place candidate files in `data/library/needs-review`.
2. Create or update a manifest in `data/library/manifests`.
3. Complete rights notes.
4. Complete doctrinal notes.
5. Move approved files to `data/library/verified`.
6. Import only verified resources.
7. Keep `data/library/do-not-import` for rejected or paused candidates.

## Warnings and Labels

The Library UI should eventually show:

- Public-domain status
- Rights notes summary
- Category
- Doctrinal review status
- "Use with discernment" warning when needed
- "Baptist perspective" label only when accurate

## Do Not Import During Beta

- Full 10,000-book libraries
- Modern copyrighted books
- Paid marketplace resources
- Unreviewed commentaries
- Books with unclear doctrinal or rights concerns

