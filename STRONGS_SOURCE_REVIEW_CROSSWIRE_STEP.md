# Strong's Source Review: CrossWire and STEP

Reviewed: 2026-06-21

Update on 2026-06-22: a limited reviewed CrossWire mapping batch was promoted
for the first public KJV+ style expansion. The batch file is:

```text
data/strongs/mapping-batches/kjv-strongs-crosswire-focus.sample-reviewed.json
```

Promotion scope:

- John 3
- Romans 8
- Mark 1
- Ephesians 1

Only rows with clean KJV token alignment and an already verified local Strong's
lexicon entry were promoted. The generated public index now contains 795
reviewed mapping rows across 125 verses. CrossWire-derived staging files remain
ignored and uncommitted.

Hosea and Leviticus were staged but not promoted because their Hebrew Strong's
numbers do not yet have enough verified local lexicon entries for public display.
Finish Hebrew lexicon review before promoting those rows.

## Purpose

The Bible Study App needs a fast KJV word-to-Strong's mapping so users can see
Strong's numbers beside KJV words, similar to e-Sword's KJV+ experience. This
review documents the safest next sources for building that mapping without
importing unclear data into the public app.

## Recommendation

Use CrossWire KJV as the first technical parser target because it contains the
actual KJV text with embedded Strong's numbers. Keep all CrossWire-derived
mapping output in staging until the project deliberately accepts and documents
the module's redistribution obligations.

Use STEP Bible as an approved staging and lexicon candidate, especially for
definitions and source comparison. Do not treat STEP's ESV translator tags as a
KJV word-to-Strong's mapping.

Do not import e-Sword modules. Use e-Sword only as a user-experience reference.

## Source Candidate: CrossWire KJV

- Source: https://crosswire.org/sword/modules/ModInfo.jsp?modName=KJV
- Project page: https://wiki.crosswire.org/CrossWire_KJV
- Historical OSIS download page: https://www.crosswire.org/~dmsmith/kjv2006/
- Data type: KJV 1769 OSIS XML with embedded Strong's numbers and morphology.
- Best technical use: KJV token-to-Strong mapping.

### Evidence

- CrossWire describes the module as "King James Version (1769) with Strongs
  Numbers and Morphology and CatchWords."
- The module page says the OT Strong's data came from Bible Foundation and the
  NT Strong's data came from the KJV2003 Project at CrossWire.
- CrossWire states that the KJV2003 Project text is offered freely for any
  purpose and grants a general public license to use the text for any purpose.
- The module also carries a GPL distribution license and notes that the base KJV
  text rights are held by the Crown of England.
- The CrossWire wiki explains that the KJV module is an amalgamation of source
  material, with each part carrying its own copyright/public-domain status.

### Review Status

Approved for local parser prototype and hidden staging.

Not approved for public full import until:

- GPL/module obligations are accepted and documented.
- Attribution requirements are added to the app or documentation.
- KJV Crown-rights handling outside the United States is documented.
- A generated sample is reviewed for token alignment quality.

## Source Candidate: STEP Bible Data

- Source: https://github.com/STEPBible/STEPBible-Data
- License stated by repository: CC BY 4.0.
- Data type: lexicons, tagged original-language data, tagged ESV data, proper
  nouns, morphology, versification, and related study datasets.
- Best technical use: Strong's definitions, original-language helps, and
  secondary comparison.

### Evidence

- The repository states that its public license allows including parts of the
  data in software or publications without requesting permission.
- The repository asks users to credit "STEP Bible" with a link to
  www.STEPBible.org.
- The available tagged translation dataset listed in the repository is TTESV,
  which tags ESV translated text, not KJV.
- STEP also lists original-language datasets that are compatible with Strong's
  style lookup, but these are not a direct KJV word-to-Strong mapping.

### Review Status

Approved for staging and source comparison.

Not approved as the primary KJV mapping source until an exact KJV-tagged file is
identified and reviewed.

## Source Candidate: e-Sword

- Source: https://www.e-sword.net/
- Best use: User-experience reference only.

Do not import e-Sword module files or bundled datasets without written
permission and redistribution terms.

## Technical Import Plan

1. Keep raw CrossWire or STEP source files out of the public app bundle.
2. Store reviewed raw sources in local review storage, Supabase Storage, or R2.
3. Run the CrossWire OSIS staging importer against a local source file.
4. Output generated rows into `data/strongs/mapping-staging/`.
5. Review a small batch manually.
6. Promote only approved rows into `data/strongs/mapping-batches/`.
7. Rebuild the public lookup index with `npm run build:strongs-mapping-index`.
8. Validate with `npm run validate:strongs-mapping`.

## First Target

Start with John 3 because the Bible Reader already supports the optional
"Show Strong's numbers" display and the existing John 3:16 manual sample proves
the UI path.

The next reviewed batch should be:

- John 3
- Romans 5:8
- Genesis 1:1
- Psalm 23:1

## Public Import Decision

Current decision: do not promote CrossWire-derived mappings to public app data
yet.

Reason: CrossWire is technically excellent, but the app should document the
GPL/general-public-license obligations and source acknowledgements before the
data becomes a shipped public dataset.
