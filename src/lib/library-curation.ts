export type LibraryManifestEntry = {
  title: string;
  author: string;
  year: number;
  category: string;
  collection?: string;
  source_url: string;
  download_url?: string;
  source_license_url: string;
  file_path: string;
  content_storage_path?: string;
  content_storage_status?: string;
  file_format?: string;
  publisher?: string;
  publication_date?: string;
  edition_note?: string;
  source_accessed_at?: string;
  rights_evidence_url?: string;
  free_access_notice?: string;
  rights_notice?: string;
  attribution_statement?: string;
  public_domain_status: string;
  commercial_use_status: string;
  rights_basis: string;
  notes: string;
  import_status: string;
  rights_status?: string;
  doctrinal_review_status?: string;
  perspective_notes?: string;
  recommended_use?: string;
  resource_labels?: string[];
  resource_warnings?: string[];
  bible_books?: string[];
  word_count?: number;
  file_size_bytes?: number;
  checksum_sha256?: string;
  cover_image_url?: string;
  cover_source_url?: string;
  cover_rights_status?: string;
  reading_time_minutes?: number;
  ocr_quality_score?: number;
  ocr_quality_label?: string;
  front_matter_cleanup_needed?: boolean;
  safe_for_quotation?: boolean;
  ocr_cleanup_notes?: string;
  cover_metadata?: {
    type: string;
    title: string;
    author: string;
    category: string;
    collection: string;
    badge: string;
    palette: {
      from: string;
      to: string;
    };
  };
};

function projectGutenbergCoverUrl(sourceUrl: string) {
  const match = sourceUrl.match(/^https:\/\/www\.gutenberg\.org\/ebooks\/(\d+)/);
  return match ? `https://www.gutenberg.org/cache/epub/${match[1]}/pg${match[1]}.cover.medium.jpg` : null;
}

function originalLibraryCoverUrl(entry: LibraryManifestEntry) {
  if (entry.title === "The Gospel of the Kingdom" && entry.author === "C. H. Spurgeon") {
    return "/media/library-covers/spurgeon-gospel-kingdom-v1.png";
  }
  if (entry.title.toLowerCase().startsWith("the holiest of all") && entry.author === "Andrew Murray") {
    return "/media/library-covers/andrew-murray-holiest-of-all-v1.png";
  }
  if (entry.file_path.endsWith("notes-on-the-book-of-nehemiah-ironside-h-a-henry-allan-1876-1951.txt")) {
    return "/media/library-covers/h-a-ironside-notes-nehemiah-v1.png";
  }
  if (entry.file_path.endsWith("notes-on-the-epistle-to-the-philippians-h-a-ironside.txt")) {
    return "/media/library-covers/h-a-ironside-notes-philippians-v1.png";
  }
  if (entry.file_path.endsWith("lectures-on-the-epistle-to-the-colossians-ironside-h-a-henry-allan-1876-1951.txt")) {
    return "/media/library-covers/h-a-ironside-colossians-v1.png";
  }
  if (entry.file_path.endsWith("lectures-on-the-epistle-to-the-romans-h-a-ironside.txt")) {
    return "/media/library-covers/h-a-ironside-romans-v1.png";
  }
  if (entry.file_path.endsWith("the-gospel-of-john-a-popular-commentary-upon-a-critical-basis-especialy-designed-for-pastors-and-sunday-school.txt")) {
    return "/media/library-covers/george-w-clark-gospel-of-john-v1.png";
  }
  if (entry.file_path.endsWith("commentary-on-the-gospel-of-mark-alexander-joseph-addison-1809-1860.txt")) {
    return "/media/library-covers/joseph-addison-alexander-mark-v1.png";
  }
  if (entry.file_path.endsWith("the-acts-of-the-apostles-an-exposition-arno-c-gaebelein.txt")) {
    return "/media/library-covers/arno-gaebelein-acts-exposition-v1.png";
  }
  if (entry.file_path.endsWith("the-gospel-of-matthew-an-exposition-gaebelein-arno-clemens-1861-1945-2.txt")) {
    return "/media/library-covers/arno-gaebelein-matthew-exposition-v1.png";
  }
  if (entry.file_path.endsWith("the-revelation-an-analysis-and-exposition-of-the-last-book-of-the-bible-arno-c-gaebelein.txt")) {
    return "/media/library-covers/arno-gaebelein-revelation-exposition-v1.png";
  }
  if (entry.file_path.endsWith("the-prophet-daniel-a-key-to-the-visions-and-prophecies-of-the-book-of-daniel-gaebelein-arno-clemens-1861-1945-2.txt")) {
    return "/media/library-covers/arno-gaebelein-prophet-daniel-v1.png";
  }
  return null;
}

const CATEGORY_LABELS: Record<string, string> = {
  "Bible study helps": "Bible Handbooks",
  "Baptist history": "Baptist History",
  "Christian life": "Christian Living",
  "Fiction/classics": "Classics",
  "Preaching/teaching": "Preaching & Teaching",
};

export const LIBRARY_CATEGORIES = [
  "Dictionaries",
  "Topical Bible",
  "Encyclopedias",
  "Cross References",
  "Bible Handbooks",
  "Bible Survey / Whole Bible / Commentary Helps",
  "Surveys",
  "Commentaries",
  "Baptist History",
  "Missions",
  "Evangelism",
  "Prayer",
  "Christian Living",
  "Preaching & Teaching",
  "KJV / Textual Issues",
  "Biographies",
  "Classics",
] as const;

export function normalizeLibraryCategory(category: string) {
  return CATEGORY_LABELS[category] ?? category;
}

function compactUnique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim()))));
}

function warningLabels(entry: LibraryManifestEntry, category: string) {
  const author = entry.author.toLowerCase();
  const warnings = [...(entry.resource_warnings ?? [])];

  if (category === "Baptist History") warnings.push("Baptist history", "Historical value");
  if (category === "Classics") warnings.push("Devotional classic");
  if (author.includes("foxe")) warnings.push("Historical value", "Use with discernment");
  if (author.includes("ironside")) warnings.push("Use with discernment");
  if (author.includes("murray")) warnings.push("Use with discernment", "Not all doctrine endorsed");
  if (author.includes("meyer")) warnings.push("Use with discernment", "Not all doctrine endorsed");
  if (author.includes("müller") || author.includes("muller")) warnings.push("Historical value", "Use with discernment");
  if (author.includes("judson")) warnings.push("Historical value", "Use with discernment");
  if (author.includes("gordon")) warnings.push("Use with discernment", "Not all doctrine endorsed");
  if (author.includes("bonar")) warnings.push("Historical value", "Use with discernment");
  if (author.includes("pink")) warnings.push("Use with discernment", "Not all doctrine endorsed");
  if (author.includes("ryle")) warnings.push("Devotional classic", "Use with discernment");
  if (author.includes("spurgeon")) warnings.push("Devotional classic", "Use with discernment");
  if (author.includes("taylor")) warnings.push("Use with discernment", "Historical value");

  return compactUnique(warnings);
}

function resourceLabels(entry: LibraryManifestEntry, category: string) {
  const author = entry.author.toLowerCase();
  const labels = [category, ...(entry.resource_labels ?? [])];

  if (category === "Prayer") labels.push("Prayer");
  if (category === "Topical Bible") labels.push("Bible study helps");
  if (category === "Evangelism") labels.push("Evangelism");
  if (category === "Missions") labels.push("Missions");
  if (category === "Preaching & Teaching") labels.push("Preaching");
  if (author.includes("bunyan")) labels.push("Devotional classic");
  if (author.includes("bounds")) labels.push("Devotional classic");
  if (author.includes("foxe")) labels.push("Historical value");
  if (author.includes("moody")) labels.push("Evangelism");
  if (author.includes("müller") || author.includes("muller")) labels.push("Prayer", "Missions");
  if (author.includes("judson")) labels.push("Missions", "Biography");
  if (author.includes("meyer")) labels.push("Bible study helps");
  if (author.includes("ryle")) labels.push("Devotional classic");
  if (author.includes("taylor")) labels.push("Missions");
  if (author.includes("torrey")) labels.push("Bible study helps");

  return compactUnique(labels);
}

function perspectiveNotes(entry: LibraryManifestEntry, category: string) {
  if (entry.perspective_notes) return entry.perspective_notes;

  const author = entry.author.toLowerCase();
  if (category === "Baptist History") return "Historical Baptist resource; useful for context, heritage, and careful source review.";
  if (author.includes("murray")) return "Devotional classic from a non-Baptist author; useful with discernment and Scripture-first review.";
  if (author.includes("meyer")) return "Devotional Bible study and biography from a Baptist author; useful with discernment and Scripture-first review.";
  if (author.includes("müller") || author.includes("muller")) return "Prayer and faith testimony resource; useful for encouragement with Scripture-first discernment.";
  if (author.includes("judson")) return "Missionary biography or Baptist missions resource; useful for burden, history, and teaching context.";
  if (author.includes("gordon")) return "Baptist devotional and doctrinal resource; review carefully and keep Scripture primary.";
  if (author.includes("bonar")) return "Historical devotional biography; useful with denominational context and Scripture-first review.";
  if (author.includes("spurgeon")) return "Baptist preacher and devotional classic; review quotes in context for teaching use.";
  if (author.includes("taylor")) return "Missionary devotional resource; useful for missions burden, Christian life, and Bible study with discernment.";
  if (category === "Prayer") return "Prayer-focused devotional resource for personal devotion, teaching, and ministry encouragement.";
  if (category === "Topical Bible") return "Topical Scripture index; use it to find related KJV passages while keeping the Bible text central.";
  if (category === "Evangelism") return "Evangelism resource for outreach preparation and personal witness.";
  if (category === "Missions") return "Missionary biography or missions resource for examples, burden, and testimony.";
  if (category === "Classics") return "Classic Christian literature; helpful for illustration and devotional reading with Bible-centered discernment.";
  if (category === "Bible Handbooks") return "Bible study help; use alongside the KJV text and checked doctrine.";

  return "Curated public-domain resource; review doctrine and source context before broad teaching use.";
}

function recommendedUse(entry: LibraryManifestEntry, category: string) {
  if (entry.recommended_use) return entry.recommended_use;

  if (category === "Prayer") return "Prayer meetings, personal devotion, and sermon or Sunday school application.";
  if (category === "Topical Bible") return "Topic tracing, verse chains, and teaching preparation.";
  if (category === "Evangelism") return "Witnessing preparation, gospel invitations, and outreach lesson support.";
  if (category === "Missions") return "Missionary focus, biography reading, and ministry encouragement.";
  if (category === "Baptist History") return "Historical background, Baptist heritage, and source-context study.";
  if (category === "Preaching & Teaching") return "Illustrations, lesson preparation, and preaching craft.";
  if (category === "Classics") return "Devotional reading, illustration mining, and Christian life discussion.";
  if (category === "Bible Handbooks") return "Chapter study support after reading the Bible text first.";

  return "Supplemental study after reading the Bible text.";
}

export function curateLibraryEntry(entry: LibraryManifestEntry) {
  const isAndrewMurrayHoliest = entry.title.toLowerCase().startsWith("the holiest of all") && entry.author === "Andrew Murray";
  const isIronsideNehemiah = entry.file_path.endsWith("notes-on-the-book-of-nehemiah-ironside-h-a-henry-allan-1876-1951.txt");
  const isIronsidePhilippians = entry.file_path.endsWith("notes-on-the-epistle-to-the-philippians-h-a-ironside.txt");
  const isIronsideColossians = entry.file_path.endsWith("lectures-on-the-epistle-to-the-colossians-ironside-h-a-henry-allan-1876-1951.txt");
  const isIronsideRomans = entry.file_path.endsWith("lectures-on-the-epistle-to-the-romans-h-a-ironside.txt");
  const isGeorgeClarkJohn = entry.file_path.endsWith("the-gospel-of-john-a-popular-commentary-upon-a-critical-basis-especialy-designed-for-pastors-and-sunday-school.txt");
  const isJosephAlexanderMark = entry.file_path.endsWith("commentary-on-the-gospel-of-mark-alexander-joseph-addison-1809-1860.txt");
  const isGaebeleinActs = entry.file_path.endsWith("the-acts-of-the-apostles-an-exposition-arno-c-gaebelein.txt");
  const isGaebeleinMatthew = entry.file_path.endsWith("the-gospel-of-matthew-an-exposition-gaebelein-arno-clemens-1861-1945-2.txt");
  const isGaebeleinRevelation = entry.file_path.endsWith("the-revelation-an-analysis-and-exposition-of-the-last-book-of-the-bible-arno-c-gaebelein.txt");
  const isGaebeleinDaniel = entry.file_path.endsWith("the-prophet-daniel-a-key-to-the-visions-and-prophecies-of-the-book-of-daniel-gaebelein-arno-clemens-1861-1945-2.txt");
  const category = isAndrewMurrayHoliest || isIronsideNehemiah || isIronsidePhilippians || isIronsideColossians || isIronsideRomans || isGeorgeClarkJohn || isJosephAlexanderMark || isGaebeleinActs || isGaebeleinMatthew || isGaebeleinRevelation || isGaebeleinDaniel ? "Commentaries" : normalizeLibraryCategory(entry.category);
  const collection = entry.collection ?? entry.cover_metadata?.collection ?? entry.resource_labels?.[0] ?? category;
  const warnings = warningLabels(entry, category);
  const originalCover = originalLibraryCoverUrl(entry);

  return {
    title: isAndrewMurrayHoliest ? "The Holiest of All" : isIronsideNehemiah ? "Notes on the Book of Nehemiah" : isGeorgeClarkJohn ? "The Gospel of John: A Popular Commentary" : isJosephAlexanderMark ? "Commentary on the Gospel of Mark" : isGaebeleinActs ? "The Acts of the Apostles: An Exposition" : isGaebeleinMatthew ? "The Gospel of Matthew: An Exposition" : isGaebeleinRevelation ? "The Revelation: An Analysis and Exposition" : isGaebeleinDaniel ? "The Prophet Daniel: A Key to the Visions and Prophecies" : entry.title,
    author: isIronsideNehemiah || isIronsideColossians || isIronsideRomans ? "H. A. Ironside" : isGeorgeClarkJohn ? "George W. Clark" : isJosephAlexanderMark ? "Joseph Addison Alexander" : isGaebeleinActs || isGaebeleinMatthew || isGaebeleinRevelation || isGaebeleinDaniel ? "Arno C. Gaebelein" : entry.author,
    year: isIronsideNehemiah ? 1914 : isIronsideRomans ? 1928 : isGeorgeClarkJohn ? 1896 : isGaebeleinDaniel ? 1911 : entry.year,
    category,
    collection,
    original_category: entry.category,
    description: isAndrewMurrayHoliest
      ? "Complete public-domain devotional exposition connected chapter-by-chapter to Hebrews 1-13. Keep the KJV text primary and compare doctrinal conclusions carefully with Scripture."
      : isIronsideNehemiah
        ? "Complete public-domain exposition connected chapter-by-chapter to Nehemiah 1-13, with practical studies of prayer, rebuilding, opposition, Bible reading, and faithful service."
      : isIronsidePhilippians
        ? "Complete public-domain exposition connected chapter-by-chapter to Philippians 1-4, centered on Christ as the believer's life, example, object, and strength."
      : isIronsideColossians
        ? "Complete public-domain exposition connected chapter-by-chapter to Colossians 1-4, emphasizing Christ's preeminence and sufficiency, the believer's life in Him, prayer, and practical holiness."
      : isIronsideRomans
        ? "Complete public-domain exposition connected chapter-by-chapter to Romans 1-16, tracing God's righteousness in the gospel, justification by faith, life in Christ, Israel, and practical Christian service."
      : isGeorgeClarkJohn
        ? "Complete public-domain verse-by-verse commentary connected to John 1-21, prepared for pastors, families, and Sunday schools with historical notes, doctrinal observations, and practical teaching suggestions."
      : isJosephAlexanderMark
        ? "Complete public-domain exposition connected chapter-by-chapter to Mark 1-16, with close attention to grammar, Gospel harmony, historical setting, Christ's works, and the unfolding narrative."
      : isGaebeleinActs
        ? "Complete public-domain exposition connected chapter-by-chapter to Acts 1-28, tracing the risen Christ's continuing work, Pentecost, the Holy Spirit, church growth, gospel witness, missions, and Paul's journeys."
      : isGaebeleinMatthew
        ? "Complete public-domain exposition connected chapter-by-chapter to Matthew 1-28, emphasizing Jesus Christ as King, the kingdom message, prophecy, parables, discipleship, the cross, and resurrection."
      : isGaebeleinRevelation
        ? "Complete public-domain exposition connected chapter-by-chapter to Revelation 1-22, emphasizing the revelation of Jesus Christ, the seven churches, worship, judgment, victory, the coming kingdom, and new creation."
      : isGaebeleinDaniel
        ? "Complete public-domain exposition connected chapter-by-chapter to Daniel 1-12, emphasizing faithfulness, prayer, prophetic visions, the times of the Gentiles, Israel, and God's sovereign kingdom."
        : entry.notes,
    public_domain_status: entry.public_domain_status,
    rights_status: entry.rights_status ?? entry.commercial_use_status,
    commercial_use_status: entry.commercial_use_status,
    doctrinal_review_status: entry.doctrinal_review_status ?? "beta reviewed",
    perspective_notes: perspectiveNotes(entry, category),
    recommended_use: isAndrewMurrayHoliest
      ? "Read after each KJV chapter of Hebrews for devotional exposition on Christ, the better covenant, faith, holiness, and drawing near to God."
      : isIronsideNehemiah
        ? "Read after each KJV chapter of Nehemiah for exposition, leadership applications, sermon preparation, and ministry encouragement."
      : isIronsidePhilippians
        ? "Read after each KJV chapter of Philippians for practical exposition on joy, humility, prayer, contentment, gospel service, and the mind of Christ."
      : isIronsideColossians
        ? "Read after each KJV chapter of Colossians for exposition on the preeminence of Christ, freedom from human philosophy and legalism, the new man, prayer, and gracious witness."
      : isIronsideRomans
        ? "Read after each KJV chapter of Romans for gospel-centered exposition of justification by faith, union with Christ, life in the Spirit, God's dealings with Israel, and practical Christian living."
      : isGeorgeClarkJohn
        ? "Read after each KJV chapter of John for verse-by-verse exposition, lesson preparation, geography, chronology, and practical applications concerning the person and work of Christ."
      : isJosephAlexanderMark
        ? "Read after each KJV chapter of Mark for detailed exposition, Gospel comparison, historical background, teaching preparation, and study of Christ's active ministry."
      : isGaebeleinActs
        ? "Read after each KJV chapter of Acts for dispensational exposition, teaching preparation, church history, missionary application, and study of the risen Christ's continuing work."
      : isGaebeleinMatthew
        ? "Read after each KJV chapter of Matthew for dispensational exposition, Gospel study, prophecy, kingdom teaching, discipleship, and sermon preparation."
      : isGaebeleinRevelation
        ? "Read after each KJV chapter of Revelation for dispensational exposition, prophecy study, worship, watchfulness, Christ's victory, the coming kingdom, and new creation."
      : isGaebeleinDaniel
        ? "Read after each KJV chapter of Daniel for dispensational exposition, character study, prayer, prophecy, the times of the Gentiles, Israel, and God's sovereign kingdom."
        : recommendedUse(entry, category),
    resource_labels: resourceLabels(entry, category),
    resource_warnings: warnings,
    bible_books: isAndrewMurrayHoliest ? ["Hebrews"] : isIronsideNehemiah ? ["Nehemiah"] : isIronsidePhilippians ? ["Philippians"] : isIronsideColossians ? ["Colossians"] : isIronsideRomans ? ["Romans"] : isGeorgeClarkJohn ? ["John"] : isJosephAlexanderMark ? ["Mark"] : isGaebeleinActs ? ["Acts"] : isGaebeleinMatthew ? ["Matthew"] : isGaebeleinRevelation ? ["Revelation"] : isGaebeleinDaniel ? ["Daniel"] : entry.bible_books ?? [],
    source_url: entry.source_url,
    download_url: entry.download_url ?? null,
    source_license_url: entry.source_license_url,
    content_storage_path: entry.content_storage_path ?? null,
    content_storage_status: entry.content_storage_status ?? null,
    file_format: entry.file_format ?? null,
    publisher: entry.publisher ?? null,
    publication_date: entry.publication_date ?? null,
    edition_note: entry.edition_note ?? null,
    source_accessed_at: entry.source_accessed_at ?? null,
    rights_evidence_url: entry.rights_evidence_url ?? null,
    free_access_notice: entry.free_access_notice ?? null,
    rights_notice: entry.rights_notice ?? null,
    attribution_statement: entry.attribution_statement ?? null,
    rights_basis: entry.rights_basis,
    word_count: entry.word_count ?? null,
    file_size_bytes: entry.file_size_bytes ?? null,
    checksum_sha256: entry.checksum_sha256 ?? null,
    cover_image_url: originalCover ?? entry.cover_image_url ?? projectGutenbergCoverUrl(entry.source_url),
    cover_source_url: isIronsideNehemiah
      ? "#original-generated-cover-prompt-2026-09-06-h-a-ironside-notes-nehemiah"
      : isIronsidePhilippians
        ? "#original-generated-cover-prompt-2026-09-06-h-a-ironside-notes-philippians"
      : isIronsideColossians
        ? "#original-generated-cover-prompt-2026-09-06-h-a-ironside-colossians"
      : isIronsideRomans
        ? "#original-generated-cover-prompt-2026-09-06-h-a-ironside-romans"
      : isGeorgeClarkJohn
        ? "#original-generated-cover-prompt-2026-09-06-george-w-clark-gospel-john"
      : isJosephAlexanderMark
        ? "#original-generated-cover-prompt-2026-09-06-joseph-addison-alexander-mark"
      : isGaebeleinActs
        ? "#original-generated-cover-prompt-2026-09-06-arno-gaebelein-acts"
      : isGaebeleinMatthew
        ? "#original-generated-cover-prompt-2026-09-06-arno-gaebelein-matthew"
      : isGaebeleinRevelation
        ? "#original-generated-cover-prompt-2026-09-06-arno-gaebelein-revelation"
      : isGaebeleinDaniel
        ? "#original-generated-cover-prompt-2026-09-06-arno-gaebelein-daniel"
      : entry.cover_source_url ?? (entry.source_url.includes("gutenberg.org") ? entry.source_url : null),
    cover_rights_status: originalCover
      ? "Original generated asset"
      : entry.cover_rights_status ?? (entry.source_url.includes("gutenberg.org") ? "Project Gutenberg hosted cover; use under source license/trademark terms." : "Generated fallback cover"),
    reading_time_minutes: entry.reading_time_minutes ?? (entry.word_count ? Math.max(1, Math.round(entry.word_count / 225)) : null),
    ocr_quality_score: entry.ocr_quality_score ?? null,
    ocr_quality_label: entry.ocr_quality_label ?? null,
    front_matter_cleanup_needed: entry.front_matter_cleanup_needed ?? null,
    safe_for_quotation: entry.safe_for_quotation ?? null,
    ocr_cleanup_notes: entry.ocr_cleanup_notes ?? null,
    cover_metadata: isIronsideNehemiah
      ? {
          type: "original-generated",
          title: "Notes on the Book of Nehemiah",
          author: "H. A. Ironside",
          category: "Commentaries",
          collection: "Ironside Collection",
          badge: "Ironside Collection",
          palette: { from: "#071a2d", to: "#b38a43" },
        }
      : isIronsidePhilippians
        ? {
            type: "original-generated",
            title: "Notes on the Epistle to the Philippians",
            author: "H. A. Ironside",
            category: "Commentaries",
            collection: "H. A. Ironside Collection",
            badge: "H. A. Ironside Collection",
            palette: { from: "#061b2d", to: "#b98532" },
          }
        : isIronsideColossians
          ? {
              type: "original-generated",
              title: "Lectures on the Epistle to the Colossians",
              author: "H. A. Ironside",
              category: "Commentaries",
              collection: "H. A. Ironside Collection",
              badge: "H. A. Ironside Collection",
              palette: { from: "#102b1d", to: "#b58a42" },
            }
        : isIronsideRomans
          ? {
              type: "original-generated",
              title: "Lectures on the Epistle to the Romans",
              author: "H. A. Ironside",
              category: "Commentaries",
              collection: "H. A. Ironside Collection",
              badge: "H. A. Ironside Collection",
              palette: { from: "#3c0e0b", to: "#b58a42" },
            }
        : isGeorgeClarkJohn
          ? {
              type: "original-generated",
              title: "The Gospel of John: A Popular Commentary",
              author: "George W. Clark",
              category: "Commentaries",
              collection: "Classic Commentary Library",
              badge: "Classic Commentary Library",
              palette: { from: "#071b2d", to: "#b58a42" },
            }
        : isJosephAlexanderMark
          ? {
              type: "original-generated",
              title: "Commentary on the Gospel of Mark",
              author: "Joseph Addison Alexander",
              category: "Commentaries",
              collection: "Classic Commentary Library",
              badge: "Classic Commentary Library",
              palette: { from: "#17351f", to: "#b58a42" },
            }
        : isGaebeleinActs
          ? {
              type: "original-generated",
              title: "The Acts of the Apostles: An Exposition",
              author: "Arno C. Gaebelein",
              category: "Commentaries",
              collection: "Classic Commentary Library",
              badge: "Classic Commentary Library",
              palette: { from: "#07182b", to: "#b58a42" },
            }
        : isGaebeleinMatthew
          ? {
              type: "original-generated",
              title: "The Gospel of Matthew: An Exposition",
              author: "Arno C. Gaebelein",
              category: "Commentaries",
              collection: "Classic Commentary Library",
              badge: "Classic Commentary Library",
              palette: { from: "#2a1038", to: "#b58a42" },
            }
        : isGaebeleinRevelation
          ? {
              type: "original-generated",
              title: "The Revelation: An Analysis and Exposition",
              author: "Arno C. Gaebelein",
              category: "Commentaries",
              collection: "Classic Commentary Library",
              badge: "Classic Commentary Library",
              palette: { from: "#4a100a", to: "#b58a42" },
            }
        : isGaebeleinDaniel
          ? {
              type: "original-generated",
              title: "The Prophet Daniel: A Key to the Visions and Prophecies",
              author: "Arno C. Gaebelein",
              category: "Commentaries",
              collection: "Classic Commentary Library",
              badge: "Classic Commentary Library",
              palette: { from: "#071a33", to: "#b58a42" },
            }
        : entry.cover_metadata ?? null,
    added_at: entry.import_status,
  };
}
