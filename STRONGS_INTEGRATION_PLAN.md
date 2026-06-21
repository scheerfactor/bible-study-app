# Strong's Integration Plan

Father's Business Bible Study should make original-language helps plain, fast, and useful without making the app feel scholar-only. Strong's data belongs behind the Bible text, not in front of it.

## Goals

- Let a reader tap a KJV word and see a simple Hebrew or Greek study card.
- Show the Strong's number, headword, transliteration, brief definition, and where the word appears.
- Keep the KJV text central and readable.
- Avoid intimidating tables, unexplained abbreviations, and language-tool clutter.
- Keep every data source, rights note, and transformation documented before import.

## Data Source Options

### Public-Domain / Open Options To Review

- STEPBible Data Repository: currently the strongest staging candidate because
  its repository states CC BY 4.0 terms and permits inclusion in software with
  credit. Exact files, attribution wording, and transformation notes still need
  review before public import.
- CrossWire KJV with Strong's Numbers and Morphology: useful provenance source
  for KJV-to-Strong mapping, but redistribution and base-text/module terms must
  be reviewed before public import.
- Strong's Exhaustive Concordance original public-domain data: likely public domain by age, but exact digital source and edition must be documented.
- Open Scriptures Hebrew Bible / Greek New Testament alignment projects: useful structure, but license compatibility must be reviewed before commercial use.
- STEP Bible / Tyndale data: strong quality, but license terms must be reviewed carefully before app import.
- Berean / OSIS / CrossWire module sources: possible mapping paths, but each module has its own license and redistribution terms.
- Internet Archive scans of older Strong's works: useful for verification, not ideal as primary structured data.

### Do Not Use Without Review

- Modern copyrighted lexicons.
- Website-scraped Strong's data.
- Enhanced Strong's datasets whose license restricts redistribution or commercial use.
- Modern morphology databases unless permission and terms are clear.

## Rights Requirements

Every Strong's-related source must have:

- title
- editor/compiler
- publication year
- source URL
- source file path
- public-domain or license status
- commercial-use status
- attribution requirements
- transformation notes
- import status
- review status

Use the same safety pattern as Library and commentary imports:

- `Needs Review` first.
- `Verified` only after source, rights, and reference validation.
- No public display of unclear data.
- No scraping websites.

## Proposed Data Structure

### strong_lexicon_entries

- id
- language: Hebrew / Aramaic / Greek
- strongs_number
- headword
- transliteration
- pronunciation
- short_definition
- extended_definition
- source_id
- public_domain_status
- rights_basis
- review_status

### kjv_strongs_mappings

- id
- verse_ref
- book
- chapter
- verse
- kjv_word
- normalized_kjv_word
- word_position
- strongs_number
- source_id
- confidence_status: verified / needs review
- notes

### strongs_occurrences

- strongs_number
- verse_ref
- kjv_word
- normalized_kjv_word
- book
- chapter
- verse

## KJV Word-To-Strong Mapping

The first useful experience should be:

1. User taps a KJV word.
2. App normalizes the word.
3. App checks the verse-specific KJV-to-Strong mapping.
4. App shows matching Strong's entries.
5. If a word has multiple possible Strong's numbers in the verse, show a simple choice.

Example display:

- Word: `believeth`
- Root display: `believe`
- Greek: `pisteuo`
- Strong's: `G4100`
- Plain meaning: to believe, trust, commit unto
- Occurrences: John, New Testament, whole Bible
- Related KJV words: believe, believed, believeth, believing

## Fast Upload Path

The fastest safe path is not manual entry. It is a repeatable staging pipeline:

1. Select one rights-cleared KJV-to-Strong mapping source.
2. Store the raw file outside the public app bundle first.
3. Convert it into reviewed batch files under `data/strongs/mapping-batches/`.
4. Validate every row with:

```bash
npm run validate:strongs-mapping
```

5. Rebuild the fast public lookup index with:

```bash
npm run build:strongs-mapping-index
```

6. Promote only reviewed batches into public lookup data.
7. Keep full datasets in Supabase/R2 or a server-side index when the files get
   too large for Vercel.

The mapping format is one row per KJV word/token:

- `verse_ref`
- `token_index`
- `kjv_word`
- `normalized_kjv_word`
- `strongs_number`
- `source_id`
- `source_title`
- `source_url`
- `rights_status`
- `rights_basis`
- `review_status`

This gives us the same kind of experience users recognize from e-Sword's KJV+
view, but with our own documented, rights-safe data pipeline.

The generated production file is
`data/strongs/kjv-strongs-mappings.reviewed.json`. It should be rebuilt from
the reviewed batch files, not hand edited.

## e-Sword-Style Display

e-Sword is a useful model for the user experience: a reader can see the KJV word
and the Strong's number close together. The Bible Study App should support that
as an optional reader mode:

- normal reading mode: no Strong's numbers visible
- study mode: small Strong's number beside or under mapped words
- tap/click mode: show the Strong's card only when a word is selected
- teaching mode: allow sending the word study to sermon notes

Do not import e-Sword module files unless written permission and redistribution
terms are documented. Treat e-Sword as a workflow reference, not as a content
source.

## Plain-English Display Rules

- Lead with the KJV word the user tapped.
- Show one short definition first.
- Hide advanced fields under "More details."
- Explain transliteration as "how the word is written in English letters."
- Explain Strong's number as a reference number, not as a magic meaning.
- Link to occurrences and verse examples.
- Do not imply every English word has a single exact original-language equivalent.

## Warning Against Scholar-Only Complexity

Strong's should help a normal Bible reader, Sunday school teacher, and preacher understand Scripture more carefully. It should not make the app feel like a seminary database. Avoid:

- large morphology tables on the first view
- unexplained grammar codes
- original-language claims without context
- making Strong's replace reading the verse in context
- making the app slower or visually crowded

## Import Phases

### Phase 1: Planning And Rights Review

- Identify candidate sources.
- Document licenses and commercial-use terms.
- Pick one Hebrew/Greek lexicon source and one KJV mapping source.
- Create staging files only.

### Phase 2: Small Verified Sample

- Import a small reviewed sample:
  - John 3:16
  - Romans 5:8
  - Genesis 1:1
  - Psalm 23:1
- Validate verse references, word positions, and Strong's numbers.
- Show in the Study Drawer behind a collapsed "Original Words" section.

### Phase 3: Core New Testament

- Import reviewed New Testament mapping.
- Add occurrence counts and search by Strong's number.
- Keep display mobile-first and concise.

### Phase 4: Whole Bible

- Import reviewed Old Testament mapping.
- Add Hebrew/Aramaic support.
- Add performance indexes for fast lookup.

## Performance Plan

- Keep lookup indexes optimized server-side or in small static chunks.
- Do not load the whole Strong's dataset into the browser at startup.
- Cache verse-level Strong's lookups.
- Cache lexicon entries by Strong's number.
- Add database indexes on `strongs_number`, `verse_ref`, `book`, `chapter`, and `normalized_kjv_word`.

## Completion Standard For First Release

- Rights-safe data source chosen.
- Small sample imported into staging.
- John 3:16 word lookup works.
- Plain-English display is understandable on a phone.
- No unclear or copyrighted source is public.
- KJV text remains the center of the screen.

## Current Source Gate

Use `data/study-tools/source-candidates.json` as the source gate for Strong's
and TSK completion work. Validate it with:

```bash
npm run validate:study-sources
```

No full Strong's source may be promoted into public lookup until its manifest
candidate has:

- `review_status`: `Approved For Public Import`
- `public_import_allowed`: `true`
- documented source URL
- documented license/commercial-use status
- attribution notes if required
- transformation notes for any parser or cleanup work

The current `data/strongs/sample-verified-strongs.json` file remains a reviewed
starter set, not a complete Strong's import.
