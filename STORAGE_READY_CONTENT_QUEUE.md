# Storage-Ready Content Queue

## Purpose

This queue defines the next high-value books and commentary sets to add after large text delivery is moved to object storage.

Do not use this file as a public import manifest. It is an acquisition and staging plan.

## Import Gate

Before a large batch is imported publicly, the app should have:

- `CONTENT_PUBLIC_BASE_URL` configured for public content delivery.
- Library text upload script.
- Commentary body upload script.
- Resource metadata updated with storage paths.
- Reader API fetching book text from storage.
- Commentary API fetching chapter bodies from storage.
- Duplicate check by title, author, source URL, and checksum.
- Rights/source review for every imported work.

## Commentary Priority

| Priority | Resource | Best Use | Storage Note | Review Note |
| --- | --- | --- | --- | --- |
| 1 | Treasury of David | Psalms, preaching, devotional study | Store by Psalm/chapter | Verify exact source and avoid duplicate Spurgeon cards. |
| 1 | Pulpit Commentary | Full Bible comparison, teaching helps | Store by book/chapter/section | Pilot one volume before broad import. |
| 1 | Biblical Illustrator | Illustrations, homiletic material | Store as commentary plus teaching helps | Label clearly; can be noisy. |
| 1 | Matthew Poole | Concise classic commentary | Store by book/chapter | Use original public-domain source only. |
| 2 | H. A. Ironside | Expository preaching and Bible teaching | Store by title and chapter | Verify title-level public-domain status. |
| 2 | William Kelly | Expository Bible study | Store by title and chapter | Add doctrinal-context labels. |
| 2 | J. N. Darby | Bible synopsis and selected exposition | Store by title and chapter | Do not bulk import without review labels. |
| 2 | F. W. Grant | Bible study helps | Store by title and chapter | Parser and OCR quality must be proven. |
| 2 | Arno C. Gaebelein | Prophecy and book exposition | Store by title and chapter | Check duplicates before importing. |
| 3 | G. Campbell Morgan | Expository books and Bible surveys | Store by title and chapter | Verify public-domain edition by title. |
| 3 | Alexander Maclaren | Expositions and sermon helps | Store by passage/chapter | Useful for preaching, not a replacement for commentary. |

## Library Priority

### Bible Tools

- International Standard Bible Encyclopedia
- Hastings Dictionary of the Bible
- McClintock and Strong Cyclopaedia
- Smith's Bible Dictionary cleanup/expansion
- Easton's Bible Dictionary cleanup/expansion
- Nave's Topical Bible cleanup/expansion
- Bible manners and customs resources
- Bible geography and atlas resources
- Bible chronology resources

### Baptist History And Church History

- Thomas Armitage
- John T. Christian
- Isaac Backus
- Joseph Ivimey
- Jonathan Davis
- Henry C. Vedder
- William Cathcart
- J. A. Wylie
- John Foxe
- A. B. Earle

### Preaching And Teaching

- C. H. Spurgeon sermon and preaching titles
- A. T. Pierson
- R. A. Torrey
- F. B. Meyer
- Alexander Maclaren
- John Broadus where public-domain source is verified
- Homiletics and pastoral theology resources
- Sunday school teaching helps

### Prayer, Revival, Christian Life

- E. M. Bounds
- Andrew Murray
- R. A. Torrey
- D. L. Moody
- J. C. Ryle
- F. B. Meyer
- Selected public-domain revival histories

### Missions And Biography

- William Carey
- Adoniram Judson
- David Brainerd
- Hudson Taylor
- Robert Morrison
- Mary Slessor
- John G. Paton
- George Muller

### KJV / English Bible History

- Public-domain English Bible history works
- Dean Burgon public-domain titles
- Scrivener public-domain titles
- Translators Revived by Alexander McClure
- Older English Bible history titles with verified editions

Do not publicly import modern KJV-defense titles without written permission.

## First Post-Storage Batch

After the storage adapter is pointed to object storage, start with a small batch:

1. 10 library books.
2. 100 commentary chapter entries.
3. 2 Bible reference works.
4. 1 image/media batch.

Then validate:

```bash
npm run library:qa
npm run library:validate
npm run validate:commentary
npm run validate:strongs
npm run lint
npm run build
```

Only scale to 200+ books or 1,000+ commentary entries after the first post-storage batch is clean.
