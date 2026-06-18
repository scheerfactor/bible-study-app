# Public-Domain Audio Candidate Queue

## Purpose

This queue identifies audio resources that appear suitable for Father’s Business Bible Study because the source platform presents the recordings as public domain in the United States. Nothing in this list should be treated as publicly imported until the exact audio files, metadata, and app display are reviewed.

## Rights Posture

- Preferred first source: LibriVox catalog pages, because LibriVox marks its recordings as public domain in the USA.
- Store original source URLs and keep LibriVox/Internet Archive links attached to each media record.
- Keep new audio private/admin draft until the exact files are uploaded to R2 and checked.
- Do not use random YouTube mirrors as source evidence when an original LibriVox or Internet Archive page exists.
- Bible audio needs extra care outside the USA because KJV rights differ by country.

## Best First Imports

1. Bible (KJV), Complete - LibriVox
   - Why: full KJV Bible audio; strong test of Bible audio storage, chapter navigation, and playlist flow.
   - Caution: very large, roughly 2.8 GB zip / 100+ hours. Import by book or chapter group, not all at once.

2. All of Grace - C. H. Spurgeon
   - Why: short, gospel-centered, already important in the Library.
   - Use: audiobook pilot with read/listen on one resource card.

3. Morning and Evening - C. H. Spurgeon
   - Why: devotional audio with daily-use value.
   - Use: daily devotional listening path.

4. Expository Thoughts on the Gospels - J. C. Ryle
   - Why: commentary/devotional bridge; useful for Bible study and teaching.
   - Use: commentary audio or library audiobook, depending on app presentation.

5. The Essentials of Prayer - E. M. Bounds
   - Why: strong prayer module companion.
   - Use: Prayer reading/listening path.

6. With Christ in the School of Prayer - Andrew Murray
   - Why: strong prayer classic and daily growth resource.
   - Use: Prayer path and devotional audiobook.

7. How to Pray - R. A. Torrey
   - Why: practical, direct, useful for teachers and new believers.
   - Use: Prayer path and Christian living shelf.

8. The Pilgrim’s Progress - John Bunyan
   - Why: major Christian classic with long-form audiobook value.
   - Use: Christian Classics path.

9. Foxe’s Book of Martyrs, Vols. 1-2 - John Foxe
   - Why: church history / persecution / martyrs content.
   - Use: Baptist history and church history paths with discernment labels.

10. A Retrospect - J. Hudson Taylor
    - Why: missions biography with strong ministry value.
    - Use: Missions path.

## Candidate CSV

The machine-readable candidate queue is here:

```text
data/media/acquisition/public-domain-audio-candidates.csv
```

This is not an upload batch. It has no local file paths yet. Use it to choose the next download/upload batch, then create a real `data/media/batches/*.csv` with local files and R2 paths.

## Next Practical Step

Start with 3-5 small/medium works:

- All of Grace
- Around the Wicket Gate
- The Essentials of Prayer
- How to Pray
- A Retrospect

Then test one larger work:

- Expository Thoughts on the Gospels - St. Matthew

After the app handles those cleanly, split the full KJV Bible audio by book/chapter group and upload it in batches.
