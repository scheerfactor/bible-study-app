# Presentation Export Notes

## PowerPoint Export

The app exports sermon and presentation slide decks as `.pptx` files using a clean 16:9 widescreen layout.

Current export includes:

- slide title
- subtitle
- body text
- Bible text
- speaker notes
- selected theme colors
- selected local background category/motif
- footer branding when enabled

If PowerPoint export fails, the app downloads a Markdown slide outline fallback.

## PDF Export

The current beta uses a print-ready HTML preview for PDF.

Workflow:

1. Click `Print / Save PDF`.
2. The app opens a 16:9 print-ready slide view.
3. Use the browser print dialog.
4. Choose `Save as PDF`.

## Future One-Click PDF Requirements

For direct `.pdf` download later, the app needs one of these:

- a browser-safe PDF renderer for the existing slide HTML
- a server-side PDF generation route
- a Vercel-compatible rendering service
- QA for fonts, page breaks, notes, and 16:9 sizing

No external image search is used for slide backgrounds. Current media backgrounds are local, lightweight, and optimized for fast presentation start.
