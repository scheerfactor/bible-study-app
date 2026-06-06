# Personal Book And Audio Import Plan

## Purpose

Prepare a safe future workflow for personal books, scanned material, audiobooks, and study resources without publishing copyrighted material to the public Library.

## Guiding Rules

- Personal imports stay private to the signed-in user.
- Nothing becomes public without rights review and approval.
- Copyrighted books, purchased ebooks, modern audiobooks, and ministry resources must not be shared with all users unless written permission or a clear license exists.
- Public-domain imports still need source, edition, and metadata review.

## Future Personal Book Upload

Supported later:

- TXT
- Markdown
- EPUB
- DOCX
- PDF
- Scanned book photos

Workflow:

1. Upload file or photos.
2. Mark as personal-use-only by default.
3. Extract text where possible.
4. Preview extracted text.
5. Add title, author, edition, source, and rights notes.
6. Store privately for that user.
7. Make it available in personal reader, personal search, and personal listening.

## Scanned Book And OCR Workflow

Future OCR flow:

1. Upload scanned pages or book photos.
2. Detect page order.
3. Run OCR.
4. Create proofing queue.
5. Let the user correct bad text.
6. Save clean text privately.
7. Optionally split into chapters or sections.

Review needs:

- OCR confidence score
- missing page warnings
- repeated page warnings
- unreadable page warnings
- proofed/unproofed status

## Audiobook Upload Workflow

Supported later:

- MP3
- M4A
- WAV
- audiobook folder
- chapter audio files

Metadata:

- title
- author
- narrator
- duration
- source
- rights status
- audio file path
- matching text resource
- text sync available

Rules:

- Uploaded audiobooks are private unless rights are documented.
- Modern sermon or audiobook audio requires permission before public use.
- Audio rights are tracked separately from ebook/text rights.

## Text And Audio Matching

Future matching process:

1. Link audio to an existing personal or public text resource.
2. Match chapter or section names.
3. Store rough listening position.
4. Add sentence or paragraph sync only after reliable tooling exists.
5. Show "Follow text while listening" only when sync is available.

## Cover Extraction

Future cover workflow:

1. Extract cover from EPUB/PDF when allowed.
2. Upload custom personal cover.
3. Use public-domain or licensed cover only for public resources.
4. Fall back to generated cover cards when cover rights are unclear.

## Rights Review

Public import requires:

- source URL
- publication year
- edition notes
- author death year when relevant
- rights status
- commercial-use notes
- attribution notes
- doctrinal review status

Restricted examples:

- Richard Wurmbrand / Tortured for Christ: permission needed.
- Trail of Blood: needs review or permission until rights are proven.
- David Cloud / Way of Life: permission needed unless written permission exists.

## Supabase Planning

Future private import tables:

- user_imported_resources
- user_imported_resource_files
- user_imported_audio_files
- user_import_ocr_jobs
- user_import_proofing_queue
- user_text_audio_sync

Future public review tables:

- resource_import_queue
- resource_rights_reviews
- resource_approval_events
- public_resource_files
- public_audio_files

## Beta Scope

Current beta uses reviewed public-domain text resources and browser/device narration. Full OCR, uploaded audio, scanned books, and public import approval remain future work.
