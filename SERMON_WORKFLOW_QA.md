# Sermon Workflow QA

Use this before beta testing sermon and lesson preparation.

## Scope

This QA pass checks whether one teacher can prepare, export, preach from, and present one lesson without leaving the app.

Primary test passage: John 3:1-18

Secondary optional passage: Amos 1

## Real-Use Flow

1. Open Sermons.
2. Click Load John 3 Sample.
3. Confirm the sample has:
   - title
   - passage
   - outline
   - introduction
   - main points
   - illustration
   - quote
   - application
   - conclusion
   - invitation
   - slides
4. Save the sermon locally.
5. Export sermon markdown.
6. Export preaching notes.
7. Copy sermon outline.
8. Open Slide Builder.
9. Copy slide outline.
10. Download slide outline markdown.
11. Enter Preaching Mode.
12. Enter Present Mode.

## Export Checks

- Download Sermon Markdown creates a markdown file.
- Download Text creates a plain text file.
- Download Preaching Notes creates focused preaching notes.
- Print-Friendly Notes opens print mode or downloads HTML if popup is blocked.
- Copy Sermon Outline copies the title, passage, theme, outline, points, and conclusion.
- Copy Slide Outline copies all generated slides.
- Download Slide Outline Markdown creates a markdown slide plan.
- Download PowerPoint exports a PPTX deck.

## Preaching Mode Checks

- Timer is visible.
- Target time is visible.
- Time remaining is visible.
- Section progress is visible.
- Next section preview is visible.
- Large Text can be toggled.
- Dark Mode and Light Mode can be toggled.
- Previous and Next section buttons work.
- Tap/click on the active section advances to the next section.

## Slide QA Checks

- Title slide is readable.
- Scripture slides are readable.
- Main point slides are distinct from quote/application slides.
- Quote slide uses a quieter template.
- Illustration slide has visual separation.
- Application slide is clear and direct.
- Invitation slide feels clean and uncluttered.
- Presenter notes appear in preview and Present Mode.
- Next slide preview appears in preview and Present Mode.
- Present Mode supports next/previous navigation.
- Present Mode exits cleanly.

## Mobile Checks

- Sermon dashboard loads.
- Builder controls wrap without horizontal scrolling.
- Slide template buttons scroll horizontally inside their row.
- Present Mode opens on phone width.
- Bottom navigation does not cover Present Mode or Preaching Mode.

## Desktop Checks

- Sermon Manager layout is readable.
- Builder and Send to Sermon panels fit side by side on wide screens.
- Slide Builder shows editor and preview without overlap.
- Present Mode slide, next slide, presenter notes, and thumbnails are visible.

## Known Beta Limitations

- Sermons are saved locally during beta unless future Supabase sync is added.
- PDF slide export is still marked coming soon.
- Phone/tablet remote control is planned later.
- The sample sermon is starter content for workflow testing, not a polished published sermon.
- Sermon suggestions use local reviewed starter items only.

## Pass Criteria

- The John 3 sample can be loaded, edited, exported, preached from, and presented.
- No console errors appear during the workflow.
- Required validation commands pass:
  - npm run library:qa
  - npm run validate:commentary
  - npm run validate:strongs
  - npm run lint
  - npm run build
