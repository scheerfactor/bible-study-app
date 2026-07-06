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
  file_format?: string;
  publisher?: string;
  edition_note?: string;
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
  const category = normalizeLibraryCategory(entry.category);
  const collection = entry.collection ?? entry.cover_metadata?.collection ?? entry.resource_labels?.[0] ?? category;
  const warnings = warningLabels(entry, category);

  return {
    title: entry.title,
    author: entry.author,
    year: entry.year,
    category,
    collection,
    original_category: entry.category,
    description: entry.notes,
    public_domain_status: entry.public_domain_status,
    rights_status: entry.rights_status ?? entry.commercial_use_status,
    commercial_use_status: entry.commercial_use_status,
    doctrinal_review_status: entry.doctrinal_review_status ?? "beta reviewed",
    perspective_notes: perspectiveNotes(entry, category),
    recommended_use: recommendedUse(entry, category),
    resource_labels: resourceLabels(entry, category),
    resource_warnings: warnings,
    source_url: entry.source_url,
    download_url: entry.download_url ?? null,
    source_license_url: entry.source_license_url,
    file_format: entry.file_format ?? null,
    publisher: entry.publisher ?? null,
    edition_note: entry.edition_note ?? null,
    free_access_notice: entry.free_access_notice ?? null,
    rights_notice: entry.rights_notice ?? null,
    attribution_statement: entry.attribution_statement ?? null,
    rights_basis: entry.rights_basis,
    word_count: entry.word_count ?? null,
    file_size_bytes: entry.file_size_bytes ?? null,
    checksum_sha256: entry.checksum_sha256 ?? null,
    cover_image_url: entry.cover_image_url ?? projectGutenbergCoverUrl(entry.source_url),
    cover_source_url: entry.cover_source_url ?? (entry.source_url.includes("gutenberg.org") ? entry.source_url : null),
    cover_rights_status: entry.cover_rights_status ?? (entry.source_url.includes("gutenberg.org") ? "Project Gutenberg hosted cover; use under source license/trademark terms." : "Generated fallback cover"),
    reading_time_minutes: entry.reading_time_minutes ?? (entry.word_count ? Math.max(1, Math.round(entry.word_count / 225)) : null),
    ocr_quality_score: entry.ocr_quality_score ?? null,
    ocr_quality_label: entry.ocr_quality_label ?? null,
    front_matter_cleanup_needed: entry.front_matter_cleanup_needed ?? null,
    safe_for_quotation: entry.safe_for_quotation ?? null,
    ocr_cleanup_notes: entry.ocr_cleanup_notes ?? null,
    cover_metadata: entry.cover_metadata ?? null,
    added_at: entry.import_status,
  };
}
