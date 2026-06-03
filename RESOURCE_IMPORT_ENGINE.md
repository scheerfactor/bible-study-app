# Resource Import Engine Foundation

This workflow is for trusted admin/reviewer use only. It does not publish uploaded content automatically.

## Supported Intake Types

- Library Book
- Commentary
- Dictionary
- Bible Handbook / Survey
- Devotional
- Sermon / Teaching Resource

## Upload Types

- TXT: text preview supported now
- Markdown: text preview supported now
- DOCX: metadata placeholder only
- PDF: metadata placeholder only
- ZIP: batch placeholder only

Do not rely on PDF or DOCX parsing until reliable extraction and review tools are added.

## Required Metadata

Each upload must include:

- title
- author
- year
- category
- source URL
- rights status
- doctrinal review status
- warning labels
- recommended use

Commentaries also require the Bible book covered.

## Review Statuses

- verified
- needs review
- permission needed
- personal use only
- do not import

Verified public Library imports require clear rights notes. Personal uploads must remain private to the signed-in user.

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

`manifest.json` should describe each file, its resource type, metadata, rights status, doctrinal review status, warning labels, and recommended use.

## Safety Rules

- Do not publish imported content automatically.
- Do not import copyrighted books publicly unless rights are clear.
- Do not publish personal uploads to all users.
- Keep rights metadata attached to every imported resource.
- Keep doctrinal review notes visible.
- Do not import false religions, cult material, or rejected resources.
