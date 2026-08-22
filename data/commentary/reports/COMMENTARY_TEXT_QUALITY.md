# Commentary Text Quality Audit

This report flags imported commentary rows that likely contain website navigation, previous/next links, table-of-contents footers, or other non-commentary wrapper text. It does not prove the commentary text itself is invalid; it identifies rows that need cleanup or source review before quotation.

## Summary

- Commentary files scanned: 349
- Commentary rows scanned: 15235
- Rows with quality flags: 0
- Files with quality flags: 0

## Files With Flags

No quality flags found.

## Sample Rows

No samples.

## Current Mitigation

The app normalizes commentary entries at load time and strips known navigation prefixes/footers from display, listening, export, and search contexts. Public import files are also cleaned when wrappers can be removed without changing commentary wording; staging files remain available for source review.
