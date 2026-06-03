# Resource Import Engine Foundation

This workflow is for Stephen/admin reviewer use only. It is hidden from normal Library navigation and does not publish uploaded content automatically.

Open the admin dashboard by visiting:

```text
/#admin-import
```

## Supported Intake Types

- Library Book
- Commentary
- Dictionary
- Bible Handbook
- Bible Survey
- Devotional
- Sermon / Teaching Resource
- KJV/Textual Issue Resource
- Baptist History
- Missions / Biography

## Upload Types

- TXT: text preview supported now
- Markdown: text preview supported now
- DOCX: later, metadata placeholder only
- EPUB: later, metadata placeholder only
- PDF: later, metadata placeholder only
- ZIP: later, batch placeholder only

Do not rely on DOCX, EPUB, PDF, or ZIP parsing until reliable extraction and review tools are added.

## Required Metadata

Each upload must include:

- title
- author
- year
- category
- resource type
- source URL
- rights status
- doctrinal review status
- warning labels
- recommended use
- public/private setting
- notes

Commentaries also require the Bible book covered.

## Review Statuses

- Draft
- Needs Review
- Verified
- Permission Needed
- Personal Use Only
- Do Not Import

Only Verified resources with `Public after review` visibility can become public later. Personal uploads must remain private to the signed-in user. Draft, Needs Review, Permission Needed, Personal Use Only, and Do Not Import items must not appear in the public Library.

## Dashboard Sections

- Upload Resource
- Import Queue
- Review Needed
- Approved Resources
- Permission Needed
- Personal Use Only

## Commentary Import Rules

For commentary files:

- Ask for the Bible book covered.
- Detect chapter headings when possible.
- Prepare entries by book/chapter for review.
- Add the full work to Library only if rights permit.
- Keep commentary secondary to Scripture.

Recommended heading examples:

```text
John 1
John 2
John 3
```

or:

```markdown
## John 3
```

## Dictionary Import Rules

For dictionary files:

- Detect headwords when possible.
- Prepare dictionary entries for review.
- Add the source to Library only if rights permit.

Recommended entry shape:

```text
FAITH
Definition text...

GRACE
Definition text...
```

## ZIP Batch Placeholder

ZIP import is not active yet. Future ZIP uploads should use:

```text
manifest.json
files/
covers/
```

`manifest.json` should describe each file, its resource type, metadata, rights status, doctrinal review status, warning labels, public/private setting, notes, and recommended use.

## Safety Rules

- Do not publish imported content automatically.
- Do not import copyrighted books publicly unless rights are clear.
- David Cloud / Way of Life resources stay Permission Needed unless written permission exists.
- User-purchased books are future personal-use uploads only.
- Do not publish personal uploads to all users.
- Keep rights metadata attached to every imported resource.
- Keep doctrinal review notes visible.
- Do not import false religions, cult material, or rejected resources.
