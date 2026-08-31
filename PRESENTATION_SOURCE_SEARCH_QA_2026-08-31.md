# Commentary source search — August 31, 2026

## Delivered

The exact-excerpt picker now searches within the full loaded commentary entry. Literal, case-insensitive phrase matches have a count, source character location, highlighted surrounding context, and Previous/Next navigation with wraparound. Enter advances; Shift+Enter moves back. A context button copies unchanged source text into the existing validated excerpt draft; it does not automatically create a slide or add the preview's ellipses.

The context window can begin or end mid-sentence. The interface states this and keeps the full source available for review. Search does not rewrite source wording, grant rights, or establish doctrinal correctness. KJV text and content files are unchanged.

## Verification

- `node scripts/test-commentary-excerpt.mjs`: 21 checks passed (10 existing excerpt checks plus 11 search checks). Covers literal punctuation/regex characters, case, Unicode source offsets, empty/no-match queries, repeated matches, exact context, and text boundaries.
- `npm run lint`: passed.
- `npm run build -- --webpack`: passed, including TypeScript.
- Production app, port 3031: opened Presentations directly, created a test deck, and searched Gaebelein's Hosea 1 source. “Hosea” returned 45 matches.
- Previous from match 1 reached match 45; Next returned to 1. Enter advanced to 2; Shift+Enter returned to 1.
- A new phrase reset navigation to match 1. A unique phrase found source characters 822–859 and disabled unnecessary navigation.
- Copying context retained an exact substring of the full source. A subsequent no-match search left the excerpt draft unchanged.
- Added slide body matched the chosen context; author/source/rights and excerpt-location notes remained attached.
- Save → reload → Open retained exact slide text and provenance. The test-only deck was archived afterward.
- Phone visual check at 390 × 844 and tablet layout check at 768 × 1024 showed no document horizontal overflow. These are browser viewport tests, not physical iPhone/iPad Safari tests.

## Remaining gates

No deployment, outreach, paid resource import, or remote-control configuration was performed. Physical iPad/projector rehearsal and authenticated shared-control verification remain launch gates.

Next highest-value presentation work: verify export fidelity and public-output privacy with a mixed KJV/commentary deck, ensuring private speaker notes stay off congregation-facing slides while visible author attribution remains.
