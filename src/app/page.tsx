"use client";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import {
  Bookmark,
  BookOpen,
  Brain,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  CheckCircle2,
  Download,
  Pause,
  Play,
  RotateCcw,
  Square,
  Trash2,
  Headphones,
  Highlighter,
  Home as HomeIcon,
  Library,
  ListMusic,
  Link,
  LogOut,
  MessageSquareText,
  Minus,
  NotebookPen,
  Plus,
  Search,
  Settings,
  Share2,
  Save,
  Star,
  Timer,
  Users,
  Volume2,
  X,
  MapPin,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import verses1769 from "es-kjv/json/verses-1769.js";
import { LIBRARY_CATEGORIES } from "@/lib/library-curation";
import tskPhase1Sample from "../../data/imports/tsk-phase-1-reviewed-sample.json";
import matthewHenryPhase1Commentary from "../../data/imports/matthew-henry-phase-1-commentary.json";
import hAIronsidePhase2Commentary from "../../data/imports/h-a-ironside-phase-2-commentary.json";

type Tab = "today" | "bible" | "search" | "notes" | "library" | "settings" | "fullStudy" | "personStudy" | "bookIntro";
type StudyDrawerTab = "study" | "actions" | "dictionary" | "occurrences" | "crossReferences" | "notes" | "audio" | "commentary" | "memory";
type StudyDrawerSize = "collapsed" | "half" | "full";
type TestamentFilter = "all" | "old" | "new";
type LibraryView = "home" | "detail" | "reader";
type LibraryReaderTheme = "light" | "sepia" | "dark";
type LibraryReadingWidth = "narrow" | "comfortable" | "wide";

type BibleVerse = {
  ref: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  plainText: string;
};

type UserNote = {
  id: string;
  verse_ref: string;
  body: string;
  created_at: string;
};

type UserHighlight = {
  id: string;
  verse_ref: string;
  color: string;
  created_at: string;
};

type UserBookmark = {
  id: string;
  verse_ref: string;
  created_at: string;
};

type SavedState = {
  notes: UserNote[];
  highlights: UserHighlight[];
  bookmarks: UserBookmark[];
};

type DictionaryEntry = {
  word: string;
  lookupWord: string;
  definition: string;
  found: boolean;
};

type DictionarySearchResult = {
  headword: string;
  normalized_headword: string;
  definition: string;
  source_title: string;
  source_line_start: number;
  source_line_end: number;
  review_status: string;
};

type CrossReference = {
  id: string;
  verse_ref: string;
  target_ref: string;
  label: string;
  source: string;
  source_id?: string | null;
  source_title?: string;
  source_url?: string;
  public_domain_status?: string;
  rights_basis?: string;
};

type TskCrossReferenceImportRow = {
  verse_ref: string;
  target_ref: string;
  label?: string;
  source: string;
  source_title: string;
  source_url: string;
  public_domain_status: string;
  rights_basis: string;
};

type CommentaryEntry = {
  id: string;
  reference?: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  author: string;
  resource_title: string;
  source_title?: string;
  entry_text: string;
  public_domain_status: string;
  rights_basis?: string;
  recommended_use?: string;
  source_url: string;
};

type LibraryResource = {
  slug: string;
  title: string;
  author: string;
  year: number;
  category: string;
  original_category?: string;
  description: string;
  public_domain_status: string;
  rights_status: string;
  commercial_use_status: string;
  doctrinal_review_status: string;
  perspective_notes: string;
  recommended_use: string;
  resource_labels: string[];
  resource_warnings: string[];
  source_url: string;
  source_license_url: string;
  rights_basis: string;
  word_count: number | null;
  file_size_bytes: number | null;
  checksum_sha256: string | null;
  added_at: string;
};

type LibraryProgress = {
  slug: string;
  title: string;
  author: string;
  progress: number;
  fontSize: number;
  lineSpacing: number;
  readingWidth: LibraryReadingWidth;
  theme: LibraryReaderTheme;
  bookmarks: number[];
  startedAt: string;
  updatedAt: string;
};

type LibraryProgressState = Record<string, LibraryProgress>;

type CompletedResource = {
  slug: string;
  title: string;
  author: string;
  completedAt: string;
};

type CompletedResourceState = Record<string, CompletedResource>;

type ListeningProgress = {
  slug: string;
  title: string;
  author: string;
  progress: number;
  rate: number;
  updatedAt: string;
};

type ListeningProgressState = Record<string, ListeningProgress>;

type LibraryAnnotationType = "highlight" | "note" | "bookmark";

type LibraryAnnotation = {
  id: string;
  resourceSlug: string;
  resourceTitle: string;
  type: LibraryAnnotationType;
  text: string;
  note?: string;
  location: number;
  createdAt: string;
};

type LibraryAnnotationState = Record<string, LibraryAnnotation[]>;

type TeachingWorkspaceSectionId = "summary" | "commentary" | "crossReferences" | "wordStudies" | "notes" | "lessonOutline";

type TeachingWorkspaceVisibility = Record<TeachingWorkspaceSectionId, boolean>;

type BibleListeningProgress = {
  targetId: string;
  label: string;
  book: string;
  chapter: number;
  verseRef: string | null;
  progress: number;
  updatedAt: string;
};

type BiblePlaylistItemType = "bible_chapter" | "bible_verse_range" | "commentary_placeholder" | "library_placeholder" | "notes_placeholder";

type BiblePlaylistItem = {
  id: string;
  type: BiblePlaylistItemType;
  label: string;
  book?: string;
  chapter?: number;
  verseStart?: number;
  verseEnd?: number;
  resourceTitle?: string;
};

type BibleAudioPlaylist = {
  id: string;
  name: string;
  items: BiblePlaylistItem[];
  createdAt: string;
};

type ScriptureMemoryItem = {
  id: string;
  verse_ref: string;
  verse_text: string;
  progress: number;
  repetitions: number;
  last_reviewed_at: string | null;
  created_at: string;
};

type ChapterStudyAnalysis = {
  repeatedWords: Array<{ word: string; count: number }>;
  repeatedPhrases: Array<{ phrase: string; count: number }>;
  stats: {
    verses: number;
    words: number;
    uniqueWords: number;
    averageWordsPerVerse: number;
  };
  mostReferencedVerses: Array<{ ref: string; count: number }>;
};

type WordExplorerResult = {
  word: string;
  lookupWord: string;
  definition: DictionaryEntry;
  chapterOccurrences: BibleVerse[];
  bookOccurrences: BibleVerse[];
  bibleOccurrences: BibleVerse[];
};

type TeachingNotesExportData = {
  book: string;
  chapter: number;
  bookIntroduction: BookIntroduction | null;
  keyVerses: string[];
  analysis: ChapterStudyAnalysis;
  connections: ActiveChapterConnections;
  crossReferences: CrossReference[];
  commentaryEntries: CommentaryEntry[];
  notes: Array<[string, UserNote[]]>;
  memoryVerse: ScriptureMemoryItem | null;
  fallbackMemoryVerse: BibleVerse;
  recommendedResources: ChapterResourceRecommendation[];
  versesByRef: Map<string, BibleVerse>;
};

type TeacherNotesDraft = {
  hook: string;
  mainPoints: string;
  illustrations: string;
  applications: string;
  closingThought: string;
};

type TeachingWorkspaceSummary = {
  passage: string;
  mainTheme: string;
  keyVerse: string;
  keyWords: string[];
  teachingAim: string;
  suggestedTitle: string;
};

type LessonOutlineSection = {
  title: string;
  lines: string[];
};

type StudyPerson = {
  id: string;
  name: string;
  summary: string;
  description: string;
  firstAppearance: string;
  majorPassages: string[];
  keyEvents: string[];
  lessonsLearned: string[];
  relatedVerses: string[];
};

type StudyPlace = {
  id: string;
  name: string;
  description: string;
  significance: string;
  keyPassages: string[];
  timelineLinks: string[];
  relatedPassages: string[];
  mapNote: string;
};

type StudyTimelineEntry = {
  id: string;
  era: "Patriarchs" | "Exodus" | "Kings" | "Christ" | "Church";
  title: string;
  timeframe: string;
  description: string;
  keyPassages: string[];
};

type ChristTypeConnection = {
  id: string;
  title: string;
  description: string;
  pointsToChrist: string;
  keyReferences: string[];
  fulfillmentReferences: string[];
};

type ProphecyConnection = {
  id: string;
  prophecy: string;
  fulfillment: string;
  description: string;
  relatedVerses: string[];
};

type ChapterConnections = {
  book: string;
  chapter: number;
  peopleIds: string[];
  placeIds: string[];
  timelineIds?: string[];
  typeIds: string[];
  prophecyIds: string[];
  themes: string[];
};

type ActiveChapterConnections = {
  people: StudyPerson[];
  places: StudyPlace[];
  timeline: StudyTimelineEntry[];
  types: ChristTypeConnection[];
  prophecies: ProphecyConnection[];
  themes: string[];
};

type BiblePassage = {
  id: string;
  book: string;
  chapter: number;
  verse?: number;
  label: string;
  updatedAt: string;
};

type BibleMarkerId = "A" | "B" | "C" | "D";
type BibleMarkers = Record<BibleMarkerId, BiblePassage | null>;

type ChapterResourceRecommendation = {
  id: string;
  kind: "Dictionary" | "Cross References" | "Commentary" | "Library Resource" | "Bible Handbook";
  title: string;
  author?: string;
  status: "available" | "sample" | "planned" | "rights review";
  note: string;
  resourceSlug?: string;
  warning?: string;
};

type BookIntroduction = {
  book: string;
  overview: {
    author: string;
    date: string;
    audience: string;
    theme: string;
    keyVerse: string;
    purpose: string;
  };
  outline: Array<{
    title: string;
    reference: string;
    summary: string;
  }>;
  keyPeople: string[];
  keyPlaces: string[];
  christInTheBook: string;
  memoryVerses: string[];
  recommendedResources: ChapterResourceRecommendation[];
  sourceNotes: string[];
};

type SpeechState = {
  targetId: string | null;
  label: string;
  playing: boolean;
  paused: boolean;
  progress: number;
  rate: number;
  sleepTimerMinutes: number | null;
  sleepTimerEndsAt: string | null;
};

const STORAGE_KEY = "fathers-business-bible-study-state";
const LIBRARY_PROGRESS_KEY = "fathers-business-library-progress";
const LIBRARY_COMPLETED_KEY = "fathers-business-library-completed";
const LIBRARY_LISTENING_KEY = "fathers-business-library-listening-progress";
const LIBRARY_ANNOTATIONS_KEY = "fathers-business-library-annotations";
const BIBLE_LISTENING_KEY = "fathers-business-bible-listening-progress";
const BIBLE_PLAYLISTS_KEY = "fathers-business-bible-audio-playlists";
const SCRIPTURE_MEMORY_KEY = "fathers-business-scripture-memory";
const RECENT_PASSAGES_KEY = "fathers-business-recent-passages";
const FAVORITE_PASSAGES_KEY = "fathers-business-favorite-passages";
const BIBLE_MARKERS_KEY = "fathers-business-bible-markers";
const TEACHER_NOTES_KEY = "fathers-business-teacher-notes";
const TEACHING_WORKSPACE_VISIBILITY_KEY = "fathers-business-teaching-workspace-visibility";
const LOCAL_SYNC_MESSAGE = "Saving locally until sync is available.";
const SYNC_ERROR_MESSAGE = "Could not sync yet. Your data is still saved on this device.";
const DEFAULT_BOOK = "John";
const DEFAULT_CHAPTER = 3;
const DEFAULT_VERSE = 16;
const RECENT_PASSAGE_LIMIT = 20;
const FAVORITE_PASSAGE_LIMIT = 24;
const BIBLE_MARKER_IDS: BibleMarkerId[] = ["A", "B", "C", "D"];
const MATTHEW_HENRY_COMMENTARY_COLLECTION = "Matthew Henry's Commentary on the Whole Bible";
const H_A_IRONSIDE_COMMENTARY_COLLECTION = "H. A. Ironside Commentary Samples";
const ACTIVE_COMMENTARY_COLLECTIONS = [MATTHEW_HENRY_COMMENTARY_COLLECTION, H_A_IRONSIDE_COMMENTARY_COLLECTION];

const DEFAULT_TEACHING_WORKSPACE_VISIBILITY: TeachingWorkspaceVisibility = {
  summary: true,
  commentary: true,
  crossReferences: true,
  wordStudies: true,
  notes: true,
  lessonOutline: true,
};

const EMPTY_TEACHER_NOTES: TeacherNotesDraft = {
  hook: "",
  mainPoints: "",
  illustrations: "",
  applications: "",
  closingThought: "",
};

const REVIEWED_TEACHING_SUMMARIES: Record<string, Omit<TeachingWorkspaceSummary, "passage" | "keyWords">> = {
  "John 3": {
    mainTheme: "The New Birth",
    keyVerse: "John 3:16",
    teachingAim: "Show that eternal life comes through believing on the Son of God.",
    suggestedTitle: "Ye Must Be Born Again",
  },
  "Romans 5": {
    mainTheme: "Peace With God Through Our Lord Jesus Christ",
    keyVerse: "Romans 5:8",
    teachingAim: "Show the fruit of justification and the grace of Christ that abounds over Adam's ruin.",
    suggestedTitle: "Peace, Grace, and the Gift by Christ",
  },
  "Luke 24": {
    mainTheme: "The Risen Christ Opens the Scriptures",
    keyVerse: "Luke 24:46",
    teachingAim: "Show that Christ's resurrection fulfills Scripture and sends His witnesses to preach repentance and remission of sins.",
    suggestedTitle: "The Scriptures Opened by the Risen Lord",
  },
};

const DEFAULT_FAVORITE_PASSAGES: BiblePassage[] = [
  createBiblePassage("John", 3),
  createBiblePassage("Luke", 24),
  createBiblePassage("Romans", 8),
];

const LIBRARY_CATEGORY_FILTERS = ["All", ...LIBRARY_CATEGORIES];

function chapterEssentials({
  book,
  chapter,
  commentary,
  libraryResources,
}: {
  book: string;
  chapter: number;
  commentary: ChapterResourceRecommendation;
  libraryResources: ChapterResourceRecommendation[];
}): ChapterResourceRecommendation[] {
  const key = `${book.toLowerCase().replaceAll(" ", "-")}-${chapter}`;
  return [
    {
      id: `${key}-webster-1828`,
      kind: "Dictionary",
      title: "Webster's 1828 Dictionary",
      status: "available",
      note: "First stop for KJV word meanings and older English usage.",
    },
    {
      id: `${key}-easton`,
      kind: "Dictionary",
      title: "Easton's Bible Dictionary",
      author: "M. G. Easton",
      status: "planned",
      note: "Public-domain dictionary candidate for Bible names, places, and themes after import review.",
    },
    {
      id: `${key}-smith`,
      kind: "Dictionary",
      title: "Smith's Bible Dictionary",
      author: "William Smith",
      status: "planned",
      note: "Public-domain dictionary candidate for historical and geographical background after import review.",
    },
    {
      id: `${key}-nave`,
      kind: "Dictionary",
      title: "Nave's Topical Bible",
      author: "Orville J. Nave",
      status: "planned",
      note: "Topical Bible candidate for tracing related subjects after source and edition review.",
    },
    {
      id: `${key}-tsk`,
      kind: "Cross References",
      title: "Treasury of Scripture Knowledge",
      status: "sample",
      note: "Cross-reference structure is ready; reviewed samples display before full TSK import.",
    },
    {
      id: `${key}-halley`,
      kind: "Bible Handbook",
      title: "Halley's Bible Handbook",
      author: "Henry H. Halley",
      status: "rights review",
      note: "Useful handbook candidate, but do not import until edition, copyright, and commercial-use rights are verified.",
      warning: "Use with discernment",
    },
    {
      id: `${key}-unger`,
      kind: "Bible Handbook",
      title: "Unger's Bible Handbook",
      author: "Merrill F. Unger",
      status: "rights review",
      note: "Modern handbook candidate for comparison only; do not import unless rights permit.",
      warning: "Use with discernment",
    },
    commentary,
    ...libraryResources,
  ];
}

function chapterRecommendations(
  book: string,
  chapters: number[],
  options: {
    commentaryForChapter: (chapter: number) => ChapterResourceRecommendation;
    libraryForChapter: (chapter: number) => ChapterResourceRecommendation[];
  },
) {
  return chapters.map((chapter) => ({
    book,
    chapter,
    recommendations: chapterEssentials({
      book,
      chapter,
      commentary: options.commentaryForChapter(chapter),
      libraryResources: options.libraryForChapter(chapter),
    }),
  }));
}

const DEFAULT_CHAPTER_RESOURCE_RECOMMENDATIONS: ChapterResourceRecommendation[] = [
  {
    id: "default-webster-1828",
    kind: "Dictionary",
    title: "Webster's 1828 Dictionary",
    status: "available",
    note: "Best first stop for KJV word meanings and older English usage.",
  },
  {
    id: "default-tsk",
    kind: "Cross References",
    title: "Treasury of Scripture Knowledge",
    status: "sample",
    note: "Cross-reference structure is ready; reviewed samples are shown before full import.",
  },
  {
    id: "default-handbook",
    kind: "Bible Handbook",
    title: "Bible Handbook",
    status: "planned",
    note: "Reserved for a verified public-domain handbook after rights review.",
  },
];

const CHAPTER_RESOURCE_RECOMMENDATIONS: Array<{
  book: string;
  chapter: number;
  recommendations: ChapterResourceRecommendation[];
}> = [
  ...chapterRecommendations("Genesis", [1, 2, 3, 4, 5], {
    commentaryForChapter: (chapter) => ({
      id: `genesis-${chapter}-commentary`,
      kind: "Commentary",
      title: MATTHEW_HENRY_COMMENTARY_COLLECTION,
      author: "Matthew Henry",
      status: "available",
      note: "Reviewed Phase 1 public-domain commentary entry for creation, fall, promise, and early history.",
      warning: "Use with discernment",
    }),
    libraryForChapter: (chapter) => [
      {
        id: `genesis-${chapter}-pink-gleanings`,
        kind: "Library Resource",
        title: "Gleanings in Genesis",
        author: "A. W. Pink",
        status: "rights review",
        note: "Genesis study candidate; do not import until exact edition and rights are verified.",
        warning: "Not all doctrine endorsed",
      },
      {
        id: `genesis-${chapter}-bunyan-classics`,
        kind: "Library Resource",
        title: "The Pilgrim's Progress",
        author: "John Bunyan",
        status: "available",
        note: "Devotional classic for illustrating sin, conviction, and pilgrimage themes.",
        resourceSlug: "pilgrims-progress",
      },
    ],
  }),
  ...chapterRecommendations("Exodus", [1, 2, 3, 4, 5], {
    commentaryForChapter: (chapter) => ({
      id: `exodus-${chapter}-commentary`,
      kind: "Commentary",
      title: MATTHEW_HENRY_COMMENTARY_COLLECTION,
      author: "Matthew Henry",
      status: "available",
      note: "Reviewed Phase 1 public-domain commentary entry for bondage, deliverance, calling, and the Exodus story.",
      warning: "Use with discernment",
    }),
    libraryForChapter: (chapter) => [
      {
        id: `exodus-${chapter}-bounds-prayer`,
        kind: "Library Resource",
        title: "Power Through Prayer",
        author: "E. M. Bounds",
        status: "available",
        note: "Helpful devotional reading for Moses' burden, ministry calling, and dependence on God.",
        resourceSlug: "power-through-prayer",
      },
      {
        id: `exodus-${chapter}-missions`,
        kind: "Library Resource",
        title: "A Retrospect",
        author: "James Hudson Taylor",
        status: "available",
        note: "Missionary biography for lessons on calling, obedience, and faith under pressure.",
        resourceSlug: "a-retrospect",
      },
    ],
  }),
  ...chapterRecommendations("John", [1, 2, 3, 4, 5], {
    commentaryForChapter: (chapter) => ({
      id: `john-${chapter}-matthew-henry-commentary`,
      kind: "Commentary",
      title: MATTHEW_HENRY_COMMENTARY_COLLECTION,
      author: "Matthew Henry",
      status: "available",
      note: "Reviewed Phase 1 public-domain commentary entry for John's Gospel.",
      warning: "Use with discernment",
    }),
    libraryForChapter: (chapter) => [
      ...(chapter === 3
        ? [
            {
              id: "john-3-h-a-ironside-commentary",
              kind: "Commentary" as const,
              title: H_A_IRONSIDE_COMMENTARY_COLLECTION,
              author: "H. A. Ironside",
              status: "sample" as const,
              note: "Reviewed Phase 2 sample summary from Addresses on the Gospel of John. Full-text import waits for renewal and edition audit.",
              warning: "Use with discernment",
            },
          ]
        : []),
      {
        id: `john-${chapter}-spurgeon-gospel`,
        kind: "Library Resource",
        title: "Around the Wicket Gate",
        author: "C. H. Spurgeon",
        status: "available",
        note: "Helpful gospel-focused reading alongside John’s witness to Christ.",
        resourceSlug: "around-the-wicket-gate",
        warning: "Use with discernment",
      },
      {
        id: `john-${chapter}-torrey-holy-spirit`,
        kind: "Library Resource",
        title: "The Person and Work of The Holy Spirit",
        author: "R. A. Torrey",
        status: "available",
        note: "Supplemental study for John’s emphasis on witness, new birth, and spiritual life.",
        resourceSlug: "the-person-and-work-of-the-holy-spirit",
      },
    ],
  }),
  {
    book: "Luke",
    chapter: 24,
    recommendations: chapterEssentials({
      book: "Luke",
      chapter: 24,
      commentary: {
        id: "luke-24-matthew-henry-commentary",
        kind: "Commentary",
        title: MATTHEW_HENRY_COMMENTARY_COLLECTION,
        author: "Matthew Henry",
        status: "available",
        note: "Reviewed Phase 1 public-domain commentary entry for resurrection and Great Commission teaching.",
        warning: "Use with discernment",
      },
      libraryResources: [
        {
          id: "luke-24-h-a-ironside-commentary",
          kind: "Commentary",
          title: H_A_IRONSIDE_COMMENTARY_COLLECTION,
          author: "H. A. Ironside",
          status: "sample",
          note: "Reviewed Phase 2 sample summary from Addresses on the Gospel of Luke. Full-text import waits for renewal and edition audit.",
          warning: "Use with discernment",
        },
        {
          id: "luke-24-moody-evangelism",
          kind: "Library Resource",
          title: "To the Work! To the Work!",
          author: "D. L. Moody",
          status: "planned",
          note: "Evangelism and service classic candidate for Luke 24 witness and gospel work.",
        },
        {
          id: "luke-24-torrey-evangelism",
          kind: "Library Resource",
          title: "How to Bring Men to Christ",
          author: "R. A. Torrey",
          status: "available",
          note: "Practical evangelism help for teaching repentance, witness, and gospel response.",
          resourceSlug: "how-to-bring-men-to-christ",
        },
      ],
    }),
  },
  ...chapterRecommendations("Romans", [1, 2, 3, 4, 5, 6, 7, 8], {
    commentaryForChapter: (chapter) => ({
      id: `romans-${chapter}-matthew-henry-commentary`,
      kind: "Commentary",
      title: MATTHEW_HENRY_COMMENTARY_COLLECTION,
      author: "Matthew Henry",
      status: "available",
      note: "Reviewed Phase 1 public-domain commentary entry for Romans doctrine and Christian life.",
      warning: "Use with discernment",
    }),
    libraryForChapter: (chapter) => [
      ...(chapter === 5
        ? [
            {
              id: "romans-5-h-a-ironside-commentary",
              kind: "Commentary" as const,
              title: H_A_IRONSIDE_COMMENTARY_COLLECTION,
              author: "H. A. Ironside",
              status: "sample" as const,
              note: "Reviewed Phase 2 sample summary from Lectures on the Epistle to the Romans, first edition 1928.",
              warning: "Use with discernment",
            },
          ]
        : []),
      {
        id: `romans-${chapter}-torrey-doctrines`,
        kind: "Library Resource",
        title: "The Fundamental Doctrines of the Christian Faith",
        author: "R. A. Torrey",
        status: "available",
        note: "Doctrinal survey help for Romans themes after reading the Bible text first.",
        resourceSlug: "the-fundamental-doctrines-of-the-christian-faith",
      },
      ...(chapter === 8
        ? [
            {
              id: "romans-8-torrey-holy-spirit",
              kind: "Library Resource" as const,
              title: "The Person and Work of The Holy Spirit",
              author: "R. A. Torrey",
              status: "available" as const,
              note: "Supplemental study help for the Spirit-focused language in Romans 8.",
              resourceSlug: "the-person-and-work-of-the-holy-spirit",
            },
          ]
        : []),
    ],
  }),
];

const bookIntroductions: BookIntroduction[] = [
  {
    book: "Genesis",
    overview: {
      author: "Moses",
      date: "Traditionally placed during the wilderness years after the Exodus.",
      audience: "Israel, learning the beginnings of creation, sin, judgment, nations, and covenant promise.",
      theme: "Beginnings: creation, the fall, judgment, promise, and God's covenant dealings.",
      keyVerse: "Genesis 1:1",
      purpose:
        "To show God as Creator, explain sin's entrance into the world, and trace the covenant promises that lead toward Israel and Christ.",
    },
    outline: [
      { title: "Creation and the first home", reference: "Genesis 1-2", summary: "God creates all things and places man in Eden." },
      { title: "Fall and early judgment", reference: "Genesis 3-5", summary: "Sin enters, judgment follows, and the need for redemption is shown." },
      { title: "Flood and nations", reference: "Genesis 6-11", summary: "God judges the old world, preserves Noah, and scatters the nations." },
      { title: "Abraham and covenant promise", reference: "Genesis 12-25", summary: "God calls Abraham and gives promises of seed, land, and blessing." },
      { title: "Isaac, Jacob, and Joseph", reference: "Genesis 26-50", summary: "God preserves the chosen family and moves them into Egypt." },
    ],
    keyPeople: ["Adam", "Eve", "Noah", "Abraham", "Isaac", "Jacob", "Joseph"],
    keyPlaces: ["Eden", "Babel", "Canaan", "Egypt"],
    christInTheBook:
      "Genesis points to Christ through the promised seed in Genesis 3:15, the ark as safety from judgment, Isaac as the beloved son offered, and Joseph as the rejected and exalted deliverer.",
    memoryVerses: ["Genesis 1:1", "Genesis 3:15", "Genesis 12:3", "Genesis 50:20"],
    recommendedResources: [
      {
        id: "genesis-intro-matthew-henry",
        kind: "Commentary",
        title: MATTHEW_HENRY_COMMENTARY_COLLECTION,
        author: "Matthew Henry",
        status: "available",
        note: "Reviewed Phase 1 commentary entries for Genesis 1-5.",
        warning: "Use with discernment",
      },
      {
        id: "genesis-intro-easton",
        kind: "Dictionary",
        title: "Easton's Bible Dictionary",
        author: "M. G. Easton",
        status: "available",
        note: "Good quick lookup for people, places, and themes in Genesis.",
        resourceSlug: "eastons-bible-dictionary",
      },
      {
        id: "genesis-intro-smith",
        kind: "Dictionary",
        title: "Smith's Comprehensive Dictionary of the Bible",
        author: "William Smith",
        status: "available",
        note: "Helpful background entries for Old Testament names and places.",
        resourceSlug: "smiths-comprehensive-dictionary-of-the-bible",
      },
      {
        id: "genesis-intro-nave",
        kind: "Library Resource",
        title: "Nave's Topical Bible",
        author: "Orville J. Nave",
        status: "available",
        note: "Useful for tracing creation, covenant, faith, and promise themes.",
        resourceSlug: "naves-topical-bible",
      },
      {
        id: "genesis-intro-bunyan",
        kind: "Library Resource",
        title: "The Pilgrim's Progress",
        author: "John Bunyan",
        status: "available",
        note: "Devotional classic for illustrating sin, conviction, pilgrimage, and perseverance.",
        resourceSlug: "pilgrims-progress",
        warning: "Devotional classic",
      },
    ],
    sourceNotes: [
      "Reviewed summary based on the KJV book content and public-domain handbook/survey style.",
      "Future direct handbook quotations should be imported only after source and rights verification.",
    ],
  },
  {
    book: "Exodus",
    overview: {
      author: "Moses",
      date: "Traditionally placed during the wilderness years after Israel's deliverance from Egypt.",
      audience: "Israel, learning the record of deliverance, covenant, worship, and God's presence among His people.",
      theme: "Redemption, deliverance, law, worship, and the dwelling place of God.",
      keyVerse: "Exodus 12:13",
      purpose:
        "To show the LORD redeeming Israel from bondage, making covenant with them, and giving the tabernacle pattern for worship and approach.",
    },
    outline: [
      { title: "Israel in bondage", reference: "Exodus 1-2", summary: "Israel suffers in Egypt while God preserves Moses." },
      { title: "The call of Moses", reference: "Exodus 3-4", summary: "God calls Moses at the burning bush and sends him to Pharaoh." },
      { title: "Plagues and Passover", reference: "Exodus 5-13", summary: "God judges Egypt and redeems Israel by blood and power." },
      { title: "Red Sea and wilderness", reference: "Exodus 14-18", summary: "God delivers, guides, feeds, and protects His people." },
      { title: "Law, covenant, and tabernacle", reference: "Exodus 19-40", summary: "God gives His law and the pattern for dwelling among Israel." },
    ],
    keyPeople: ["Moses", "Aaron", "Pharaoh", "Miriam", "Joshua"],
    keyPlaces: ["Egypt", "Goshen", "Red Sea", "Sinai"],
    christInTheBook:
      "Exodus points to Christ through the Passover lamb, manna, the smitten rock, the mediator work of Moses, and the tabernacle as God's way of approach.",
    memoryVerses: ["Exodus 3:14", "Exodus 12:13", "Exodus 14:13", "Exodus 20:2"],
    recommendedResources: [
      {
        id: "exodus-intro-matthew-henry",
        kind: "Commentary",
        title: MATTHEW_HENRY_COMMENTARY_COLLECTION,
        author: "Matthew Henry",
        status: "available",
        note: "Reviewed Phase 1 commentary entries for Exodus 1-5.",
        warning: "Use with discernment",
      },
      {
        id: "exodus-intro-easton",
        kind: "Dictionary",
        title: "Easton's Bible Dictionary",
        author: "M. G. Easton",
        status: "available",
        note: "Quick help for Moses, Aaron, Pharaoh, Egypt, and wilderness places.",
        resourceSlug: "eastons-bible-dictionary",
      },
      {
        id: "exodus-intro-smith",
        kind: "Dictionary",
        title: "Smith's Comprehensive Dictionary of the Bible",
        author: "William Smith",
        status: "available",
        note: "Helpful entries for tabernacle, priesthood, and Exodus geography.",
        resourceSlug: "smiths-comprehensive-dictionary-of-the-bible",
      },
      {
        id: "exodus-intro-bounds",
        kind: "Library Resource",
        title: "Power Through Prayer",
        author: "E. M. Bounds",
        status: "available",
        note: "Devotional support for ministry burden, dependence on God, and spiritual leadership.",
        resourceSlug: "power-through-prayer",
      },
      {
        id: "exodus-intro-taylor",
        kind: "Library Resource",
        title: "A Retrospect",
        author: "James Hudson Taylor",
        status: "available",
        note: "Missionary biography for faith, calling, obedience, and trust under pressure.",
        resourceSlug: "a-retrospect",
        warning: "Historical value",
      },
    ],
    sourceNotes: [
      "Reviewed summary based on the KJV book content and public-domain handbook/survey style.",
      "Future direct handbook quotations should be imported only after source and rights verification.",
    ],
  },
  {
    book: "John",
    overview: {
      author: "John the apostle",
      date: "Commonly placed late in the first century.",
      audience: "Believers and unbelievers considering who Jesus Christ is.",
      theme: "Jesus Christ, the Son of God, and life through believing on Him.",
      keyVerse: "John 20:31",
      purpose:
        "To present the signs, words, death, and resurrection of Christ so readers might believe and have life through His name.",
    },
    outline: [
      { title: "The Word made flesh", reference: "John 1:1-18", summary: "John opens with Christ's deity, incarnation, and glory." },
      { title: "Witness and public ministry", reference: "John 1:19-12:50", summary: "John records signs, conversations, and public testimony concerning Christ." },
      { title: "Upper room and prayer", reference: "John 13-17", summary: "Christ teaches His own before the cross and prays for them." },
      { title: "Passion and resurrection", reference: "John 18-21", summary: "Christ is crucified, risen, and revealed to His disciples." },
    ],
    keyPeople: ["Jesus", "John the Baptist", "Nicodemus", "The Samaritan woman", "Mary", "Martha", "Lazarus", "Thomas"],
    keyPlaces: ["Jerusalem", "Galilee", "Jordan River", "Bethany", "Samaria"],
    christInTheBook:
      "John presents Christ as the Word, the Lamb of God, the only begotten Son, the bread of life, the light of the world, the good shepherd, the resurrection and the life, the way, the truth, and the life, and the true vine.",
    memoryVerses: ["John 1:1", "John 1:14", "John 3:16", "John 14:6", "John 20:31"],
    recommendedResources: [
      {
        id: "john-intro-matthew-henry",
        kind: "Commentary",
        title: MATTHEW_HENRY_COMMENTARY_COLLECTION,
        author: "Matthew Henry",
        status: "available",
        note: "Reviewed Phase 1 commentary entries for John 1-5.",
        warning: "Use with discernment",
      },
      {
        id: "john-intro-h-a-ironside",
        kind: "Commentary",
        title: H_A_IRONSIDE_COMMENTARY_COLLECTION,
        author: "H. A. Ironside",
        status: "sample",
        note: "Phase 2 reviewed sample for John 3; full-text John import waits for renewal and edition audit.",
        warning: "Use with discernment",
      },
      {
        id: "john-intro-easton",
        kind: "Dictionary",
        title: "Easton's Bible Dictionary",
        author: "M. G. Easton",
        status: "available",
        note: "Quick lookup for John, Nicodemus, places, and Gospel terms.",
        resourceSlug: "eastons-bible-dictionary",
      },
      {
        id: "john-intro-nave",
        kind: "Library Resource",
        title: "Nave's Topical Bible",
        author: "Orville J. Nave",
        status: "available",
        note: "Trace topics like believe, life, light, witness, love, and truth.",
        resourceSlug: "naves-topical-bible",
      },
      {
        id: "john-intro-spurgeon",
        kind: "Library Resource",
        title: "Around the Wicket Gate",
        author: "C. H. Spurgeon",
        status: "available",
        note: "Gospel-focused help for John passages on believing and coming to Christ.",
        resourceSlug: "around-the-wicket-gate",
        warning: "Use with discernment",
      },
      {
        id: "john-intro-moody",
        kind: "Library Resource",
        title: "The Way to God",
        author: "D. L. Moody",
        status: "available",
        note: "Evangelistic companion reading for John's emphasis on life through Christ.",
        resourceSlug: "the-way-to-god",
      },
    ],
    sourceNotes: [
      "Reviewed summary based on the KJV book content and public-domain handbook/survey style.",
      "John 20:31 gives the stated purpose of the book.",
    ],
  },
  {
    book: "Romans",
    overview: {
      author: "Paul",
      date: "Commonly placed around AD 57, before Paul's arrival at Rome.",
      audience: "The saints at Rome and all who need the ordered doctrine of the gospel.",
      theme: "The gospel of God, righteousness by faith, and life in Christ.",
      keyVerse: "Romans 1:16",
      purpose:
        "To unfold man's guilt, God's righteousness, justification by faith, life in the Spirit, God's purposes, and practical Christian living.",
    },
    outline: [
      { title: "Need of righteousness", reference: "Romans 1-3", summary: "All are shown guilty before God." },
      { title: "Justification by faith", reference: "Romans 3-5", summary: "God justifies through faith apart from works of the law." },
      { title: "Life in Christ and the Spirit", reference: "Romans 6-8", summary: "Believers are taught union with Christ, deliverance, and no condemnation." },
      { title: "Israel and God's purposes", reference: "Romans 9-11", summary: "Paul explains Israel, promise, mercy, and God's wisdom." },
      { title: "Practical Christian living", reference: "Romans 12-16", summary: "Doctrine turns into service, love, submission, and fellowship." },
    ],
    keyPeople: ["Paul", "Phoebe", "Abraham", "Adam", "Christ", "Israel"],
    keyPlaces: ["Rome", "Cenchrea"],
    christInTheBook:
      "Romans presents Christ as the propitiation, the risen Lord, the last Adam's answer to man's ruin, the One in whom there is no condemnation, and the interceding Lord from whom nothing can separate believers.",
    memoryVerses: ["Romans 1:16", "Romans 3:23", "Romans 5:8", "Romans 8:1", "Romans 12:1"],
    recommendedResources: [
      {
        id: "romans-intro-matthew-henry",
        kind: "Commentary",
        title: MATTHEW_HENRY_COMMENTARY_COLLECTION,
        author: "Matthew Henry",
        status: "available",
        note: "Reviewed Phase 1 commentary entries for Romans 1-8.",
        warning: "Use with discernment",
      },
      {
        id: "romans-intro-h-a-ironside",
        kind: "Commentary",
        title: H_A_IRONSIDE_COMMENTARY_COLLECTION,
        author: "H. A. Ironside",
        status: "sample",
        note: "Phase 2 reviewed sample for Romans 5 from a 1928 first edition source.",
        warning: "Use with discernment",
      },
      {
        id: "romans-intro-easton",
        kind: "Dictionary",
        title: "Easton's Bible Dictionary",
        author: "M. G. Easton",
        status: "available",
        note: "Quick help for people, places, and doctrinal terms.",
        resourceSlug: "eastons-bible-dictionary",
      },
      {
        id: "romans-intro-torrey-doctrines",
        kind: "Library Resource",
        title: "The Fundamental Doctrines of the Christian Faith",
        author: "R. A. Torrey",
        status: "available",
        note: "Doctrinal survey help after reading Romans in the KJV.",
        resourceSlug: "the-fundamental-doctrines-of-the-christian-faith",
      },
      {
        id: "romans-intro-torrey-spirit",
        kind: "Library Resource",
        title: "The Person and Work of The Holy Spirit",
        author: "R. A. Torrey",
        status: "available",
        note: "Companion resource for Romans 8 and the work of the Spirit.",
        resourceSlug: "the-person-and-work-of-the-holy-spirit",
      },
      {
        id: "romans-intro-moody",
        kind: "Library Resource",
        title: "Secret Power",
        author: "D. L. Moody",
        status: "available",
        note: "Practical devotional help for Christian life and service.",
        resourceSlug: "secret-power",
      },
    ],
    sourceNotes: [
      "Reviewed summary based on the KJV book content and public-domain handbook/survey style.",
      "Future Romans commentary imports should remain marked rights review until the exact edition is verified.",
    ],
  },
  {
    book: "Luke",
    overview: {
      author: "Luke",
      date: "Commonly placed in the AD 60s.",
      audience: "Theophilus and wider readers needing an orderly account of Christ.",
      theme: "The Son of man came to seek and to save that which was lost.",
      keyVerse: "Luke 19:10",
      purpose:
        "To give an orderly account of Christ's birth, ministry, compassion, death, resurrection, and commission to preach repentance and remission of sins.",
    },
    outline: [
      { title: "Birth and preparation", reference: "Luke 1-3", summary: "Luke records the births, early witness, and preparation for ministry." },
      { title: "Galilean ministry", reference: "Luke 4-9", summary: "Christ preaches, heals, calls disciples, and reveals His authority." },
      { title: "Journey toward Jerusalem", reference: "Luke 9-19", summary: "Christ teaches discipleship, mercy, repentance, and kingdom truth." },
      { title: "Passion and resurrection", reference: "Luke 19-24", summary: "Christ enters Jerusalem, dies, rises, opens Scripture, and sends witnesses." },
    ],
    keyPeople: ["Jesus", "Mary", "Zacharias", "Elisabeth", "John the Baptist", "Peter", "Herod", "Pilate", "Theophilus"],
    keyPlaces: ["Jerusalem", "Bethlehem", "Nazareth", "Galilee", "Jericho", "Emmaus"],
    christInTheBook:
      "Luke presents Christ as the Saviour, the Son of man, the compassionate seeker of sinners, the suffering Lord, and the risen Christ who opens the Scriptures.",
    memoryVerses: ["Luke 2:11", "Luke 9:23", "Luke 19:10", "Luke 24:46", "Luke 24:47"],
    recommendedResources: [
      {
        id: "luke-intro-matthew-henry",
        kind: "Commentary",
        title: MATTHEW_HENRY_COMMENTARY_COLLECTION,
        author: "Matthew Henry",
        status: "available",
        note: "Reviewed Phase 1 commentary entry for Luke 24.",
        warning: "Use with discernment",
      },
      {
        id: "luke-intro-h-a-ironside",
        kind: "Commentary",
        title: H_A_IRONSIDE_COMMENTARY_COLLECTION,
        author: "H. A. Ironside",
        status: "sample",
        note: "Phase 2 reviewed sample for Luke 24; full-text Luke import waits for renewal and edition audit.",
        warning: "Use with discernment",
      },
      {
        id: "luke-intro-easton",
        kind: "Dictionary",
        title: "Easton's Bible Dictionary",
        author: "M. G. Easton",
        status: "available",
        note: "Quick lookup for Luke's people, places, and Gospel terms.",
        resourceSlug: "eastons-bible-dictionary",
      },
      {
        id: "luke-intro-way-to-god",
        kind: "Library Resource",
        title: "The Way to God",
        author: "D. L. Moody",
        status: "available",
        note: "Evangelistic companion reading for salvation and gospel invitation.",
        resourceSlug: "the-way-to-god",
      },
      {
        id: "luke-intro-evangelism",
        kind: "Library Resource",
        title: "How to Bring Men to Christ",
        author: "R. A. Torrey",
        status: "available",
        note: "Practical help for Luke 24 witness and teaching the gospel clearly.",
        resourceSlug: "how-to-bring-men-to-christ",
      },
      {
        id: "luke-intro-ryle",
        kind: "Library Resource",
        title: "Practical Religion",
        author: "J. C. Ryle",
        status: "available",
        note: "Christian life reading that pairs well with Luke's discipleship emphasis.",
        resourceSlug: "practical-religion",
        warning: "Use with discernment",
      },
    ],
    sourceNotes: [
      "Reviewed summary based on the KJV book content and public-domain handbook/survey style.",
      "Luke 1:1-4 explains the orderly-account purpose of the book.",
    ],
  },
];

const dictionaryEntries: Record<string, Omit<DictionaryEntry, "lookupWord" | "found">> = {
  believe: {
    word: "believe",
    definition:
      "To credit upon the authority or testimony of another; to be persuaded of the truth of something. In Scripture use, to trust in Christ.",
  },
  beloved: {
    word: "beloved",
    definition:
      "Greatly loved; dear to the heart.",
  },
  love: {
    word: "love",
    definition:
      "To regard with affection; to delight in; benevolence, good will, and kindness.",
  },
  loved: {
    word: "loved",
    definition:
      "Regarded with affection; held dear; treated with benevolence, kindness, or favor.",
  },
  world: {
    word: "world",
    definition:
      "The earth and its inhabitants; mankind; the present state of things.",
  },
  begotten: {
    word: "begotten",
    definition:
      "Generated; procreated. Used of relation and sonship.",
  },
  perish: {
    word: "perish",
    definition:
      "To die; to be destroyed; to decay and come to nothing; to be lost.",
  },
  everlasting: {
    word: "everlasting",
    definition:
      "Lasting or enduring for ever; eternal; existing without end.",
  },
  life: {
    word: "life",
    definition:
      "The state of being in which the soul and body are united; also spiritual existence and blessedness in God.",
  },
  light: {
    word: "light",
    definition:
      "That ethereal agent or matter which makes objects perceptible to the eye; in Scripture, knowledge, purity, joy, and divine truth.",
  },
  truth: {
    word: "truth",
    definition:
      "Conformity to fact or reality; exact accordance with that which is, has been, or shall be.",
  },
  grace: {
    word: "grace",
    definition:
      "Favor; good will; kindness; in theology, the free unmerited love and favor of God.",
  },
  faith: {
    word: "faith",
    definition:
      "Belief; assent of the mind to the truth of what is declared by another; evangelical trust in Christ.",
  },
  condemned: {
    word: "condemned",
    definition:
      "Judged or pronounced to be wrong, guilty, or worthy of punishment; sentenced; disapproved.",
  },
  saved: {
    word: "saved",
    definition:
      "Preserved from danger or destruction; delivered from the power and consequences of sin.",
  },
  repentance: {
    word: "repentance",
    definition:
      "Sorrow for any thing done or said; in theology, sorrow for sin with a sincere turning from it unto God.",
  },
  charity: {
    word: "charity",
    definition:
      "Love; benevolence; good will. In Scripture, supreme love to God and good will to men.",
  },
  do: {
    word: "do",
    definition:
      "To perform; to execute; to act; to bring to pass. In Scripture, often used of obedience, practice, or continued action.",
  },
};

const dictionaryAliases: Record<string, string> = {
  believest: "believe",
  believeth: "believe",
  believed: "believe",
  believing: "believe",
  condemned: "condemned",
  condemneth: "condemned",
  condemnation: "condemned",
  saved: "saved",
  saveth: "saved",
  repentance: "repentance",
  repent: "repentance",
  charity: "charity",
  did: "do",
  doeth: "do",
  doth: "do",
  done: "do",
  doing: "do",
  loveth: "love",
  loved: "love",
  lovedst: "love",
  worlds: "world",
};

const studyStopWords = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "are",
  "because",
  "been",
  "before",
  "being",
  "but",
  "came",
  "come",
  "did",
  "for",
  "from",
  "had",
  "hath",
  "have",
  "her",
  "him",
  "his",
  "into",
  "not",
  "now",
  "said",
  "shall",
  "that",
  "the",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "thou",
  "thy",
  "unto",
  "upon",
  "was",
  "were",
  "when",
  "which",
  "will",
  "with",
  "you",
  "your",
]);

function referenceImportId(row: TskCrossReferenceImportRow) {
  return `tsk-${row.verse_ref}-${row.target_ref}-${row.source}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const localCrossReferences: CrossReference[] = (tskPhase1Sample as TskCrossReferenceImportRow[]).map((row) => ({
  id: referenceImportId(row),
  verse_ref: row.verse_ref,
  target_ref: row.target_ref,
  label: row.label ?? "",
  source: row.source,
  source_title: row.source_title,
  source_url: row.source_url,
  public_domain_status: row.public_domain_status,
  rights_basis: row.rights_basis,
}));

const localCommentaryEntries: CommentaryEntry[] = [
  ...(matthewHenryPhase1Commentary as CommentaryEntry[]),
  ...(hAIronsidePhase2Commentary as CommentaryEntry[]),
].map((entry) => ({
  ...entry,
  source_title: entry.source_title ?? entry.resource_title,
}));

const studyPeople: StudyPerson[] = [
  {
    id: "jesus",
    name: "Jesus",
    summary: "The Son of God and Saviour, central to all Scripture.",
    description:
      "The Son of God and Saviour. In John 3 He teaches Nicodemus about the new birth, faith, and everlasting life.",
    firstAppearance: "Matthew 1:1",
    majorPassages: ["John 1", "John 3", "John 19", "John 20"],
    keyEvents: ["Teaches Nicodemus", "Speaks of being lifted up", "Reveals God's love in giving His only begotten Son"],
    lessonsLearned: ["Salvation is of God", "The new birth is necessary", "Christ is the true object of faith"],
    relatedVerses: ["John 3:3", "John 3:14", "John 3:16", "John 3:17"],
  },
  {
    id: "nicodemus",
    name: "Nicodemus",
    summary: "A ruler of the Jews who came to Jesus and heard the Lord's teaching on the new birth.",
    description:
      "A ruler of the Jews who came to Jesus by night and heard the Lord's teaching on being born again.",
    firstAppearance: "John 3:1",
    majorPassages: ["John 3", "John 7", "John 19"],
    keyEvents: ["Comes to Jesus by night", "Asks about the new birth", "Later speaks cautiously for just judgment", "Helps with the burial of Jesus"],
    lessonsLearned: ["Religious standing does not replace the new birth", "Honest questions should be brought to Christ", "Faith may grow from private inquiry to public identification"],
    relatedVerses: ["John 3:1", "John 3:4", "John 7:50", "John 19:39"],
  },
  {
    id: "john-baptist",
    name: "John the Baptist",
    summary: "The forerunner of Christ who bore witness that Jesus is the Lamb of God.",
    description:
      "The forerunner who bore witness to Christ. John 3 records his joy that Christ must increase.",
    firstAppearance: "Matthew 3:1",
    majorPassages: ["Matthew 3", "John 1", "John 3"],
    keyEvents: ["Preaches repentance", "Baptizes in Jordan", "Bears witness that Jesus is the Christ", "Says Christ must increase"],
    lessonsLearned: ["A faithful servant points away from himself to Christ", "Repentance prepares the heart to receive truth", "Christ must increase"],
    relatedVerses: ["John 1:6", "John 1:29", "John 3:27", "John 3:30"],
  },
  {
    id: "moses",
    name: "Moses",
    summary: "The prophet and leader used of God to deliver Israel and give the law.",
    description:
      "The prophet and leader of Israel. John 3 refers to Moses lifting up the serpent in the wilderness.",
    firstAppearance: "Exodus 2:1",
    majorPassages: ["Exodus 2", "Exodus 12", "Numbers 21", "Deuteronomy 18"],
    keyEvents: ["Delivered Israel from Egypt", "Received the law", "Lifted up the brazen serpent in the wilderness"],
    lessonsLearned: ["God can prepare a servant over many years", "Faith obeys even when the task is heavy", "The law points forward to the need for Christ"],
    relatedVerses: ["Numbers 21:8", "Numbers 21:9", "Deuteronomy 18:15", "John 3:14"],
  },
  {
    id: "abraham",
    name: "Abraham",
    summary: "The father of the faithful, called out by God and given covenant promises.",
    description:
      "Abraham believed God and was called to walk by faith. His offering of Isaac is a major passage for promise, obedience, and sacrifice.",
    firstAppearance: "Genesis 11:26",
    majorPassages: ["Genesis 12", "Genesis 15", "Genesis 17", "Genesis 22"],
    keyEvents: ["Called from Ur", "Receives covenant promises", "Believes God", "Offers Isaac in obedience"],
    lessonsLearned: ["Faith obeys God's call", "God keeps His promises", "True worship trusts God with what is most precious"],
    relatedVerses: ["Genesis 12:1", "Genesis 15:6", "Genesis 22:2", "Romans 4:3"],
  },
  {
    id: "joseph",
    name: "Joseph",
    summary: "The son of Jacob whom God used through suffering to preserve life.",
    description:
      "Joseph was rejected by his brethren, humbled, exalted, and used of God to save many alive during famine.",
    firstAppearance: "Genesis 30:24",
    majorPassages: ["Genesis 37", "Genesis 39", "Genesis 41", "Genesis 45"],
    keyEvents: ["Sold by his brethren", "Remains faithful in temptation", "Interprets Pharaoh's dreams", "Forgives his brethren"],
    lessonsLearned: ["God can rule over evil circumstances", "Faithfulness matters in obscurity", "Forgiveness rests in God's providence"],
    relatedVerses: ["Genesis 37:28", "Genesis 39:9", "Genesis 45:5", "Genesis 50:20"],
  },
  {
    id: "david",
    name: "David",
    summary: "The shepherd king of Israel and writer of many psalms.",
    description:
      "David was chosen by God, faced Goliath by faith, ruled Israel, sinned grievously, and received mercy after repentance.",
    firstAppearance: "1 Samuel 16:12",
    majorPassages: ["1 Samuel 16", "1 Samuel 17", "2 Samuel 7", "Psalm 51"],
    keyEvents: ["Anointed by Samuel", "Defeats Goliath", "Receives the Davidic covenant", "Repents after sin"],
    lessonsLearned: ["God looks on the heart", "Faith sees the battle as the Lord's", "Sin must be confessed and forsaken"],
    relatedVerses: ["1 Samuel 16:7", "1 Samuel 17:45", "2 Samuel 7:16", "Psalm 51:10"],
  },
  {
    id: "paul",
    name: "Paul",
    summary: "The apostle to the Gentiles, converted from persecutor to preacher of Christ.",
    description:
      "Paul was saved by Christ, called to preach the gospel, and used of God to write much of the New Testament.",
    firstAppearance: "Acts 7:58",
    majorPassages: ["Acts 9", "Acts 13", "Romans 8", "2 Timothy 4"],
    keyEvents: ["Consents to Stephen's death", "Meets Christ on the Damascus road", "Preaches to the Gentiles", "Finishes his course"],
    lessonsLearned: ["Grace can save the chief of sinners", "The gospel is worth suffering for", "Sound doctrine should lead to faithful service"],
    relatedVerses: ["Acts 9:5", "Acts 13:2", "Romans 8:1", "2 Timothy 4:7"],
  },
  {
    id: "peter",
    name: "Peter",
    summary: "An apostle of Christ known for bold confession, failure, restoration, and preaching.",
    description:
      "Peter followed Christ, confessed Him as the Christ, denied Him, was restored, and preached boldly after Pentecost.",
    firstAppearance: "Matthew 4:18",
    majorPassages: ["Matthew 16", "Luke 22", "John 21", "Acts 2"],
    keyEvents: ["Called from fishing", "Confesses Christ", "Denies the Lord", "Is restored and preaches at Pentecost"],
    lessonsLearned: ["Confidence in self is dangerous", "Christ restores repentant servants", "Boldness comes from the Spirit of God"],
    relatedVerses: ["Matthew 16:16", "Luke 22:61", "John 21:17", "Acts 2:14"],
  },
  {
    id: "joshua",
    name: "Joshua",
    summary: "Moses' successor who led Israel into Canaan.",
    description:
      "Joshua served under Moses, trusted God's promise, and led Israel into the land with courage and obedience.",
    firstAppearance: "Exodus 17:9",
    majorPassages: ["Exodus 17", "Numbers 14", "Joshua 1", "Joshua 24"],
    keyEvents: ["Leads Israel in battle against Amalek", "Gives a faithful report of Canaan", "Leads Israel across Jordan", "Calls Israel to serve the LORD"],
    lessonsLearned: ["Courage rests on God's word", "Faith may stand against the majority", "Leadership must call people to serve the LORD"],
    relatedVerses: ["Exodus 17:9", "Numbers 14:6", "Joshua 1:9", "Joshua 24:15"],
  },
  {
    id: "elijah",
    name: "Elijah",
    summary: "A prophet who confronted idolatry and called Israel back to the LORD.",
    description:
      "Elijah ministered in dark days, prayed earnestly, confronted Baal worship, and learned God's care in weakness.",
    firstAppearance: "1 Kings 17:1",
    majorPassages: ["1 Kings 17", "1 Kings 18", "1 Kings 19", "2 Kings 2"],
    keyEvents: ["Announces drought", "Prays at Carmel", "Flees to Horeb", "Is taken up by a whirlwind"],
    lessonsLearned: ["God is able to preserve His servant", "True worship rejects idols", "Discouraged servants still need God's care"],
    relatedVerses: ["1 Kings 17:1", "1 Kings 18:21", "1 Kings 19:12", "James 5:17"],
  },
];

const studyPlaces: StudyPlace[] = [
  {
    id: "jerusalem",
    name: "Jerusalem",
    description:
      "The chief city of the Jews, central to the temple, the feasts, the Lord's final week, the resurrection witness, and early gospel preaching.",
    significance: "Jerusalem gathers together temple worship, Christ's death and resurrection, and the first public preaching of the risen Lord.",
    keyPassages: ["2 Samuel 5:6", "Luke 24:47", "Acts 2:5", "Revelation 21:2"],
    timelineLinks: ["david", "christ-crucifixion", "christ-resurrection", "church-pentecost"],
    relatedPassages: ["2 Samuel 5:6", "Luke 24:47", "Acts 2:5", "Revelation 21:2"],
    mapNote: "Map placeholder: future Bible map layer for Jerusalem and Judea.",
  },
  {
    id: "bethlehem",
    name: "Bethlehem",
    description:
      "The prophesied birthplace of Christ, included here as a reviewed prophecy-place connection.",
    significance: "Bethlehem connects David's line, Micah's prophecy, and the birth of the Lord Jesus Christ.",
    keyPassages: ["Ruth 1:1", "1 Samuel 16:1", "Micah 5:2", "Luke 2:4"],
    timelineLinks: ["david", "christ-birth"],
    relatedPassages: ["Ruth 1:1", "1 Samuel 16:1", "Micah 5:2", "Luke 2:4"],
    mapNote: "Map placeholder: future Bible map layer for Bethlehem.",
  },
  {
    id: "nazareth",
    name: "Nazareth",
    description: "The Galilean town where Jesus was brought up and from which He was known as Jesus of Nazareth.",
    significance: "Nazareth helps readers connect the Lord's humble earthly upbringing with His public identification in the Gospels.",
    keyPassages: ["Matthew 2:23", "Luke 1:26", "Luke 4:16", "John 1:45"],
    timelineLinks: ["christ-birth", "christ-ministry"],
    relatedPassages: ["Matthew 2:23", "Luke 1:26", "Luke 4:16", "John 1:45"],
    mapNote: "Map placeholder: future Bible map marker for Nazareth in Galilee.",
  },
  {
    id: "galilee",
    name: "Galilee",
    description:
      "The northern region closely connected with the Lord's earthly ministry, His disciples, and many miracles.",
    significance: "Galilee anchors much of Christ's ministry, the calling of disciples, and post-resurrection reminders.",
    keyPassages: ["Matthew 4:12", "Matthew 4:23", "Luke 24:6", "John 21:1"],
    timelineLinks: ["christ-ministry", "christ-resurrection"],
    relatedPassages: ["Matthew 4:12", "Matthew 4:23", "Luke 24:6", "John 21:1"],
    mapNote: "Map placeholder: future Bible map layer for Galilee and the Sea of Galilee.",
  },
  {
    id: "jordan-river",
    name: "Jordan River",
    description:
      "A river connected with Israel's entrance into Canaan, John's baptism ministry, and the public witness to Christ.",
    significance: "The Jordan River helps connect Old Testament crossing, prophetic ministry, and New Testament witness.",
    keyPassages: ["Joshua 3:17", "Matthew 3:13", "John 1:28", "John 3:26"],
    timelineLinks: ["exodus-wilderness", "christ-ministry"],
    relatedPassages: ["Joshua 3:17", "Matthew 3:13", "John 1:28", "John 3:26"],
    mapNote: "Map placeholder: future Bible map layer for Jordan River crossings and baptism sites.",
  },
  {
    id: "emmaus",
    name: "Emmaus",
    description: "A village connected with the risen Christ opening the Scriptures to two disciples.",
    significance: "Emmaus is a key place for teaching how the resurrection and the Old Testament Scriptures belong together.",
    keyPassages: ["Luke 24:13", "Luke 24:27", "Luke 24:31", "Luke 24:32"],
    timelineLinks: ["christ-resurrection"],
    relatedPassages: ["Luke 24:13", "Luke 24:27", "Luke 24:31", "Luke 24:32"],
    mapNote: "Map placeholder: future simple route from Jerusalem toward Emmaus.",
  },
  {
    id: "egypt",
    name: "Egypt",
    description:
      "A place of refuge and bondage in Scripture, central to Israel's deliverance and the Passover setting.",
    significance: "Egypt ties together the patriarchs, Joseph's preservation, Israel's bondage, the Exodus, and Christ's childhood refuge.",
    keyPassages: ["Genesis 12:10", "Genesis 45:5", "Exodus 12:1", "Matthew 2:13"],
    timelineLinks: ["abraham", "joseph", "moses", "christ-birth"],
    relatedPassages: ["Genesis 12:10", "Genesis 45:5", "Exodus 12:1", "Matthew 2:13"],
    mapNote: "Map placeholder: future Bible map layer for Egypt, Goshen, and the Exodus route.",
  },
  {
    id: "babylon",
    name: "Babylon",
    description:
      "A kingdom and city connected with exile, pride, judgment, and prophetic Scripture.",
    significance: "Babylon helps students place Judah's exile, Daniel's setting, and later prophetic judgment language.",
    keyPassages: ["2 Kings 24:10", "Daniel 1:1", "Daniel 4:30", "Revelation 18:2"],
    timelineLinks: ["solomon"],
    relatedPassages: ["2 Kings 24:10", "Daniel 1:1", "Daniel 4:30", "Revelation 18:2"],
    mapNote: "Map placeholder: future Bible map layer for Babylon and the exile route.",
  },
  {
    id: "antioch",
    name: "Antioch",
    description: "A major early church center where disciples were first called Christians and from which missionary work was sent.",
    significance: "Antioch is important for understanding the spread of the gospel beyond Jerusalem and the missionary movement in Acts.",
    keyPassages: ["Acts 11:26", "Acts 13:1", "Acts 14:26", "Acts 15:35"],
    timelineLinks: ["church-pentecost", "pauls-journeys"],
    relatedPassages: ["Acts 11:26", "Acts 13:1", "Acts 14:26", "Acts 15:35"],
    mapNote: "Map placeholder: future simple marker for Syrian Antioch and Paul's mission departures.",
  },
  {
    id: "corinth",
    name: "Corinth",
    description: "A city in Achaia where Paul preached and where a church later received inspired correction and instruction.",
    significance: "Corinth helps locate Paul's missionary work and the background for 1 and 2 Corinthians.",
    keyPassages: ["Acts 18:1", "Acts 18:8", "1 Corinthians 1:2", "2 Corinthians 1:1"],
    timelineLinks: ["pauls-journeys"],
    relatedPassages: ["Acts 18:1", "Acts 18:8", "1 Corinthians 1:2", "2 Corinthians 1:1"],
    mapNote: "Map placeholder: future simple marker for Corinth in Achaia.",
  },
  {
    id: "rome",
    name: "Rome",
    description: "The capital city connected with Paul's epistle to the Romans and his later witness as a prisoner.",
    significance: "Rome helps readers place the Roman church, Paul's gospel burden, and the later spread of Christian witness in Acts.",
    keyPassages: ["Romans 1:7", "Romans 1:15", "Acts 28:16", "Acts 28:31"],
    timelineLinks: ["pauls-journeys"],
    relatedPassages: ["Romans 1:7", "Romans 1:15", "Acts 28:16", "Acts 28:31"],
    mapNote: "Map placeholder: future simple marker for Rome.",
  },
  {
    id: "cenchrea",
    name: "Cenchrea",
    description: "A port near Corinth connected with Phoebe and Paul's missionary travel.",
    significance: "Cenchrea helps locate the close of Romans and the practical network of early church service.",
    keyPassages: ["Romans 16:1", "Acts 18:18"],
    timelineLinks: ["pauls-journeys"],
    relatedPassages: ["Romans 16:1", "Acts 18:18"],
    mapNote: "Map placeholder: future simple marker for Cenchrea near Corinth.",
  },
  {
    id: "ephesus",
    name: "Ephesus",
    description: "A city in Asia where Paul ministered and where the gospel confronted idolatry and public opposition.",
    significance: "Ephesus helps readers understand Acts 19, the Ephesian church, and later instruction about Christ and the church.",
    keyPassages: ["Acts 18:19", "Acts 19:10", "Acts 19:26", "Ephesians 1:1"],
    timelineLinks: ["pauls-journeys"],
    relatedPassages: ["Acts 18:19", "Acts 19:10", "Acts 19:26", "Ephesians 1:1"],
    mapNote: "Map placeholder: future simple marker for Ephesus in Asia.",
  },
  {
    id: "judea",
    name: "Judea",
    description:
      "The region where Jesus and His disciples came after His conversation with Nicodemus.",
    significance: "Judea connects the Lord's ministry around Jerusalem with John's continuing witness.",
    keyPassages: ["Matthew 3:1", "John 3:22", "Acts 1:8"],
    timelineLinks: ["christ-ministry", "church-pentecost"],
    relatedPassages: ["Matthew 3:1", "John 3:22", "Acts 1:8"],
    mapNote: "Map placeholder: future Bible map layer for Judea.",
  },
  {
    id: "aenon-salim",
    name: "Aenon near Salim",
    description:
      "A place where John was baptizing because there was much water there.",
    significance: "Aenon near Salim keeps John 3 connected to John the Baptist's final witness that Christ must increase.",
    keyPassages: ["John 3:23", "John 3:30"],
    timelineLinks: ["christ-ministry"],
    relatedPassages: ["John 3:23", "John 3:30"],
    mapNote: "Map placeholder: future map marker for Aenon near Salim.",
  },
];

const timelineEntries: StudyTimelineEntry[] = [
  {
    id: "abraham",
    era: "Patriarchs",
    title: "Abraham",
    timeframe: "Patriarchal era",
    description: "God calls Abraham and gives covenant promises concerning seed, land, and blessing.",
    keyPassages: ["Genesis 12:1", "Genesis 15:6", "Genesis 22:2"],
  },
  {
    id: "isaac",
    era: "Patriarchs",
    title: "Isaac",
    timeframe: "Patriarchal era",
    description: "The promised son through whom God's covenant line continues.",
    keyPassages: ["Genesis 21:3", "Genesis 22:2", "Genesis 26:3"],
  },
  {
    id: "jacob",
    era: "Patriarchs",
    title: "Jacob",
    timeframe: "Patriarchal era",
    description: "Jacob is renamed Israel, and his sons become the tribes of Israel.",
    keyPassages: ["Genesis 28:13", "Genesis 32:28", "Genesis 49:28"],
  },
  {
    id: "joseph",
    era: "Patriarchs",
    title: "Joseph",
    timeframe: "Patriarchal era",
    description: "God uses Joseph's suffering and exaltation in Egypt to preserve many alive.",
    keyPassages: ["Genesis 37:28", "Genesis 45:5", "Genesis 50:20"],
  },
  {
    id: "moses",
    era: "Exodus",
    title: "Moses",
    timeframe: "Exodus era",
    description: "God calls Moses to lead Israel out of Egypt and receive the law.",
    keyPassages: ["Exodus 3:10", "Exodus 12:31", "Deuteronomy 34:10"],
  },
  {
    id: "exodus-wilderness",
    era: "Exodus",
    title: "Wilderness",
    timeframe: "Exodus and wilderness years",
    description: "Israel is delivered from Egypt and tested in the wilderness before entering the land.",
    keyPassages: ["Exodus 14:21", "Numbers 21:8", "Deuteronomy 8:2"],
  },
  {
    id: "saul",
    era: "Kings",
    title: "Saul",
    timeframe: "United kingdom",
    description: "Israel's first king, whose reign warns about disobedience and self-will.",
    keyPassages: ["1 Samuel 9:2", "1 Samuel 15:22", "1 Samuel 31:4"],
  },
  {
    id: "david",
    era: "Kings",
    title: "David",
    timeframe: "United kingdom",
    description: "The shepherd king receives covenant promises and becomes central to Messianic expectation.",
    keyPassages: ["1 Samuel 16:13", "2 Samuel 7:16", "Psalm 22:1"],
  },
  {
    id: "solomon",
    era: "Kings",
    title: "Solomon",
    timeframe: "United kingdom",
    description: "Solomon builds the temple, receives wisdom, and later shows the danger of a divided heart.",
    keyPassages: ["1 Kings 3:9", "1 Kings 8:20", "1 Kings 11:4"],
  },
  {
    id: "christ-birth",
    era: "Christ",
    title: "Birth of Christ",
    timeframe: "Gospel era",
    description: "Christ is born in Bethlehem according to prophecy and announced as Saviour.",
    keyPassages: ["Micah 5:2", "Luke 2:7", "Luke 2:11"],
  },
  {
    id: "christ-ministry",
    era: "Christ",
    title: "Ministry of Christ",
    timeframe: "Gospel era",
    description: "The Lord Jesus preaches, teaches, works miracles, calls disciples, and reveals the Father.",
    keyPassages: ["Matthew 4:23", "Luke 4:18", "John 3:16"],
  },
  {
    id: "christ-crucifixion",
    era: "Christ",
    title: "Crucifixion",
    timeframe: "Gospel era",
    description: "Christ suffers and dies at Jerusalem according to the Scriptures.",
    keyPassages: ["Psalm 22:16", "Luke 23:33", "John 19:30"],
  },
  {
    id: "christ-resurrection",
    era: "Christ",
    title: "Resurrection",
    timeframe: "Gospel era",
    description: "Christ rises again and opens the Scriptures to His disciples.",
    keyPassages: ["Luke 24:6", "Luke 24:27", "Luke 24:46"],
  },
  {
    id: "church-pentecost",
    era: "Church",
    title: "Pentecost",
    timeframe: "Early church",
    description: "The Spirit is given and the risen Christ is preached openly at Jerusalem.",
    keyPassages: ["Acts 2:1", "Acts 2:36", "Acts 2:41"],
  },
  {
    id: "pauls-journeys",
    era: "Church",
    title: "Paul's Journeys",
    timeframe: "Early church",
    description: "Paul carries the gospel through missionary journeys, strengthening churches and preaching Christ.",
    keyPassages: ["Acts 13:2", "Acts 16:9", "Acts 19:10", "Acts 20:24"],
  },
];

const christTypes: ChristTypeConnection[] = [
  {
    id: "adam",
    title: "Adam",
    description: "The first man, whose history sets the background for mankind's need.",
    pointsToChrist: "The New Testament contrasts Adam with Christ as the last Adam.",
    keyReferences: ["Genesis 2:7", "Genesis 3:6"],
    fulfillmentReferences: ["Romans 5:14", "1 Corinthians 15:45"],
  },
  {
    id: "noahs-ark",
    title: "Ark",
    description: "The ark was the place of safety from judgment in Noah's day.",
    pointsToChrist: "It pictures safety provided by God from coming judgment.",
    keyReferences: ["Genesis 6:14", "Genesis 7:1"],
    fulfillmentReferences: ["1 Peter 3:20", "Hebrews 11:7"],
  },
  {
    id: "isaac",
    title: "Isaac",
    description: "Abraham's son, offered in obedience and received back in figure.",
    pointsToChrist: "The beloved son language and sacrifice pattern point forward to the giving of God's Son.",
    keyReferences: ["Genesis 22:2", "Genesis 22:13"],
    fulfillmentReferences: ["John 3:16", "Hebrews 11:17"],
  },
  {
    id: "joseph",
    title: "Joseph",
    description: "Rejected by his brethren, yet used of God to preserve life.",
    pointsToChrist: "His humiliation and later exaltation have long been studied as a type pointing to Christ.",
    keyReferences: ["Genesis 37:28", "Genesis 45:5"],
    fulfillmentReferences: ["Acts 7:9", "Acts 7:13"],
  },
  {
    id: "passover-lamb",
    title: "Passover Lamb",
    description: "The lamb slain at Passover when Israel was delivered from Egypt.",
    pointsToChrist: "The New Testament identifies Christ as our passover.",
    keyReferences: ["Exodus 12:5", "Exodus 12:13"],
    fulfillmentReferences: ["John 1:29", "1 Corinthians 5:7"],
  },
  {
    id: "brazen-serpent",
    title: "Brazen Serpent",
    description: "A serpent of brass lifted up by Moses in the wilderness.",
    pointsToChrist: "John 3 directly connects Moses lifting up the serpent with the Son of man being lifted up.",
    keyReferences: ["Numbers 21:8", "Numbers 21:9"],
    fulfillmentReferences: ["John 3:14", "John 3:15", "John 12:32"],
  },
  {
    id: "tabernacle",
    title: "Tabernacle",
    description: "The dwelling place and worship system God gave Israel in the wilderness.",
    pointsToChrist: "The New Testament connects Christ with God's dwelling among men and the way of access to God.",
    keyReferences: ["Exodus 25:8", "Exodus 26:33"],
    fulfillmentReferences: ["John 1:14", "Hebrews 9:11"],
  },
];

const prophecyConnections: ProphecyConnection[] = [
  {
    id: "isaiah-53",
    prophecy: "Isaiah 53",
    fulfillment: "Fulfilled in Christ",
    description: "A reviewed connection for the suffering, substitution, and exaltation of Christ.",
    relatedVerses: ["Isaiah 53:5", "John 3:14", "1 Peter 2:24"],
  },
  {
    id: "micah-5-2",
    prophecy: "Micah 5:2",
    fulfillment: "Bethlehem",
    description: "The ruler in Israel would come from Bethlehem.",
    relatedVerses: ["Micah 5:2", "Matthew 2:1", "Matthew 2:6"],
  },
  {
    id: "psalm-22",
    prophecy: "Psalm 22",
    fulfillment: "Crucifixion",
    description: "A reviewed connection for the suffering of Christ at the cross.",
    relatedVerses: ["Psalm 22:1", "Psalm 22:18", "John 19:24"],
  },
  {
    id: "daniel-9",
    prophecy: "Daniel 9",
    fulfillment: "Messiah cut off",
    description: "A reviewed connection for Messiah, timing, covenant language, and the prophetic expectation surrounding Christ.",
    relatedVerses: ["Daniel 9:24", "Daniel 9:26", "Luke 24:26"],
  },
  {
    id: "zechariah-12",
    prophecy: "Zechariah 12",
    fulfillment: "Looking upon the pierced One",
    description: "A reviewed connection between the pierced One and the mourning connected with Israel and Christ.",
    relatedVerses: ["Zechariah 12:10", "John 19:37", "Revelation 1:7"],
  },
];

const chapterConnections: ChapterConnections[] = [
  {
    book: "Genesis",
    chapter: 12,
    peopleIds: ["abraham"],
    placeIds: ["egypt"],
    timelineIds: ["abraham"],
    typeIds: [],
    prophecyIds: [],
    themes: ["Calling", "Faith", "Promise", "Pilgrimage"],
  },
  {
    book: "Genesis",
    chapter: 22,
    peopleIds: ["abraham"],
    placeIds: [],
    timelineIds: ["abraham", "isaac"],
    typeIds: ["isaac"],
    prophecyIds: [],
    themes: ["Faith", "Obedience", "Sacrifice", "Provision"],
  },
  {
    book: "Genesis",
    chapter: 37,
    peopleIds: ["joseph"],
    placeIds: ["egypt"],
    timelineIds: ["jacob", "joseph"],
    typeIds: ["joseph"],
    prophecyIds: [],
    themes: ["Providence", "Suffering", "Rejection", "God's purpose"],
  },
  {
    book: "Exodus",
    chapter: 12,
    peopleIds: ["moses"],
    placeIds: ["egypt"],
    timelineIds: ["moses", "exodus-wilderness"],
    typeIds: ["passover-lamb"],
    prophecyIds: [],
    themes: ["Deliverance", "Blood", "Judgment", "Redemption"],
  },
  {
    book: "Joshua",
    chapter: 1,
    peopleIds: ["joshua", "moses"],
    placeIds: [],
    typeIds: [],
    prophecyIds: [],
    themes: ["Courage", "Leadership", "Meditation", "Obedience"],
  },
  {
    book: "1 Samuel",
    chapter: 17,
    peopleIds: ["david"],
    placeIds: [],
    timelineIds: ["david"],
    typeIds: [],
    prophecyIds: [],
    themes: ["Faith", "Courage", "The battle is the LORD's"],
  },
  {
    book: "1 Kings",
    chapter: 18,
    peopleIds: ["elijah"],
    placeIds: [],
    typeIds: [],
    prophecyIds: [],
    themes: ["True worship", "Prayer", "Idolatry exposed", "Decision"],
  },
  {
    book: "Psalms",
    chapter: 22,
    peopleIds: ["david", "jesus"],
    placeIds: ["jerusalem"],
    timelineIds: ["david", "christ-crucifixion"],
    typeIds: [],
    prophecyIds: ["psalm-22"],
    themes: ["Suffering", "Crucifixion", "Praise", "Deliverance"],
  },
  {
    book: "Isaiah",
    chapter: 53,
    peopleIds: ["jesus"],
    placeIds: [],
    typeIds: [],
    prophecyIds: ["isaiah-53"],
    themes: ["Substitution", "Suffering servant", "Atonement", "Exaltation"],
  },
  {
    book: "Daniel",
    chapter: 9,
    peopleIds: [],
    placeIds: ["babylon", "jerusalem"],
    timelineIds: ["solomon"],
    typeIds: [],
    prophecyIds: ["daniel-9"],
    themes: ["Prayer", "Confession", "Prophecy", "Messiah"],
  },
  {
    book: "Zechariah",
    chapter: 12,
    peopleIds: ["jesus"],
    placeIds: ["jerusalem"],
    typeIds: [],
    prophecyIds: ["zechariah-12"],
    themes: ["Jerusalem", "The pierced One", "Mourning", "Deliverance"],
  },
  {
    book: "John",
    chapter: 3,
    peopleIds: ["jesus", "nicodemus", "john-baptist", "moses"],
    placeIds: ["jerusalem", "judea", "aenon-salim", "jordan-river", "bethlehem"],
    timelineIds: ["moses", "christ-ministry"],
    typeIds: ["brazen-serpent"],
    prophecyIds: ["isaiah-53", "micah-5-2", "psalm-22"],
    themes: ["New birth", "Faith", "God's love", "Everlasting life", "Witness", "Light and darkness"],
  },
  {
    book: "Luke",
    chapter: 24,
    peopleIds: ["jesus", "peter"],
    placeIds: ["jerusalem", "galilee", "emmaus"],
    timelineIds: ["christ-crucifixion", "christ-resurrection"],
    typeIds: [],
    prophecyIds: ["isaiah-53", "psalm-22", "daniel-9"],
    themes: ["Resurrection", "Scripture fulfilled", "Witness", "Opened understanding"],
  },
  {
    book: "Acts",
    chapter: 9,
    peopleIds: ["paul", "peter"],
    placeIds: ["jerusalem"],
    timelineIds: ["church-pentecost", "pauls-journeys"],
    typeIds: [],
    prophecyIds: [],
    themes: ["Conversion", "Grace", "Calling", "Bold witness"],
  },
  {
    book: "Acts",
    chapter: 19,
    peopleIds: ["paul"],
    placeIds: ["ephesus"],
    timelineIds: ["pauls-journeys"],
    typeIds: [],
    prophecyIds: [],
    themes: ["Gospel witness", "Disciples taught", "Idolatry confronted", "The word of God prevailed"],
  },
  {
    book: "Romans",
    chapter: 5,
    peopleIds: ["paul"],
    placeIds: ["corinth"],
    timelineIds: ["christ-crucifixion", "christ-resurrection", "pauls-journeys"],
    typeIds: ["adam"],
    prophecyIds: [],
    themes: ["Justification", "Peace with God", "Grace", "Adam and Christ"],
  },
  {
    book: "Romans",
    chapter: 8,
    peopleIds: ["paul"],
    placeIds: [],
    timelineIds: ["christ-resurrection", "pauls-journeys"],
    typeIds: [],
    prophecyIds: [],
    themes: ["No condemnation", "Spirit", "Adoption", "Assurance", "God's love"],
  },
];

function mergeCommentaryEntries(...entryGroups: CommentaryEntry[][]) {
  const seen = new Set<string>();

  return entryGroups.flatMap((entries) =>
    entries.filter((entry) => {
      const key = `${entry.book}-${entry.chapter}-${entry.verse_start}-${entry.verse_end}-${entry.author}-${entry.resource_title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  );
}

function activeCommentaryEntriesOnly(entries: CommentaryEntry[]) {
  return entries.filter((entry) => ACTIVE_COMMENTARY_COLLECTIONS.includes(entry.resource_title));
}

function mergeCrossReferences(...referenceGroups: CrossReference[][]) {
  const seen = new Set<string>();

  return referenceGroups.flatMap((references) =>
    references.filter((reference) => {
      const key = `${reference.verse_ref}|${reference.target_ref}|${reference.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  );
}

const bookOrder = [
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

const NEW_TESTAMENT_START_INDEX = bookOrder.indexOf("Matthew");
const starterKeyWords: Record<string, string[]> = {
  "John 3:16": ["loved", "world", "gave", "begotten", "believeth", "perish", "everlasting", "life"],
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
let browserSupabaseClient: SupabaseClient | null | undefined;

function makeSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  browserSupabaseClient ??= createClient(supabaseUrl, supabaseAnonKey);
  return browserSupabaseClient;
}

function parseVerses(): BibleVerse[] {
  return Object.entries(verses1769 as Record<string, string>).map(([ref, text]) => {
    const match = ref.match(/^(.+) (\d+):(\d+)$/);
    if (!match) {
      return {
        ref,
        book: "Unknown",
        chapter: 0,
        verse: 0,
        text,
        plainText: normalizeVerseText(text),
      };
    }

    return {
      ref,
      book: match[1],
      chapter: Number(match[2]),
      verse: Number(match[3]),
      text: normalizeVerseText(text),
      plainText: normalizeVerseText(text).replace(/\[([^\]]+)\]/g, "$1"),
    };
  });
}

function normalizeVerseText(text: string) {
  return text.replace(/^#\s*/, "");
}

function cleanWord(word: string) {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

function normalizeLookupWord(word: string) {
  const cleaned = cleanWord(word);
  if (!cleaned) return "";
  if (dictionaryAliases[cleaned]) return dictionaryAliases[cleaned];
  if (dictionaryEntries[cleaned]) return cleaned;

  const suffixRules: Array<[RegExp, string]> = [
    [/eth$/, ""],
    [/est$/, ""],
    [/ing$/, ""],
    [/ed$/, ""],
    [/s$/, ""],
  ];

  for (const [pattern, replacement] of suffixRules) {
    const candidate = cleaned.replace(pattern, replacement);
    if (dictionaryEntries[candidate]) return candidate;
  }

  return cleaned;
}

function findDictionaryEntry(word: string): DictionaryEntry {
  const lookupWord = normalizeLookupWord(word);
  const entry = dictionaryEntries[lookupWord];

  if (!entry) {
    return {
      word: cleanWord(word) || word,
      lookupWord,
      definition: "No definition found yet. The dictionary import structure is ready for a full Webster's 1828 dataset.",
      found: false,
    };
  }

  return {
    definition: entry.definition,
    word: cleanWord(word) || entry.word,
    lookupWord,
    found: true,
  };
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function createBiblePassage(book: string, chapter: number, verse?: number): BiblePassage {
  const safeChapter = Math.max(1, Math.floor(chapter || 1));
  const safeVerse = verse ? Math.max(1, Math.floor(verse)) : undefined;
  const label = safeVerse ? `${book} ${safeChapter}:${safeVerse}` : `${book} ${safeChapter}`;

  return {
    id: `${book.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${safeChapter}-${safeVerse ?? "chapter"}`,
    book,
    chapter: safeChapter,
    verse: safeVerse,
    label,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeBiblePassages(value: unknown): BiblePassage[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const passage = item as Partial<BiblePassage>;
    if (!passage.book || typeof passage.book !== "string" || !passage.chapter) return [];
    return [
      {
        ...createBiblePassage(passage.book, Number(passage.chapter), passage.verse ? Number(passage.verse) : undefined),
        updatedAt: passage.updatedAt || new Date().toISOString(),
      },
    ];
  });
}

function loadRecentPassages() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(RECENT_PASSAGES_KEY);
    return normalizeBiblePassages(raw ? JSON.parse(raw) : []).slice(0, RECENT_PASSAGE_LIMIT);
  } catch {
    return [];
  }
}

function saveRecentPassages(passages: BiblePassage[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RECENT_PASSAGES_KEY, JSON.stringify(passages.slice(0, RECENT_PASSAGE_LIMIT)));
}

function loadFavoritePassages() {
  if (typeof window === "undefined") return DEFAULT_FAVORITE_PASSAGES;

  try {
    const raw = window.localStorage.getItem(FAVORITE_PASSAGES_KEY);
    const passages = normalizeBiblePassages(raw ? JSON.parse(raw) : []);
    return passages.length ? passages : DEFAULT_FAVORITE_PASSAGES;
  } catch {
    return DEFAULT_FAVORITE_PASSAGES;
  }
}

function saveFavoritePassages(passages: BiblePassage[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITE_PASSAGES_KEY, JSON.stringify(passages.slice(0, FAVORITE_PASSAGE_LIMIT)));
}

function emptyBibleMarkers(): BibleMarkers {
  return {
    A: null,
    B: null,
    C: null,
    D: null,
  };
}

function loadBibleMarkers(): BibleMarkers {
  if (typeof window === "undefined") return emptyBibleMarkers();

  try {
    const raw = window.localStorage.getItem(BIBLE_MARKERS_KEY);
    if (!raw) return emptyBibleMarkers();
    const parsed = JSON.parse(raw) as Partial<Record<BibleMarkerId, unknown>>;
    return BIBLE_MARKER_IDS.reduce<BibleMarkers>((markers, markerId) => {
      const normalized = normalizeBiblePassages(parsed[markerId] ? [parsed[markerId]] : []);
      markers[markerId] = normalized[0] ?? null;
      return markers;
    }, emptyBibleMarkers());
  } catch {
    return emptyBibleMarkers();
  }
}

function saveBibleMarkers(markers: BibleMarkers) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BIBLE_MARKERS_KEY, JSON.stringify(markers));
}

function parseQuickPassage(input: string, allVerses: BibleVerse[], books: string[]) {
  const query = input.trim().replace(/\s+/g, " ");
  const match = query.match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
  if (!match) return null;

  const [, rawBook, rawChapter, rawVerse] = match;
  const normalizedBook = rawBook.toLowerCase().replace(/\./g, "");
  const targetBook = books.find((candidate) => candidate.toLowerCase().replace(/\./g, "") === normalizedBook);
  if (!targetBook) return null;

  const targetChapter = Number(rawChapter);
  const targetVerse = rawVerse ? Number(rawVerse) : undefined;
  const chapterVerses = allVerses.filter((verse) => verse.book === targetBook && verse.chapter === targetChapter);
  if (!chapterVerses.length) return null;
  if (targetVerse && !chapterVerses.some((verse) => verse.verse === targetVerse)) return null;

  return createBiblePassage(targetBook, targetChapter, targetVerse);
}

function loadLocalState(): SavedState {
  if (typeof window === "undefined") return { notes: [], highlights: [], bookmarks: [] };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { notes: [], highlights: [], bookmarks: [] };
    const parsed = JSON.parse(raw) as SavedState;
    return {
      notes: parsed.notes ?? [],
      highlights: parsed.highlights ?? [],
      bookmarks: parsed.bookmarks ?? [],
    };
  } catch {
    return { notes: [], highlights: [], bookmarks: [] };
  }
}

function saveLocalState(state: SavedState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function defaultLibraryProgress(resource: Pick<LibraryResource, "slug" | "title" | "author">, fontSize = 18): LibraryProgress {
  const now = new Date().toISOString();
  return {
    slug: resource.slug,
    title: resource.title,
    author: resource.author,
    progress: 0,
    fontSize,
    lineSpacing: 1.65,
    readingWidth: "comfortable",
    theme: "sepia",
    bookmarks: [],
    startedAt: now,
    updatedAt: now,
  };
}

function normalizeLibraryProgress(progress: Partial<LibraryProgress> & Pick<LibraryProgress, "slug" | "title" | "author">): LibraryProgress {
  const fallback = defaultLibraryProgress(progress);
  return {
    ...fallback,
    ...progress,
    progress: Math.min(100, Math.max(0, Number(progress.progress ?? fallback.progress))),
    fontSize: Math.min(26, Math.max(15, Number(progress.fontSize ?? fallback.fontSize))),
    lineSpacing: Math.min(2.2, Math.max(1.35, Number(progress.lineSpacing ?? fallback.lineSpacing))),
    readingWidth: progress.readingWidth ?? fallback.readingWidth,
    theme: progress.theme ?? fallback.theme,
    bookmarks: Array.isArray(progress.bookmarks) ? progress.bookmarks : [],
    startedAt: progress.startedAt ?? fallback.startedAt,
    updatedAt: progress.updatedAt ?? fallback.updatedAt,
  };
}

function loadLibraryProgress(): LibraryProgressState {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LIBRARY_PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LibraryProgress>;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, progress]) => progress?.slug && progress?.title && progress?.author)
        .map(([slug, progress]) => [slug, normalizeLibraryProgress(progress)]),
    );
  } catch {
    return {};
  }
}

function saveLibraryProgress(state: LibraryProgressState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIBRARY_PROGRESS_KEY, JSON.stringify(state));
}

function loadCompletedResources(): CompletedResourceState {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LIBRARY_COMPLETED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CompletedResourceState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveCompletedResources(state: CompletedResourceState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIBRARY_COMPLETED_KEY, JSON.stringify(state));
}

function loadListeningProgress(): ListeningProgressState {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LIBRARY_LISTENING_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ListeningProgressState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveListeningProgress(state: ListeningProgressState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIBRARY_LISTENING_KEY, JSON.stringify(state));
}

function normalizeLibraryAnnotations(raw: unknown): LibraryAnnotationState {
  if (!raw || typeof raw !== "object") return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).map(([slug, entries]) => [
      slug,
      Array.isArray(entries)
        ? entries
            .filter((entry): entry is LibraryAnnotation => {
              const candidate = entry as Partial<LibraryAnnotation>;
              return Boolean(candidate.id && candidate.resourceSlug && candidate.resourceTitle && candidate.type && candidate.createdAt);
            })
            .map((entry) => ({
              ...entry,
              location: Math.min(100, Math.max(0, Number(entry.location ?? 0))),
              text: entry.text || "Saved reader location",
            }))
        : [],
    ]),
  );
}

function loadLibraryAnnotations(): LibraryAnnotationState {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(LIBRARY_ANNOTATIONS_KEY);
    return raw ? normalizeLibraryAnnotations(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

function saveLibraryAnnotations(state: LibraryAnnotationState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LIBRARY_ANNOTATIONS_KEY, JSON.stringify(state));
}

function loadTeachingWorkspaceVisibility(): TeachingWorkspaceVisibility {
  if (typeof window === "undefined") return DEFAULT_TEACHING_WORKSPACE_VISIBILITY;

  try {
    const raw = window.localStorage.getItem(TEACHING_WORKSPACE_VISIBILITY_KEY);
    if (!raw) return DEFAULT_TEACHING_WORKSPACE_VISIBILITY;
    return {
      ...DEFAULT_TEACHING_WORKSPACE_VISIBILITY,
      ...(JSON.parse(raw) as Partial<TeachingWorkspaceVisibility>),
    };
  } catch {
    return DEFAULT_TEACHING_WORKSPACE_VISIBILITY;
  }
}

function defaultBiblePlaylist(): BibleAudioPlaylist {
  return {
    id: "playlist_john_3_study",
    name: "John 3 Study Flow",
    createdAt: new Date().toISOString(),
    items: [
      {
        id: "john-3-chapter",
        type: "bible_chapter",
        label: "John 3 Bible chapter",
        book: "John",
        chapter: 3,
      },
      {
        id: "john-3-commentary-placeholder",
        type: "commentary_placeholder",
        label: "John 3 commentary placeholder",
        book: "John",
        chapter: 3,
      },
      {
        id: "john-3-library-placeholder",
        type: "library_placeholder",
        label: "Related library reading placeholder",
        resourceTitle: "Future related reading",
      },
      {
        id: "john-3-notes-placeholder",
        type: "notes_placeholder",
        label: "Personal notes",
        book: "John",
        chapter: 3,
      },
    ],
  };
}

function loadBibleListeningProgress(): BibleListeningProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(BIBLE_LISTENING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BibleListeningProgress;
  } catch {
    return null;
  }
}

function saveBibleListeningProgress(progress: BibleListeningProgress | null) {
  if (typeof window === "undefined") return;
  if (!progress) {
    window.localStorage.removeItem(BIBLE_LISTENING_KEY);
    return;
  }
  window.localStorage.setItem(BIBLE_LISTENING_KEY, JSON.stringify(progress));
}

function loadBiblePlaylists(): BibleAudioPlaylist[] {
  if (typeof window === "undefined") return [defaultBiblePlaylist()];

  try {
    const raw = window.localStorage.getItem(BIBLE_PLAYLISTS_KEY);
    if (!raw) return [defaultBiblePlaylist()];
    const parsed = JSON.parse(raw) as BibleAudioPlaylist[];
    return Array.isArray(parsed) && parsed.length ? parsed : [defaultBiblePlaylist()];
  } catch {
    return [defaultBiblePlaylist()];
  }
}

function saveBiblePlaylists(playlists: BibleAudioPlaylist[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BIBLE_PLAYLISTS_KEY, JSON.stringify(playlists));
}

function loadScriptureMemory(): ScriptureMemoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SCRIPTURE_MEMORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScriptureMemoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveScriptureMemory(items: ScriptureMemoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SCRIPTURE_MEMORY_KEY, JSON.stringify(items));
}

function chunkSpeechText(text: string) {
  const paragraphs = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + " " + paragraph).trim().length > 900 && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = `${current} ${paragraph}`.trim();
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function versesMax(verses: BibleVerse[]) {
  return Math.max(1, verses.at(-1)?.verse ?? verses.length);
}

function wordsFromText(text: string) {
  return text
    .split(/\s+/)
    .map(cleanWord)
    .filter(Boolean);
}

function studyWordsFromVerses(verses: BibleVerse[]) {
  return verses.flatMap((verse) =>
    wordsFromText(verse.plainText).filter((word) => word.length > 3 && !studyStopWords.has(word)),
  );
}

function countWords(words: string[]) {
  const counts = new Map<string, number>();
  words.forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
}

function repeatedPhrasesForVerses(verses: BibleVerse[]) {
  const phraseCounts = new Map<string, number>();
  verses.forEach((verse) => {
    const words = wordsFromText(verse.plainText).filter((word) => word.length > 2 && !studyStopWords.has(word));
    for (let index = 0; index < words.length - 1; index += 1) {
      const phrase = `${words[index]} ${words[index + 1]}`;
      phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1);
    }
    for (let index = 0; index < words.length - 2; index += 1) {
      const phrase = `${words[index]} ${words[index + 1]} ${words[index + 2]}`;
      phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1);
    }
  });

  return Array.from(phraseCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([phrase, count]) => ({ phrase, count }))
    .sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase))
    .slice(0, 8);
}

function chapterAnalysisForVerses(verses: BibleVerse[], crossReferences: CrossReference[]): ChapterStudyAnalysis {
  const words = verses.flatMap((verse) => wordsFromText(verse.plainText));
  const studyWords = studyWordsFromVerses(verses);
  const chapterRefPrefix = verses[0] ? `${verses[0].book} ${verses[0].chapter}:` : "";
  const referenceCounts = new Map<string, number>();

  crossReferences.forEach((reference) => {
    if (reference.verse_ref.startsWith(chapterRefPrefix)) {
      referenceCounts.set(reference.verse_ref, (referenceCounts.get(reference.verse_ref) ?? 0) + 1);
    }
    if (reference.target_ref.startsWith(chapterRefPrefix)) {
      referenceCounts.set(reference.target_ref, (referenceCounts.get(reference.target_ref) ?? 0) + 1);
    }
  });

  return {
    repeatedWords: countWords(studyWords).filter((item) => item.count > 1).slice(0, 12),
    repeatedPhrases: repeatedPhrasesForVerses(verses),
    stats: {
      verses: verses.length,
      words: words.length,
      uniqueWords: new Set(studyWords).size,
      averageWordsPerVerse: verses.length ? Math.round(words.length / verses.length) : 0,
    },
    mostReferencedVerses: Array.from(referenceCounts.entries())
      .map(([ref, count]) => ({ ref, count }))
      .sort((a, b) => b.count - a.count || a.ref.localeCompare(b.ref))
      .slice(0, 5),
  };
}

function wordMatchesVerse(verse: BibleVerse, lookupWord: string) {
  return wordsFromText(verse.plainText).some((word) => normalizeLookupWord(word) === lookupWord || word === lookupWord);
}

function buildWordExplorer(word: string, currentBook: string, currentChapter: number, allVerses: BibleVerse[]): WordExplorerResult {
  const lookupWord = normalizeLookupWord(word);
  const definition = findDictionaryEntry(word);
  const matches = allVerses.filter((verse) => wordMatchesVerse(verse, lookupWord));

  return {
    word: cleanWord(word) || word,
    lookupWord,
    definition,
    chapterOccurrences: matches.filter((verse) => verse.book === currentBook && verse.chapter === currentChapter),
    bookOccurrences: matches.filter((verse) => verse.book === currentBook),
    bibleOccurrences: matches,
  };
}

function firstLetterPrompt(text: string) {
  return text
    .split(/\s+/)
    .map((word) => {
      const prefix = word.match(/^[^A-Za-z]*/)?.[0] ?? "";
      const letter = word.replace(/[^A-Za-z]/g, "").charAt(0);
      const suffix = word.match(/[^A-Za-z]*$/)?.[0] ?? "";
      return letter ? `${prefix}${letter}${suffix}` : word;
    })
    .join(" ");
}

function hideEveryOtherWord(text: string) {
  let wordIndex = 0;
  return text
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      wordIndex += 1;
      if (wordIndex % 2 === 1) return part;
      const letters = part.replace(/[^A-Za-z]/g, "");
      return letters ? part.replace(/[A-Za-z]+/, "_".repeat(Math.min(10, Math.max(3, letters.length)))) : part;
    })
    .join("");
}

function testamentForBook(book: string): Exclude<TestamentFilter, "all"> {
  const index = bookOrder.indexOf(book);
  return index >= NEW_TESTAMENT_START_INDEX ? "new" : "old";
}

function keyWordsForVerse(verse: BibleVerse) {
  if (starterKeyWords[verse.ref]) return starterKeyWords[verse.ref];

  const stopWords = new Set([
    "and",
    "the",
    "that",
    "unto",
    "with",
    "from",
    "this",
    "shall",
    "hath",
    "have",
    "which",
    "they",
    "them",
    "were",
    "when",
    "then",
    "there",
    "for",
    "not",
    "but",
    "his",
    "her",
    "him",
    "you",
    "your",
    "their",
    "into",
    "upon",
  ]);

  const uniqueWords = verse.text
    .split(/\s+/)
    .map(cleanWord)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  return Array.from(new Set(uniqueWords)).slice(0, 8);
}

export default function Home() {
  const allVerses = useMemo(() => parseVerses(), []);
  const supabase = useMemo(() => makeSupabaseClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [book, setBook] = useState(DEFAULT_BOOK);
  const [chapter, setChapter] = useState(DEFAULT_CHAPTER);
  const [verseJump, setVerseJump] = useState(DEFAULT_VERSE);
  const [selectedRef, setSelectedRef] = useState("John 3:16");
  const [activeDictionaryEntry, setActiveDictionaryEntry] = useState<DictionaryEntry | null>(null);
  const [studyRef, setStudyRef] = useState<string | null>(null);
  const [fullStudyRef, setFullStudyRef] = useState<string | null>(null);
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [bookIntroBook, setBookIntroBook] = useState<string | null>(null);
  const [studyTab, setStudyTab] = useState<StudyDrawerTab>("study");
  const [noteDraft, setNoteDraft] = useState("");
  const [saved, setSaved] = useState<SavedState>({ notes: [], highlights: [], bookmarks: [] });
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [crossReferences, setCrossReferences] = useState<CrossReference[]>(localCrossReferences);
  const [commentaryEntries, setCommentaryEntries] = useState<CommentaryEntry[]>(localCommentaryEntries);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState<TestamentFilter>("all");
  const [dictionarySearchTerm, setDictionarySearchTerm] = useState("");
  const [dictionarySearchResults, setDictionarySearchResults] = useState<DictionarySearchResult[]>([]);
  const [dictionarySearchStatus, setDictionarySearchStatus] = useState("");
  const [flashRef, setFlashRef] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [libraryResources, setLibraryResources] = useState<LibraryResource[]>([]);
  const [libraryView, setLibraryView] = useState<LibraryView>("home");
  const [librarySearchTerm, setLibrarySearchTerm] = useState("");
  const [libraryCategory, setLibraryCategory] = useState("All");
  const [activeLibrarySlug, setActiveLibrarySlug] = useState<string | null>(null);
  const [activeLibraryText, setActiveLibraryText] = useState("");
  const [activeLibraryLoading, setActiveLibraryLoading] = useState(false);
  const [libraryProgress, setLibraryProgress] = useState<LibraryProgressState>({});
  const [completedResources, setCompletedResources] = useState<CompletedResourceState>({});
  const [listeningProgress, setListeningProgress] = useState<ListeningProgressState>({});
  const [libraryAnnotations, setLibraryAnnotations] = useState<LibraryAnnotationState>({});
  const [libraryNoteDraft, setLibraryNoteDraft] = useState("");
  const [bibleListeningProgress, setBibleListeningProgress] = useState<BibleListeningProgress | null>(null);
  const [biblePlaylists, setBiblePlaylists] = useState<BibleAudioPlaylist[]>([]);
  const [scriptureMemory, setScriptureMemory] = useState<ScriptureMemoryItem[]>([]);
  const [recentPassages, setRecentPassages] = useState<BiblePassage[]>([]);
  const [favoritePassages, setFavoritePassages] = useState<BiblePassage[]>(DEFAULT_FAVORITE_PASSAGES);
  const [bibleMarkers, setBibleMarkers] = useState<BibleMarkers>(() => emptyBibleMarkers());
  const [playlistName, setPlaylistName] = useState("Morning Bible Listening");
  const [listenRangeStart, setListenRangeStart] = useState(1);
  const [listenRangeEnd, setListenRangeEnd] = useState(DEFAULT_VERSE);
  const [repeatChapter, setRepeatChapter] = useState(false);
  const [repeatBook, setRepeatBook] = useState(false);
  const [stopAfterSelection, setStopAfterSelection] = useState(true);
  const [hasSpeechSynthesis, setHasSpeechSynthesis] = useState(false);
  const [speechVoices, setSpeechVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedSpeechVoiceURI, setSelectedSpeechVoiceURI] = useState("");
  const [libraryFontSize, setLibraryFontSize] = useState(18);
  const [speechState, setSpeechState] = useState<SpeechState>({
    targetId: null,
    label: "",
    playing: false,
    paused: false,
    progress: 0,
    rate: 1,
    sleepTimerMinutes: null,
    sleepTimerEndsAt: null,
  });
  const libraryReaderRef = useRef<HTMLDivElement | null>(null);
  const speechChunksRef = useRef<string[]>([]);
  const speechVerseRefsRef = useRef<Array<string | null>>([]);
  const speechIndexRef = useRef(0);
  const speechRateRef = useRef(1);
  const speechProgressRef = useRef<((progress: number) => void) | null>(null);
  const speechCompleteRef = useRef<(() => void) | null>(null);
  const speechCancelledRef = useRef(false);
  const sleepTimerRef = useRef<number | null>(null);
  const selectedVerseRef = useRef<HTMLDivElement | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const books = useMemo(
    () => bookOrder.filter((candidate) => allVerses.some((verse) => verse.book === candidate)),
    [allVerses],
  );

  const versesByRef = useMemo(
    () => new Map(allVerses.map((verse) => [verse.ref, verse])),
    [allVerses],
  );

  const chapters = useMemo(() => {
    const values = allVerses
      .filter((verse) => verse.book === book)
      .map((verse) => verse.chapter);
    return Array.from(new Set(values)).sort((a, b) => a - b);
  }, [allVerses, book]);

  const chapterVerses = useMemo(
    () =>
      allVerses
        .filter((verse) => verse.book === book && verse.chapter === chapter)
        .sort((a, b) => a.verse - b.verse),
    [allVerses, book, chapter],
  );

  const currentIndex = useMemo(
    () => books.flatMap((bookName) => Array.from(new Set(allVerses.filter((verse) => verse.book === bookName).map((verse) => verse.chapter))).map((chapterNumber) => `${bookName} ${chapterNumber}`)).indexOf(`${book} ${chapter}`),
    [allVerses, book, books, chapter],
  );

  const chapterRefs = useMemo(
    () =>
      books.flatMap((bookName) =>
        Array.from(
          new Set(allVerses.filter((verse) => verse.book === bookName).map((verse) => verse.chapter)),
        )
          .sort((a, b) => a - b)
          .map((chapterNumber) => ({ bookName, chapterNumber })),
      ),
    [allVerses, books],
  );

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length < 2) return [];
    const tokens = term.split(/\s+/).filter(Boolean);
    return allVerses
      .filter((verse) => searchFilter === "all" || testamentForBook(verse.book) === searchFilter)
      .filter((verse) => {
        const text = verse.plainText.toLowerCase();
        const ref = verse.ref.toLowerCase();
        return text.includes(term) || ref.includes(term) || tokens.every((token) => text.includes(token));
      })
      .slice(0, 80);
  }, [allVerses, searchFilter, searchTerm]);

  const libraryCategories = useMemo(
    () => LIBRARY_CATEGORY_FILTERS,
    [],
  );

  const activeLibraryResource = useMemo(
    () => libraryResources.find((resource) => resource.slug === activeLibrarySlug) ?? null,
    [activeLibrarySlug, libraryResources],
  );

  const filteredLibraryResources = useMemo(() => {
    const term = librarySearchTerm.trim().toLowerCase();
    return libraryResources.filter((resource) => {
      const categoryMatch = libraryCategory === "All" || resource.category === libraryCategory;
      const searchMatch =
        !term ||
        resource.title.toLowerCase().includes(term) ||
        resource.author.toLowerCase().includes(term) ||
        resource.category.toLowerCase().includes(term) ||
        resource.resource_labels.some((label) => label.toLowerCase().includes(term)) ||
        resource.resource_warnings.some((warning) => warning.toLowerCase().includes(term)) ||
        resource.perspective_notes.toLowerCase().includes(term) ||
        resource.recommended_use.toLowerCase().includes(term);
      return categoryMatch && searchMatch;
    });
  }, [libraryCategory, libraryResources, librarySearchTerm]);

  const continueReadingResources = useMemo(
    () =>
      Object.values(libraryProgress)
        .filter((progress) => progress.progress > 0 && progress.progress < 100 && !completedResources[progress.slug])
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 4),
    [completedResources, libraryProgress],
  );

  const todayLibraryProgress = useMemo(
    () =>
      continueReadingResources[0] ??
      Object.values(libraryProgress)
        .filter((progress) => !completedResources[progress.slug])
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ??
      null,
    [completedResources, continueReadingResources, libraryProgress],
  );

  const completedLibraryResources = useMemo(
    () => Object.values(completedResources).sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [completedResources],
  );

  const libraryStats = useMemo(
    () => ({
      booksStarted: Object.values(libraryProgress).filter((progress) => progress.progress > 0 || progress.bookmarks.length > 0).length,
      booksCompleted: completedLibraryResources.length,
      readingStreak: "Soon",
      totalResources: libraryResources.length,
    }),
    [completedLibraryResources.length, libraryProgress, libraryResources.length],
  );

  const featuredLibraryResources = useMemo(() => {
    const preferred = new Set(["Power Through Prayer", "How to Bring Men to Christ", "The Pilgrim's Progress", "A Retrospect"]);
    return libraryResources.filter((resource) => preferred.has(resource.title)).slice(0, 4);
  }, [libraryResources]);

  const highlightsByRef = useMemo(
    () => new Map(saved.highlights.map((highlight) => [highlight.verse_ref, highlight])),
    [saved.highlights],
  );

  const notesByRef = useMemo(() => {
    const grouped = new Map<string, UserNote[]>();
    saved.notes.forEach((note) => {
      grouped.set(note.verse_ref, [...(grouped.get(note.verse_ref) ?? []), note]);
    });
    return grouped;
  }, [saved.notes]);

  const bookmarksByRef = useMemo(
    () => new Map(saved.bookmarks.map((bookmark) => [bookmark.verse_ref, bookmark])),
    [saved.bookmarks],
  );

  const peopleById = useMemo(() => new Map(studyPeople.map((person) => [person.id, person])), []);
  const placesById = useMemo(() => new Map(studyPlaces.map((place) => [place.id, place])), []);
  const timelineById = useMemo(() => new Map(timelineEntries.map((entry) => [entry.id, entry])), []);
  const typesById = useMemo(() => new Map(christTypes.map((type) => [type.id, type])), []);
  const propheciesById = useMemo(() => new Map(prophecyConnections.map((prophecy) => [prophecy.id, prophecy])), []);
  const bookIntroductionsByBook = useMemo(() => new Map(bookIntroductions.map((intro) => [intro.book, intro])), []);

  const activeChapterConnections = useMemo<ActiveChapterConnections>(() => {
    const connection = chapterConnections.find((item) => item.book === book && item.chapter === chapter);
    const resolve = <T,>(ids: string[], source: Map<string, T>) =>
      ids.flatMap((id) => {
        const item = source.get(id);
        return item ? [item] : [];
      });

    return {
      people: resolve(connection?.peopleIds ?? [], peopleById),
      places: resolve(connection?.placeIds ?? [], placesById),
      timeline: resolve(connection?.timelineIds ?? [], timelineById),
      types: resolve(connection?.typeIds ?? [], typesById),
      prophecies: resolve(connection?.prophecyIds ?? [], propheciesById),
      themes: connection?.themes ?? [],
    };
  }, [book, chapter, peopleById, placesById, propheciesById, timelineById, typesById]);

  const activeChapterResourceRecommendations = useMemo(() => {
    const reviewed = CHAPTER_RESOURCE_RECOMMENDATIONS.find((item) => item.book === book && item.chapter === chapter);
    return reviewed?.recommendations ?? DEFAULT_CHAPTER_RESOURCE_RECOMMENDATIONS;
  }, [book, chapter]);

  const activePerson = activePersonId ? peopleById.get(activePersonId) ?? null : null;
  const activeBookIntroduction = bookIntroductionsByBook.get(book) ?? null;
  const activeBookIntro = bookIntroBook ? bookIntroductionsByBook.get(bookIntroBook) ?? null : null;

  const chapterCrossReferences = useMemo(
    () => crossReferences.filter((reference) => reference.verse_ref.startsWith(`${book} ${chapter}:`)),
    [book, chapter, crossReferences],
  );

  const chapterCommentaryEntries = useMemo(
    () => commentaryEntries.filter((entry) => entry.book === book && entry.chapter === chapter),
    [book, chapter, commentaryEntries],
  );

  const chapterAnalysis = useMemo(
    () => chapterAnalysisForVerses(chapterVerses, crossReferences),
    [chapterVerses, crossReferences],
  );

  const chapterKeyVerses = useMemo(() => {
    const scoreByRef = new Map<string, number>();
    chapterVerses.forEach((verse) => scoreByRef.set(verse.ref, verse.ref === selectedRef ? 3 : 0));
    chapterCrossReferences.forEach((reference) => {
      scoreByRef.set(reference.verse_ref, (scoreByRef.get(reference.verse_ref) ?? 0) + 2);
    });
    saved.bookmarks.forEach((bookmark) => {
      if (bookmark.verse_ref.startsWith(`${book} ${chapter}:`)) {
        scoreByRef.set(bookmark.verse_ref, (scoreByRef.get(bookmark.verse_ref) ?? 0) + 3);
      }
    });
    saved.highlights.forEach((highlight) => {
      if (highlight.verse_ref.startsWith(`${book} ${chapter}:`)) {
        scoreByRef.set(highlight.verse_ref, (scoreByRef.get(highlight.verse_ref) ?? 0) + 2);
      }
    });
    return Array.from(scoreByRef.entries())
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([ref]) => ref)
      .slice(0, 5);
  }, [book, chapter, chapterCrossReferences, chapterVerses, saved.bookmarks, saved.highlights, selectedRef]);

  const currentChapterPinned = useMemo(
    () => favoritePassages.some((passage) => passage.id === createBiblePassage(book, chapter, versesByRef.get(selectedRef)?.verse ?? verseJump).id),
    [book, chapter, favoritePassages, selectedRef, verseJump, versesByRef],
  );

  const currentBookProgress = useMemo(() => {
    const bookChapters = Array.from(new Set(allVerses.filter((verse) => verse.book === book).map((verse) => verse.chapter))).sort((a, b) => a - b);
    const chapterIndex = Math.max(0, bookChapters.indexOf(chapter));
    const selectedVerseNumber = versesByRef.get(selectedRef)?.verse ?? verseJump;
    const verseIndex = Math.max(0, chapterVerses.findIndex((verse) => verse.verse === selectedVerseNumber));
    const verseProgress = chapterVerses.length ? (verseIndex + 1) / chapterVerses.length : 0;
    const rawPercent = bookChapters.length ? ((chapterIndex + verseProgress) / bookChapters.length) * 100 : 0;

    return {
      book,
      chapter,
      percent: Math.min(100, Math.max(0, rawPercent)),
    };
  }, [allVerses, book, chapter, chapterVerses, selectedRef, verseJump, versesByRef]);

  const accountStatus = user
    ? "Signed in — syncing to Supabase"
    : "Signed out — saving locally";

  function saveDeviceFallback(updater: (state: SavedState) => SavedState) {
    setSaved((state) => {
      const nextState = updater(state);
      saveLocalState(nextState);
      return nextState;
    });
  }

  useEffect(() => {
    queueMicrotask(() => {
      setSaved(loadLocalState());
      setSavedLoaded(true);
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setLibraryProgress(loadLibraryProgress());
      setCompletedResources(loadCompletedResources());
      setListeningProgress(loadListeningProgress());
      setLibraryAnnotations(loadLibraryAnnotations());
      setBibleListeningProgress(loadBibleListeningProgress());
      setBiblePlaylists(loadBiblePlaylists());
      setScriptureMemory(loadScriptureMemory());
      setRecentPassages(loadRecentPassages());
      setFavoritePassages(loadFavoritePassages());
      setBibleMarkers(loadBibleMarkers());
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setHasSpeechSynthesis(typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setSpeechVoices(voices);
      setSelectedSpeechVoiceURI((current) => current || voices[0]?.voiceURI || "");
    };

    updateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoices);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/library")
      .then((response) => response.json())
      .then((data: { resources?: LibraryResource[] }) => {
        if (!cancelled) setLibraryResources(data.resources ?? []);
      })
      .catch(() => {
        if (!cancelled) setLibraryResources([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    speechRateRef.current = speechState.rate;
  }, [speechState.rate]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (sleepTimerRef.current) window.clearTimeout(sleepTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const query = dictionarySearchTerm.trim();
    if (query.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setDictionarySearchStatus("Searching Webster's 1828...");
      fetch(`/api/dictionary?query=${encodeURIComponent(query)}&limit=20`, {
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((data: { entries?: DictionarySearchResult[] }) => {
          setDictionarySearchResults(data.entries ?? []);
          setDictionarySearchStatus((data.entries ?? []).length ? "" : "No dictionary entries found yet.");
        })
        .catch((error: Error) => {
          if (error.name === "AbortError") return;
          setDictionarySearchResults([]);
          setDictionarySearchStatus("Dictionary search is not available yet.");
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [dictionarySearchTerm]);

  useEffect(() => {
    if (!savedLoaded || user) return;
    saveLocalState(saved);
  }, [saved, savedLoaded, user]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) return;

    Promise.all([
      supabase.from("user_notes").select("id, verse_ref, body, created_at").order("created_at", { ascending: false }),
      supabase.from("user_highlights").select("id, verse_ref, color, created_at"),
      supabase.from("user_bookmarks").select("id, verse_ref, created_at"),
    ]).then(([notesResult, highlightsResult, bookmarksResult]) => {
      if (notesResult.error || highlightsResult.error || bookmarksResult.error) return;
      setSaved({
        notes: notesResult.data ?? [],
        highlights: highlightsResult.data ?? [],
        bookmarks: bookmarksResult.data ?? [],
      });
      setSyncMessage("Synced with your account.");
    });
  }, [supabase, user]);

  useEffect(() => {
    if (user) return;
    queueMicrotask(() => {
      setSaved(loadLocalState());
      setSyncMessage(LOCAL_SYNC_MESSAGE);
    });
  }, [user]);

  useEffect(() => {
    if (!supabase) {
      queueMicrotask(() => {
        setCrossReferences(localCrossReferences);
      });
      return;
    }

    supabase
      .from("cross_references")
      .select("id, verse_ref, target_ref, label, source, source_id")
      .then(({ data, error }) => {
        if (error || !data?.length) {
          setCrossReferences(localCrossReferences);
          return;
        }
        setCrossReferences(mergeCrossReferences(localCrossReferences, data));
      });
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      queueMicrotask(() => {
        setCommentaryEntries(localCommentaryEntries);
      });
      return;
    }

    supabase
      .from("commentary_entries")
      .select("id, book, chapter, verse_start, verse_end, author, resource_title, entry_text, public_domain_status, source_url")
      .then(({ data, error }) => {
        if (error || !data?.length) {
          setCommentaryEntries(localCommentaryEntries);
          return;
        }
        setCommentaryEntries(activeCommentaryEntriesOnly(mergeCommentaryEntries(localCommentaryEntries, data)));
      });
  }, [supabase]);

  useEffect(() => {
    if (!selectedRef || tab !== "bible") return;
    window.requestAnimationFrame(() => {
      selectedVerseRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }, [selectedRef, book, chapter, tab]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  function recordRecentPassage(targetBook: string, targetChapter: number, targetVerse?: number) {
    const passage = createBiblePassage(targetBook, targetChapter, targetVerse);
    setRecentPassages((current) => {
      const next = [passage, ...current.filter((item) => item.id !== passage.id)].slice(0, RECENT_PASSAGE_LIMIT);
      saveRecentPassages(next);
      return next;
    });
  }

  function goToVerse(targetBook: string, targetChapter: number, targetVerse = 1, recentVerse: number | undefined = targetVerse) {
    setBook(targetBook);
    setChapter(targetChapter);
    setVerseJump(targetVerse);
    setSelectedRef(`${targetBook} ${targetChapter}:${targetVerse}`);
    setTab("bible");
    recordRecentPassage(targetBook, targetChapter, recentVerse);
  }

  function openSearchResult(verse: BibleVerse) {
    goToVerse(verse.book, verse.chapter, verse.verse);
    setFlashRef(verse.ref);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashRef(null), 2200);
  }

  function openChapterAnalysis() {
    setTab("bible");
    window.requestAnimationFrame(() => {
      document.getElementById("chapter-analysis-workflow")?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }

  function openReference(targetRef: string) {
    const targetVerse = allVerses.find((candidate) => candidate.ref === targetRef);
    if (!targetVerse) {
      setSyncMessage(`${targetRef} is not available in the local KJV data yet.`);
      return;
    }

    goToVerse(targetVerse.book, targetVerse.chapter, targetVerse.verse);
    setSyncMessage(`Opened ${targetRef}. Study drawer remains on ${studyRef ?? selectedRef}.`);
  }

  function openPassage(passage: BiblePassage) {
    goToVerse(passage.book, passage.chapter, passage.verse ?? 1, passage.verse);
    setSyncMessage(`Opened ${passage.label}.`);
  }

  function quickJumpToPassage(query: string) {
    const passage = parseQuickPassage(query, allVerses, books);
    if (!passage) {
      setSyncMessage("Enter a passage like John 3:16, Luke 24, or Romans 8.");
      return;
    }

    openPassage(passage);
  }

  function toggleCurrentChapterFavorite() {
    const passage = createBiblePassage(book, chapter, versesByRef.get(selectedRef)?.verse ?? verseJump);
    setFavoritePassages((current) => {
      const exists = current.some((item) => item.id === passage.id);
      const next = exists ? current.filter((item) => item.id !== passage.id) : [passage, ...current].slice(0, FAVORITE_PASSAGE_LIMIT);
      saveFavoritePassages(next);
      setSyncMessage(exists ? `${passage.label} removed from favorites.` : `${passage.label} pinned to favorites.`);
      return next;
    });
  }

  function saveCurrentBibleMarker(markerId: BibleMarkerId) {
    const passage = createBiblePassage(book, chapter, versesByRef.get(selectedRef)?.verse ?? verseJump);
    setBibleMarkers((current) => {
      const next = {
        ...current,
        [markerId]: passage,
      };
      saveBibleMarkers(next);
      return next;
    });
    setSyncMessage(`Marker ${markerId} saved to ${passage.label}.`);
  }

  function openBibleMarker(markerId: BibleMarkerId) {
    const marker = bibleMarkers[markerId];
    if (!marker) {
      saveCurrentBibleMarker(markerId);
      return;
    }

    openPassage(marker);
    setSyncMessage(`Opened Marker ${markerId}: ${marker.label}.`);
  }

  function openPersonStudy(personId: string) {
    setActivePersonId(personId);
    setStudyRef(null);
    setTab("personStudy");
  }

  function openBookIntroduction(targetBook = book) {
    if (!bookIntroductionsByBook.has(targetBook)) {
      setSyncMessage(`${targetBook} book introduction is not ready yet.`);
      return;
    }

    setBookIntroBook(targetBook);
    setStudyRef(null);
    setTab("bookIntro");
  }

  function saveLibraryProgressUpdate(slug: string, updater: (progress: LibraryProgress) => LibraryProgress) {
    const resource = libraryResources.find((candidate) => candidate.slug === slug);
    if (!resource) return;

    setLibraryProgress((state) => {
      const current = state[slug] ?? defaultLibraryProgress(resource, libraryFontSize);
      const updated = normalizeLibraryProgress(updater(current));
      const nextState = {
        ...state,
        [slug]: updated,
      };
      saveLibraryProgress(nextState);
      return nextState;
    });
  }

  function saveListeningProgressUpdate(resource: LibraryResource, progress: number, rate = speechRateRef.current) {
    setListeningProgress((state) => {
      const nextState = {
        ...state,
        [resource.slug]: {
          slug: resource.slug,
          title: resource.title,
          author: resource.author,
          progress: Math.min(100, Math.max(0, progress)),
          rate,
          updatedAt: new Date().toISOString(),
        },
      };
      saveListeningProgress(nextState);
      return nextState;
    });
  }

  function saveCompletedResource(resource: LibraryResource) {
    setCompletedResources((state) => {
      const nextState = {
        ...state,
        [resource.slug]: {
          slug: resource.slug,
          title: resource.title,
          author: resource.author,
          completedAt: new Date().toISOString(),
        },
      };
      saveCompletedResources(nextState);
      return nextState;
    });
  }

  function removeCompletedResource(slug: string) {
    setCompletedResources((state) => {
      const nextState = { ...state };
      delete nextState[slug];
      saveCompletedResources(nextState);
      return nextState;
    });
  }

  function markLibraryFinished(resource: LibraryResource) {
    saveLibraryProgressUpdate(resource.slug, (current) => ({
      ...current,
      title: resource.title,
      author: resource.author,
      progress: 100,
      updatedAt: new Date().toISOString(),
    }));
    saveCompletedResource(resource);
    saveListeningProgressUpdate(resource, 100);
    setSyncMessage(`${resource.title} marked finished.`);
  }

  function restartLibraryResource(resource: LibraryResource) {
    stopSpeech();
    saveLibraryProgressUpdate(resource.slug, (current) => ({
      ...current,
      title: resource.title,
      author: resource.author,
      progress: 0,
      bookmarks: [],
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    removeCompletedResource(resource.slug);
    saveListeningProgressUpdate(resource, 0);
    const node = libraryReaderRef.current;
    if (node) node.scrollTop = 0;
    setSyncMessage(`${resource.title} restarted.`);
  }

  async function openLibraryResource(slug: string, view: LibraryView = "detail") {
    setActiveLibrarySlug(slug);
    setLibraryView(view);
    setTab("library");

    if (view !== "reader") return;

    saveLibraryProgressUpdate(slug, (current) => ({
      ...current,
      fontSize: current.fontSize || libraryFontSize,
      title: current.title,
      author: current.author,
      startedAt: current.startedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setActiveLibraryLoading(true);
    try {
      const response = await fetch(`/api/library/${slug}`);
      const data = (await response.json()) as { resource?: LibraryResource; text?: string };
      setActiveLibraryText(data.text ?? "");
      const savedProgress = libraryProgress[slug];
      setLibraryFontSize(savedProgress?.fontSize ?? 18);
      window.requestAnimationFrame(() => {
        const node = libraryReaderRef.current;
        if (!node || !savedProgress) return;
        node.scrollTop = (node.scrollHeight - node.clientHeight) * (savedProgress.progress / 100);
      });
    } catch {
      setActiveLibraryText("Could not load this resource yet.");
    } finally {
      setActiveLibraryLoading(false);
    }
  }

  async function listenToLibraryProgress(progress: LibraryProgress | null) {
    if (!progress) {
      setTab("library");
      return;
    }

    const resource = libraryResources.find((candidate) => candidate.slug === progress.slug);
    if (!resource) {
      setTab("library");
      return;
    }

    try {
      const response = await fetch(`/api/library/${resource.slug}`);
      const data = (await response.json()) as { text?: string };
      const text = data.text ?? "";
      if (!text.trim()) {
        setSyncMessage("Could not load that library resource for listening yet.");
        return;
      }
      toggleSpeech(
        `resource-${resource.slug}`,
        resource.title,
        text,
        listeningProgress[resource.slug]?.progress ?? progress.progress,
        (nextProgress) => {
          saveListeningProgressUpdate(resource, nextProgress, speechRateRef.current);
          saveLibraryProgressUpdate(resource.slug, (current) => ({
            ...current,
            title: resource.title,
            author: resource.author,
            progress: nextProgress,
            updatedAt: new Date().toISOString(),
          }));
        },
      );
    } catch {
      setSyncMessage("Could not load that library resource for listening yet.");
    }
  }

  function handleLibraryScroll() {
    const node = libraryReaderRef.current;
    const resource = activeLibraryResource;
    if (!node || !resource) return;
    const scrollable = Math.max(1, node.scrollHeight - node.clientHeight);
    const progress = Math.min(100, Math.max(0, (node.scrollTop / scrollable) * 100));

    saveLibraryProgressUpdate(resource.slug, (current) => ({
      ...current,
      title: resource.title,
      author: resource.author,
      progress,
      fontSize: libraryFontSize,
      updatedAt: new Date().toISOString(),
    }));

    if (progress >= 99.5 && !completedResources[resource.slug]) {
      saveCompletedResource(resource);
    }
  }

  function bookmarkLibraryLocation() {
    const resource = activeLibraryResource;
    if (!resource) return;
    const progress = libraryProgress[resource.slug]?.progress ?? 0;
    saveLibraryProgressUpdate(resource.slug, (current) => ({
      ...current,
      bookmarks: Array.from(new Set([...current.bookmarks, Math.round(progress)]))
        .sort((a, b) => a - b)
        .slice(-12),
      updatedAt: new Date().toISOString(),
    }));
  }

  function selectedLibraryText() {
    if (typeof window === "undefined") return "";
    return window.getSelection()?.toString().trim().replace(/\s+/g, " ") ?? "";
  }

  function saveLibraryAnnotation(type: LibraryAnnotationType) {
    const resource = activeLibraryResource;
    if (!resource) return;

    const progress = Math.round(libraryProgress[resource.slug]?.progress ?? 0);
    const selectedText = selectedLibraryText();
    const note = libraryNoteDraft.trim();
    const text =
      selectedText ||
      (type === "bookmark" ? `Reader location at ${progress}%` : resource.title);

    if (type === "note" && !note) {
      setSyncMessage("Write a reader note first, then save it.");
      return;
    }

    const annotation: LibraryAnnotation = {
      id: `library-${type}-${Date.now()}`,
      resourceSlug: resource.slug,
      resourceTitle: resource.title,
      type,
      text,
      note: type === "note" ? note : undefined,
      location: progress,
      createdAt: new Date().toISOString(),
    };

    setLibraryAnnotations((state) => {
      const nextState = {
        ...state,
        [resource.slug]: [annotation, ...(state[resource.slug] ?? [])].slice(0, 80),
      };
      saveLibraryAnnotations(nextState);
      return nextState;
    });

    if (type === "bookmark") bookmarkLibraryLocation();
    if (type === "note") setLibraryNoteDraft("");
    setSyncMessage(`${type === "bookmark" ? "Bookmark" : type === "note" ? "Note" : "Highlight"} saved for ${resource.title}.`);
  }

  async function copyLibrarySelection() {
    const selectedText = selectedLibraryText();
    if (!selectedText) {
      setSyncMessage("Select text in the reader first, then copy.");
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedText);
      setSyncMessage("Selected text copied.");
    } catch {
      setSyncMessage("Copy is not available in this browser, but the text is still selected.");
    }
  }

  function jumpLibraryBookmark(progress: number) {
    const node = libraryReaderRef.current;
    if (!node) return;
    node.scrollTop = (node.scrollHeight - node.clientHeight) * (progress / 100);
  }

  function updateLibraryReaderSettings(settings: Partial<Pick<LibraryProgress, "lineSpacing" | "readingWidth" | "theme">>) {
    const resource = activeLibraryResource;
    if (!resource) return;
    saveLibraryProgressUpdate(resource.slug, (current) => ({
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
    }));
  }

  function speakCurrentChunk() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const chunks = speechChunksRef.current;
    const index = speechIndexRef.current;

    if (index >= chunks.length) {
      setSpeechState((state) => ({ ...state, playing: false, paused: false, progress: 100, sleepTimerMinutes: null, sleepTimerEndsAt: null }));
      speechProgressRef.current?.(100);
      speechCompleteRef.current?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.rate = speechRateRef.current;
    const selectedVoice = speechVoices.find((voice) => voice.voiceURI === selectedSpeechVoiceURI);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onstart = () => {
      const verseRef = speechVerseRefsRef.current[index];
      if (!verseRef) return;
      setSelectedRef(verseRef);
      setFlashRef(verseRef);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashRef(null), 1400);
      window.requestAnimationFrame(() => {
        selectedVerseRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    };
    utterance.onend = () => {
      if (speechCancelledRef.current) return;
      speechIndexRef.current += 1;
      const progress = Math.min(100, (speechIndexRef.current / Math.max(1, chunks.length)) * 100);
      speechProgressRef.current?.(progress);
      setSpeechState((state) => ({ ...state, progress }));
      speakCurrentChunk();
    };
    utterance.onerror = () => {
      setSpeechState((state) => ({ ...state, playing: false, paused: false }));
      setSyncMessage("Could not play audio on this device yet.");
    };
    window.speechSynthesis.speak(utterance);
  }

  function startSpeech(
    targetId: string,
    label: string,
    text: string,
    startProgress = 0,
    onProgress?: (progress: number) => void,
    options?: {
      chunks?: string[];
      verseRefs?: Array<string | null>;
      onComplete?: () => void;
    },
  ) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSyncMessage("Text-to-speech is not available in this browser.");
      return;
    }

    const chunks = options?.chunks ?? chunkSpeechText(text);
    if (!chunks.length) {
      setSyncMessage("No readable text is available for audio yet.");
      return;
    }

    speechCancelledRef.current = true;
    window.speechSynthesis.cancel();
    speechCancelledRef.current = false;
    if (sleepTimerRef.current) {
      window.clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    speechChunksRef.current = chunks;
    speechVerseRefsRef.current = options?.verseRefs ?? [];
    speechIndexRef.current = Math.min(chunks.length - 1, Math.max(0, Math.floor((startProgress / 100) * chunks.length)));
    speechProgressRef.current = onProgress ?? null;
    speechCompleteRef.current = options?.onComplete ?? null;
    setSpeechState((state) => ({
      ...state,
      targetId,
      label,
      playing: true,
      paused: false,
      progress: startProgress,
      sleepTimerMinutes: null,
      sleepTimerEndsAt: null,
    }));
    speakCurrentChunk();
  }

  function stopSpeech(message = "Audio stopped.") {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      speechCancelledRef.current = true;
      window.speechSynthesis.cancel();
      speechCancelledRef.current = false;
    }
    if (sleepTimerRef.current) {
      window.clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }
    speechCompleteRef.current = null;
    setSpeechState((state) => ({
      ...state,
      playing: false,
      paused: false,
      sleepTimerMinutes: null,
      sleepTimerEndsAt: null,
    }));
    setSyncMessage(message);
  }

  function pauseSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.pause();
    setSpeechState((state) => ({ ...state, paused: true }));
  }

  function resumeSpeech() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.resume();
    setSpeechState((state) => ({ ...state, paused: false, playing: true }));
  }

  function toggleSpeech(targetId: string, label: string, text: string, startProgress = 0, onProgress?: (progress: number) => void) {
    if (speechState.targetId === targetId && speechState.playing) {
      if (speechState.paused) {
        resumeSpeech();
      } else {
        pauseSpeech();
      }
      return;
    }

    startSpeech(targetId, label, text, startProgress, onProgress);
  }

  function updateSpeechRate(rate: number) {
    speechRateRef.current = rate;
    setSpeechState((state) => ({ ...state, rate }));
  }

  function setSleepTimer(minutes: number | null) {
    if (typeof window === "undefined") return;
    if (sleepTimerRef.current) {
      window.clearTimeout(sleepTimerRef.current);
      sleepTimerRef.current = null;
    }

    if (!minutes) {
      setSpeechState((state) => ({ ...state, sleepTimerMinutes: null, sleepTimerEndsAt: null }));
      setSyncMessage("Sleep timer cleared.");
      return;
    }

    const endsAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    sleepTimerRef.current = window.setTimeout(() => {
      stopSpeech("Sleep timer stopped audio.");
    }, minutes * 60 * 1000);
    setSpeechState((state) => ({ ...state, sleepTimerMinutes: minutes, sleepTimerEndsAt: endsAt }));
    setSyncMessage(`Sleep timer set for ${minutes} minutes.`);
  }

  function bibleSpeechText(verses: BibleVerse[]) {
    return verses.map((verse) => `${verse.ref}. ${verse.plainText}`).join(" ");
  }

  function saveBibleProgress(targetId: string, label: string, verses: BibleVerse[], progress: number) {
    const safeProgress = Math.min(100, Math.max(0, progress));
    const currentIndex = Math.min(verses.length - 1, Math.max(0, Math.floor((safeProgress / 100) * verses.length)));
    const currentVerse = verses[currentIndex] ?? verses.at(-1) ?? null;
    const nextProgress: BibleListeningProgress = {
      targetId,
      label,
      book: currentVerse?.book ?? book,
      chapter: currentVerse?.chapter ?? chapter,
      verseRef: currentVerse?.ref ?? null,
      progress: safeProgress,
      updatedAt: new Date().toISOString(),
    };
    setBibleListeningProgress(nextProgress);
    saveBibleListeningProgress(nextProgress);
  }

  function startBibleListening(verses: BibleVerse[], label: string, targetId: string, repeat = false, startProgress?: number) {
    if (!verses.length) {
      setSyncMessage("No Bible text is available for that listening selection.");
      return;
    }

    const chunks = verses.map((verse) => `${verse.ref}. ${verse.plainText}`);
    const verseRefs = verses.map((verse) => verse.ref);
    const savedStart = startProgress ?? (bibleListeningProgress?.targetId === targetId ? bibleListeningProgress.progress : 0);

    startSpeech(
      targetId,
      label,
      bibleSpeechText(verses),
      savedStart,
      (nextProgress) => saveBibleProgress(targetId, label, verses, nextProgress),
      {
        chunks,
        verseRefs,
        onComplete: repeat ? () => startBibleListening(verses, label, targetId, true, 0) : undefined,
      },
    );
  }

  function listenCurrentChapter() {
    startBibleListening(chapterVerses, `${book} ${chapter}`, `bible-chapter-${book}-${chapter}`, repeatChapter);
  }

  function listenFromCurrentVerse() {
    const selectedVerse = allVerses.find((verse) => verse.ref === selectedRef);
    const startVerse = selectedVerse?.book === book && selectedVerse.chapter === chapter ? selectedVerse.verse : verseJump;
    const verses = chapterVerses.filter((verse) => verse.verse >= startVerse);
    startBibleListening(verses, `${book} ${chapter}:${startVerse} onward`, `bible-from-${book}-${chapter}-${startVerse}`);
  }

  function listenSelectedRange() {
    const safeStart = Math.max(1, Math.min(versesMax(chapterVerses), listenRangeStart));
    const safeEnd = Math.max(1, Math.min(versesMax(chapterVerses), listenRangeEnd));
    const start = Math.min(safeStart, safeEnd);
    const end = Math.max(safeStart, safeEnd);
    const verses = chapterVerses.filter((verse) => verse.verse >= start && verse.verse <= end);
    startBibleListening(verses, `${book} ${chapter}:${start}-${end}`, `bible-range-${book}-${chapter}-${start}-${end}`);
  }

  function listenWholeBook() {
    const verses = allVerses.filter((verse) => verse.book === book);
    startBibleListening(verses, `${book}`, `bible-book-${book}`, repeatBook);
  }

  function createBiblePlaylist() {
    const trimmed = playlistName.trim() || `${book} ${chapter} Listening`;
    const safeStart = Math.max(1, Math.min(versesMax(chapterVerses), listenRangeStart));
    const safeEnd = Math.max(1, Math.min(versesMax(chapterVerses), listenRangeEnd));
    const start = Math.min(safeStart, safeEnd);
    const end = Math.max(safeStart, safeEnd);
    const nextPlaylist: BibleAudioPlaylist = {
      id: makeId("playlist"),
      name: trimmed,
      createdAt: new Date().toISOString(),
      items: [
        {
          id: makeId("playlist_item"),
          type: "bible_chapter",
          label: `${book} ${chapter}`,
          book,
          chapter,
        },
        {
          id: makeId("playlist_item"),
          type: "bible_verse_range",
          label: `${book} ${chapter}:${start}-${end}`,
          book,
          chapter,
          verseStart: start,
          verseEnd: end,
        },
        {
          id: makeId("playlist_item"),
          type: "commentary_placeholder",
          label: `${book} ${chapter} commentary placeholder`,
          book,
          chapter,
        },
        {
          id: makeId("playlist_item"),
          type: "library_placeholder",
          label: "Related library reading placeholder",
        },
      ],
    };
    setBiblePlaylists((current) => {
      const next = [nextPlaylist, ...current].slice(0, 12);
      saveBiblePlaylists(next);
      return next;
    });
    setSyncMessage(`Playlist "${trimmed}" saved locally.`);
  }

  function addMemoryVerse(ref: string) {
    const verse = allVerses.find((candidate) => candidate.ref === ref);
    if (!verse) return;

    setScriptureMemory((current) => {
      const existing = current.find((item) => item.verse_ref === ref);
      if (existing) return current;
      const next = [
        {
          id: makeId("memory"),
          verse_ref: verse.ref,
          verse_text: verse.text,
          progress: 0,
          repetitions: 0,
          last_reviewed_at: null,
          created_at: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 50);
      saveScriptureMemory(next);
      return next;
    });
    setSyncMessage(`${ref} added to memory list.`);
  }

  function updateMemoryProgress(ref: string, progress: number) {
    setScriptureMemory((current) => {
      const existing = current.find((item) => item.verse_ref === ref);
      const verse = allVerses.find((candidate) => candidate.ref === ref);
      if (!existing && !verse) return current;
      const safeProgress = Math.min(100, Math.max(0, progress));
      const now = new Date().toISOString();
      const next = existing
        ? current.map((item) =>
            item.verse_ref === ref
              ? {
                  ...item,
                  progress: safeProgress,
                  repetitions: item.repetitions + 1,
                  last_reviewed_at: now,
                }
              : item,
          )
        : [
            {
              id: makeId("memory"),
              verse_ref: ref,
              verse_text: verse?.text ?? "",
              progress: safeProgress,
              repetitions: 1,
              last_reviewed_at: now,
              created_at: now,
            },
            ...current,
          ];
      saveScriptureMemory(next);
      return next;
    });
    setSyncMessage(`${ref} memory progress updated.`);
  }

  function removeMemoryVerse(ref: string) {
    setScriptureMemory((current) => {
      const next = current.filter((item) => item.verse_ref !== ref);
      saveScriptureMemory(next);
      return next;
    });
    setSyncMessage(`${ref} removed from memory list.`);
  }

  function goChapter(direction: -1 | 1) {
    const next = chapterRefs[currentIndex + direction];
    if (!next) return;
    goToVerse(next.bookName, next.chapterNumber, 1, undefined);
  }

  function selectBook(nextBook: string) {
    const firstChapter = allVerses.find((verse) => verse.book === nextBook)?.chapter ?? 1;
    setBook(nextBook);
    setChapter(firstChapter);
    setVerseJump(1);
    setSelectedRef(`${nextBook} ${firstChapter}:1`);
    recordRecentPassage(nextBook, firstChapter);
  }

  function selectChapter(nextChapter: number) {
    setChapter(nextChapter);
    setVerseJump(1);
    setSelectedRef(`${book} ${nextChapter}:1`);
    recordRecentPassage(book, nextChapter);
  }

  function openStudyDrawer(ref: string, nextTab: StudyDrawerTab = "study") {
    if (studyRef !== ref) setActiveDictionaryEntry(null);
    setStudyRef(ref);
    setStudyTab(nextTab);
    const existingNote = notesByRef.get(ref)?.[0]?.body ?? "";
    setNoteDraft(existingNote);
  }

  async function toggleHighlight(ref: string) {
    const existing = highlightsByRef.get(ref);
    if (existing) {
      if (supabase && user) {
        const { error } = await supabase.from("user_highlights").delete().eq("id", existing.id);
        if (error) {
          saveDeviceFallback((state) => ({
            ...state,
            highlights: state.highlights.filter((highlight) => highlight.verse_ref !== ref),
          }));
          setSyncMessage(SYNC_ERROR_MESSAGE);
          return;
        }
      }

      setSaved((state) => ({
        ...state,
        highlights: state.highlights.filter((highlight) => highlight.verse_ref !== ref),
      }));
      setSyncMessage(user ? "Highlight removed from your account." : "Highlight removed locally.");
      return;
    }

    const fallbackHighlight: UserHighlight = {
      id: makeId("highlight"),
      verse_ref: ref,
      color: "gold",
      created_at: new Date().toISOString(),
    };
    if (supabase && user) {
      const { data, error } = await supabase.from("user_highlights").insert({
        verse_ref: ref,
        color: fallbackHighlight.color,
      }).select("id, verse_ref, color, created_at").single();

      if (!error && data) {
        setSaved((state) => ({ ...state, highlights: [...state.highlights, data] }));
        setSyncMessage("Highlight saved to your account.");
        return;
      }

      saveDeviceFallback((state) => ({ ...state, highlights: [...state.highlights, fallbackHighlight] }));
      setSyncMessage(SYNC_ERROR_MESSAGE);
      return;
    }

    setSaved((state) => ({ ...state, highlights: [...state.highlights, fallbackHighlight] }));
    setSyncMessage(LOCAL_SYNC_MESSAGE);
  }

  async function saveNote(ref: string) {
    const trimmed = noteDraft.trim();
    if (!trimmed) return;

    const existing = notesByRef.get(ref)?.[0];
    if (existing) {
      if (supabase && user) {
        const { error } = await supabase
          .from("user_notes")
          .update({ body: trimmed, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) {
          saveDeviceFallback((state) => ({
            ...state,
            notes: state.notes.map((note) => (note.id === existing.id ? { ...note, body: trimmed } : note)),
          }));
          setSyncMessage(SYNC_ERROR_MESSAGE);
          return;
        }
      }

      setSaved((state) => ({
        ...state,
        notes: state.notes.map((note) => (note.id === existing.id ? { ...note, body: trimmed } : note)),
      }));
      setSyncMessage(user ? "Note updated in your account." : "Note updated locally.");
      return;
    }

    const fallbackNote: UserNote = {
      id: makeId("note"),
      verse_ref: ref,
      body: trimmed,
      created_at: new Date().toISOString(),
    };
    if (supabase && user) {
      const { data, error } = await supabase.from("user_notes").insert({
        verse_ref: ref,
        body: trimmed,
      }).select("id, verse_ref, body, created_at").single();

      if (!error && data) {
        setSaved((state) => ({ ...state, notes: [data, ...state.notes] }));
        setSyncMessage("Note saved to your account.");
        return;
      }

      saveDeviceFallback((state) => ({ ...state, notes: [fallbackNote, ...state.notes] }));
      setSyncMessage(SYNC_ERROR_MESSAGE);
      return;
    }

    setSaved((state) => ({ ...state, notes: [fallbackNote, ...state.notes] }));
    setSyncMessage(LOCAL_SYNC_MESSAGE);
  }

  async function deleteNote(ref: string) {
    const existing = notesByRef.get(ref)?.[0];
    if (!existing) {
      setNoteDraft("");
      setSyncMessage("No saved note to delete.");
      return;
    }

    if (supabase && user) {
      const { error } = await supabase.from("user_notes").delete().eq("id", existing.id);
      if (error) {
        saveDeviceFallback((state) => ({
          ...state,
          notes: state.notes.filter((note) => note.id !== existing.id),
        }));
        setNoteDraft("");
        setSyncMessage(SYNC_ERROR_MESSAGE);
        return;
      }
    }

    setSaved((state) => ({
      ...state,
      notes: state.notes.filter((note) => note.id !== existing.id),
    }));
    setNoteDraft("");
    setSyncMessage(user ? "Note deleted from your account." : "Note deleted locally.");
  }

  async function toggleBookmark(ref: string) {
    const existing = bookmarksByRef.get(ref);
    if (existing) {
      if (supabase && user) {
        const { error } = await supabase.from("user_bookmarks").delete().eq("id", existing.id);
        if (error) {
          saveDeviceFallback((state) => ({
            ...state,
            bookmarks: state.bookmarks.filter((bookmark) => bookmark.verse_ref !== ref),
          }));
          setSyncMessage(SYNC_ERROR_MESSAGE);
          return;
        }
      }

      setSaved((state) => ({
        ...state,
        bookmarks: state.bookmarks.filter((bookmark) => bookmark.verse_ref !== ref),
      }));
      setSyncMessage(user ? "Bookmark removed from your account." : "Bookmark removed locally.");
      return;
    }

    const fallbackBookmark: UserBookmark = {
      id: makeId("bookmark"),
      verse_ref: ref,
      created_at: new Date().toISOString(),
    };
    if (supabase && user) {
      const { data, error } = await supabase.from("user_bookmarks").insert({
        verse_ref: ref,
      }).select("id, verse_ref, created_at").single();

      if (!error && data) {
        setSaved((state) => ({ ...state, bookmarks: [data, ...state.bookmarks] }));
        setSyncMessage("Bookmark saved to your account.");
        return;
      }

      saveDeviceFallback((state) => ({ ...state, bookmarks: [fallbackBookmark, ...state.bookmarks] }));
      setSyncMessage(SYNC_ERROR_MESSAGE);
      return;
    }

    setSaved((state) => ({ ...state, bookmarks: [fallbackBookmark, ...state.bookmarks] }));
    setSyncMessage(LOCAL_SYNC_MESSAGE);
  }

  async function copyVerse(ref: string) {
    const verse = allVerses.find((candidate) => candidate.ref === ref);
    if (!verse) return;
    await navigator.clipboard.writeText(`${verse.ref} ${verse.text}`);
    setSyncMessage("Verse copied.");
  }

  async function shareVerse(ref: string) {
    const verse = allVerses.find((candidate) => candidate.ref === ref);
    if (!verse) return;
    const shareText = `${verse.ref} ${verse.text}`;

    if (navigator.share) {
      await navigator.share({ title: verse.ref, text: shareText });
      setSyncMessage("Share sheet opened.");
      return;
    }

    await navigator.clipboard.writeText(shareText);
    setSyncMessage("Share is not available here, so the verse was copied.");
  }

  async function sendMagicLink() {
    if (!supabase) {
      setAuthMessage("Supabase is not configured. Add env values to enable account sign-in.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: authEmail,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setAuthMessage(error ? error.message : "Check your email for the sign-in link.");
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSyncMessage("Signed out. Local study data is active.");
  }

  function exportStudyData() {
    const payload = {
      app: "Father's Business Bible Study",
      exported_at: new Date().toISOString(),
      account_mode: user ? "signed_in_supabase" : "signed_out_local",
      user_email: user?.email ?? null,
      data: saved,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fathers-business-bible-study-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setSyncMessage("Study data export downloaded.");
  }

  async function lookupWord(word: string) {
    const fallbackEntry = findDictionaryEntry(word);
    setActiveDictionaryEntry(fallbackEntry);
    setStudyTab("dictionary");

    try {
      const response = await fetch(`/api/dictionary/${encodeURIComponent(word)}`);
      if (response.ok) {
        const data = (await response.json()) as {
          word: string;
          lookupWord: string;
          found: boolean;
          entries?: DictionarySearchResult[];
        };
        const definitions = data.entries ?? [];
        if (data.found && definitions.length) {
          setActiveDictionaryEntry({
            word: data.word,
            lookupWord: data.lookupWord,
            definition: definitions
              .slice(0, 3)
              .map((entry) => entry.definition)
              .join("\n\n"),
            found: true,
          });
          return;
        }
      }
    } catch {
      // Keep the local starter definition visible and try Supabase next.
    }

    if (!supabase) return;

    const { data, error } = await supabase
      .from("dictionary_entries")
      .select("headword, normalized_headword, definition")
      .eq("normalized_headword", fallbackEntry.lookupWord)
      .limit(5);

    if (error) {
      setSyncMessage(SYNC_ERROR_MESSAGE);
      return;
    }

    const bestEntry = data?.sort((a, b) => b.definition.length - a.definition.length)[0];
    if (!bestEntry) return;

    setActiveDictionaryEntry({
      word: cleanWord(word) || bestEntry.headword,
      lookupWord: bestEntry.normalized_headword,
      definition: bestEntry.definition,
      found: true,
    });
  }

  const activeVerse = allVerses.find((verse) => verse.ref === studyRef);
  const activeCrossReferences = crossReferences.filter((reference) => reference.verse_ref === studyRef);
  const activeCommentaryEntries = activeVerse
    ? commentaryEntries.filter(
        (entry) =>
          entry.book === activeVerse.book &&
          entry.chapter === activeVerse.chapter &&
          activeVerse.verse >= entry.verse_start &&
          activeVerse.verse <= entry.verse_end,
      )
    : [];
  const fullStudyVerse = allVerses.find((verse) => verse.ref === fullStudyRef);
  const fullStudyCrossReferences = crossReferences.filter((reference) => reference.verse_ref === fullStudyRef).slice(0, 3);
  const fullStudyCommentaryEntries = fullStudyVerse
    ? commentaryEntries.filter(
        (entry) =>
          entry.book === fullStudyVerse.book &&
          entry.chapter === fullStudyVerse.chapter &&
          fullStudyVerse.verse >= entry.verse_start &&
          fullStudyVerse.verse <= entry.verse_end,
      )
    : [];
  const fullStudyConnections = useMemo<ActiveChapterConnections>(() => {
    const connection = fullStudyVerse
      ? chapterConnections.find((item) => item.book === fullStudyVerse.book && item.chapter === fullStudyVerse.chapter)
      : null;
    const resolve = <T,>(ids: string[], source: Map<string, T>) =>
      ids.flatMap((id) => {
        const item = source.get(id);
        return item ? [item] : [];
      });

    return {
      people: resolve(connection?.peopleIds ?? [], peopleById),
      places: resolve(connection?.placeIds ?? [], placesById),
      timeline: resolve(connection?.timelineIds ?? [], timelineById),
      types: resolve(connection?.typeIds ?? [], typesById),
      prophecies: resolve(connection?.prophecyIds ?? [], propheciesById),
      themes: connection?.themes ?? [],
    };
  }, [fullStudyVerse, peopleById, placesById, propheciesById, timelineById, typesById]);

  return (
    <main className="min-h-screen bg-[var(--page)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col bg-[var(--paper)] shadow-2xl shadow-stone-950/10 md:my-6 md:min-h-[calc(100vh-3rem)] md:rounded-[1.75rem] md:border md:border-stone-200">
        <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[var(--paper)]/95 px-4 py-3 backdrop-blur md:rounded-t-[1.75rem]">
          <div className="flex items-center justify-between gap-3">
            <button
              className="flex min-w-0 flex-col text-left"
              onClick={() => setTab("today")}
              type="button"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Father&apos;s Business
              </span>
              <span className="truncate text-lg font-semibold text-[var(--ink)]">Bible Study</span>
            </button>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 text-sm font-semibold text-[var(--green)] shadow-sm"
              onClick={listenCurrentChapter}
              type="button"
              title="Listen to current chapter"
            >
              {speechState.targetId === `bible-chapter-${book}-${chapter}` && speechState.playing && !speechState.paused ? (
                <Pause size={17} />
              ) : (
                <Headphones size={17} />
              )}
              {speechState.targetId === `bible-chapter-${book}-${chapter}` && speechState.playing && !speechState.paused ? "Pause" : "Listen"}
            </button>
          </div>
          <div className="mt-3 inline-flex max-w-full items-center rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
            {accountStatus}
          </div>
        </header>

        <div className="grid flex-1 md:grid-cols-[260px_1fr]">
          <aside className="hidden border-r border-stone-200 bg-white/45 p-4 md:block">
            <nav className="space-y-2">
              <NavButton icon={<HomeIcon size={18} />} label="Today" active={tab === "today"} onClick={() => setTab("today")} />
              <NavButton icon={<BookOpen size={18} />} label="Bible" active={tab === "bible"} onClick={() => setTab("bible")} />
              <NavButton icon={<Search size={18} />} label="Search" active={tab === "search"} onClick={() => setTab("search")} />
              <NavButton
                icon={<Library size={18} />}
                label="Library"
                active={tab === "library"}
                onClick={() => {
                  setLibraryView("home");
                  setTab("library");
                }}
              />
              <NavButton icon={<NotebookPen size={18} />} label="Notes" active={tab === "notes"} onClick={() => setTab("notes")} />
              <NavButton icon={<Settings size={18} />} label="Settings" active={tab === "settings"} onClick={() => setTab("settings")} />
            </nav>

            <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--warm)] p-4">
              <p className="text-sm font-semibold text-[var(--ink)]">Current place</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--green)]">
                {book} {chapter}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Full KJV reader, search, highlights, notes, bookmarks, and dictionary lookup are wired for this first prototype.
              </p>
            </div>
          </aside>

          <section className="min-w-0 pb-32 md:pb-6">
            {tab === "today" && (
              <TodayScreen
                book={book}
                chapter={chapter}
                chapterAnalysis={chapterAnalysis}
                currentLibraryProgress={todayLibraryProgress}
                keyWords={keyWordsForVerse(versesByRef.get(selectedRef) ?? versesByRef.get("John 3:16") ?? chapterVerses[0] ?? allVerses[0]!)}
                memoryItem={scriptureMemory.find((item) => item.verse_ref === selectedRef) ?? null}
                selectedVerse={versesByRef.get(selectedRef) ?? versesByRef.get("John 3:16") ?? chapterVerses[0] ?? allVerses[0]!}
                selectedRef={selectedRef}
                noteCount={saved.notes.length}
                highlightCount={saved.highlights.length}
                bookmarkCount={saved.bookmarks.length}
                onContinue={() => setTab("bible")}
                onJohn316={() => goToVerse("John", 3, 16)}
                onListen={listenCurrentChapter}
                onOpenChapterAnalysis={openChapterAnalysis}
                onOpenLibrary={() => {
                  if (todayLibraryProgress) {
                    void openLibraryResource(todayLibraryProgress.slug, "reader");
                    return;
                  }
                  setTab("library");
                }}
                onListenLibrary={() => {
                  void listenToLibraryProgress(todayLibraryProgress);
                }}
                onRepeatMemory={(ref, nextProgress) => updateMemoryProgress(ref, nextProgress)}
              />
            )}

            {tab === "bible" && (
              <BibleReader
                book={book}
                books={books}
                chapter={chapter}
                chapters={chapters}
                verseJump={verseJump}
                verses={chapterVerses}
                selectedRef={selectedRef}
                flashRef={flashRef}
                hasPrevious={currentIndex > 0}
                hasNext={currentIndex < chapterRefs.length - 1}
                highlightsByRef={highlightsByRef}
                notesByRef={notesByRef}
                bookmarksByRef={bookmarksByRef}
                selectedVerseRef={selectedVerseRef}
                allVerses={allVerses}
                versesByRef={versesByRef}
                chapterAnalysis={chapterAnalysis}
                chapterConnectionsData={activeChapterConnections}
                chapterCrossReferences={chapterCrossReferences}
                chapterCommentaryEntries={chapterCommentaryEntries}
                chapterKeyVerses={chapterKeyVerses}
                chapterResourceRecommendations={activeChapterResourceRecommendations}
                bookIntroduction={activeBookIntroduction}
                scriptureMemory={scriptureMemory}
                recentPassages={recentPassages}
                favoritePassages={favoritePassages}
                bibleMarkers={bibleMarkers}
                currentChapterPinned={currentChapterPinned}
                readingProgress={currentBookProgress}
                speechState={speechState}
                bibleListeningProgress={bibleListeningProgress}
                listenRangeStart={listenRangeStart}
                listenRangeEnd={listenRangeEnd}
                repeatChapter={repeatChapter}
                repeatBook={repeatBook}
                stopAfterSelection={stopAfterSelection}
                hasSpeechSynthesis={hasSpeechSynthesis}
                playlists={biblePlaylists}
                playlistName={playlistName}
                listenStatusMessage={syncMessage}
                onBookChange={selectBook}
                onChapterChange={selectChapter}
                onVerseJumpChange={setVerseJump}
                onVerseSelect={(verse) => goToVerse(book, chapter, verse, verse)}
                onPrevious={() => goChapter(-1)}
                onNext={() => goChapter(1)}
                onQuickJump={quickJumpToPassage}
                onOpenPassage={openPassage}
                onToggleCurrentFavorite={toggleCurrentChapterFavorite}
                onOpenMarker={openBibleMarker}
                onSaveMarker={saveCurrentBibleMarker}
                onListenCurrentChapter={listenCurrentChapter}
                onListenFromCurrentVerse={listenFromCurrentVerse}
                onListenRange={listenSelectedRange}
                onListenWholeBook={listenWholeBook}
                onStopListening={() => stopSpeech()}
                onListenRangeStartChange={setListenRangeStart}
                onListenRangeEndChange={setListenRangeEnd}
                onRepeatChapterChange={setRepeatChapter}
                onRepeatBookChange={setRepeatBook}
                onStopAfterSelectionChange={setStopAfterSelection}
                onPlaylistNameChange={setPlaylistName}
                onCreatePlaylist={createBiblePlaylist}
                onAddMemoryVerse={addMemoryVerse}
                onUpdateMemoryProgress={updateMemoryProgress}
                onRemoveMemoryVerse={removeMemoryVerse}
                onOpenReference={openReference}
                onOpenBookIntroduction={() => openBookIntroduction(book)}
                onOpenLibraryResource={(slug) => {
                  void openLibraryResource(slug, "detail");
                }}
                onOpenPersonStudy={openPersonStudy}
                onVerseClick={(ref) => {
                  setSelectedRef(ref);
                  openStudyDrawer(ref);
                }}
                onWordClick={(word, ref) => {
                  setSelectedRef(ref);
                  setStudyRef(ref);
                  void lookupWord(word);
                }}
              />
            )}

            {tab === "search" && (
              <SearchScreen
                searchTerm={searchTerm}
                searchFilter={searchFilter}
                results={searchResults}
                dictionarySearchTerm={dictionarySearchTerm}
                dictionarySearchResults={dictionarySearchResults}
                dictionarySearchStatus={dictionarySearchStatus}
                onSearchTermChange={setSearchTerm}
                onSearchFilterChange={setSearchFilter}
                onDictionarySearchTermChange={(value) => {
                  setDictionarySearchTerm(value);
                  if (value.trim().length < 2) {
                    setDictionarySearchResults([]);
                    setDictionarySearchStatus("");
                  }
                }}
                onOpenVerse={openSearchResult}
                onOpenDictionaryEntry={(entry) => {
                  setActiveDictionaryEntry({
                    word: entry.headword.toLowerCase(),
                    lookupWord: entry.normalized_headword,
                    definition: entry.definition,
                    found: true,
                  });
                  setStudyTab("dictionary");
                  if (selectedRef) setStudyRef(selectedRef);
                  setTab("bible");
                }}
              />
            )}

            {tab === "notes" && (
              <NotesScreen
                notes={saved.notes}
                highlights={saved.highlights}
                bookmarks={saved.bookmarks}
                verses={allVerses}
                onOpenVerse={(verse) => {
                  goToVerse(verse.book, verse.chapter, verse.verse);
                  openStudyDrawer(verse.ref);
                }}
              />
            )}

            {tab === "library" && (
              <LibraryScreen
                view={libraryView}
                resources={libraryResources}
                filteredResources={filteredLibraryResources}
                categories={libraryCategories}
                activeCategory={libraryCategory}
                searchTerm={librarySearchTerm}
                activeResource={activeLibraryResource}
                activeText={activeLibraryText}
                loading={activeLibraryLoading}
                progressState={libraryProgress}
                completedResources={completedLibraryResources}
                completedState={completedResources}
                listeningProgress={listeningProgress}
                annotations={libraryAnnotations}
                noteDraft={libraryNoteDraft}
                continueReadingResources={continueReadingResources}
                featuredResources={featuredLibraryResources}
                stats={libraryStats}
                fontSize={libraryFontSize}
                speechState={speechState}
                speechVoices={speechVoices}
                selectedSpeechVoiceURI={selectedSpeechVoiceURI}
                readerRef={libraryReaderRef}
                onCategoryChange={setLibraryCategory}
                onSearchTermChange={setLibrarySearchTerm}
                onOpenHome={() => setLibraryView("home")}
                onOpenDetail={(slug) => {
                  void openLibraryResource(slug, "detail");
                }}
                onOpenReader={(slug) => {
                  void openLibraryResource(slug, "reader");
                }}
                onScrollReader={handleLibraryScroll}
                onFontSizeChange={(size) => {
                  setLibraryFontSize(size);
                  if (activeLibraryResource) {
                    saveLibraryProgressUpdate(activeLibraryResource.slug, (current) => ({
                      ...current,
                      fontSize: size,
                      updatedAt: new Date().toISOString(),
                    }));
                  }
                }}
                onReaderSettingsChange={updateLibraryReaderSettings}
                onBookmarkLocation={bookmarkLibraryLocation}
                onJumpBookmark={jumpLibraryBookmark}
                onNoteDraftChange={setLibraryNoteDraft}
                onSaveAnnotation={saveLibraryAnnotation}
                onCopySelection={copyLibrarySelection}
                onListenResource={(resource, text, progress) => {
                  const listeningStart = listeningProgress[resource.slug]?.progress ?? progress;
                  toggleSpeech(
                    `resource-${resource.slug}`,
                    resource.title,
                    text,
                    listeningStart,
                    (nextProgress) => {
                      saveListeningProgressUpdate(resource, nextProgress, speechRateRef.current);
                      saveLibraryProgressUpdate(resource.slug, (current) => ({
                        ...current,
                        title: resource.title,
                        author: resource.author,
                        progress: nextProgress,
                        fontSize: libraryFontSize,
                        updatedAt: new Date().toISOString(),
                      }));
                      if (nextProgress >= 99.5) {
                        saveCompletedResource(resource);
                      }
                    },
                  );
                }}
                onSpeechRateChange={(rate) => {
                  updateSpeechRate(rate);
                  if (activeLibraryResource) {
                    saveListeningProgressUpdate(
                      activeLibraryResource,
                      listeningProgress[activeLibraryResource.slug]?.progress ?? libraryProgress[activeLibraryResource.slug]?.progress ?? 0,
                      rate,
                    );
                  }
                }}
                onSpeechVoiceChange={setSelectedSpeechVoiceURI}
                onStopSpeech={() => stopSpeech()}
                onSleepTimerChange={setSleepTimer}
                onMarkFinished={markLibraryFinished}
                onRestartResource={restartLibraryResource}
                onRemoveCompleted={removeCompletedResource}
                onReadAgain={(slug) => {
                  const resource = libraryResources.find((candidate) => candidate.slug === slug);
                  if (!resource) return;
                  restartLibraryResource(resource);
                  void openLibraryResource(slug, "reader");
                }}
              />
            )}

            {tab === "fullStudy" && fullStudyVerse && (
              <FullStudyScreen
                verse={fullStudyVerse}
                keyWords={keyWordsForVerse(fullStudyVerse)}
                crossReferences={fullStudyCrossReferences}
                commentaryEntries={fullStudyCommentaryEntries}
                connections={fullStudyConnections}
                versesByRef={versesByRef}
                existingNote={notesByRef.get(fullStudyVerse.ref)?.[0] ?? null}
                highlighted={highlightsByRef.has(fullStudyVerse.ref)}
                bookmarked={bookmarksByRef.has(fullStudyVerse.ref)}
                noteDraft={noteDraft}
                syncMessage={syncMessage}
                memoryItem={scriptureMemory.find((item) => item.verse_ref === fullStudyVerse.ref) ?? null}
                onBack={() => setTab("bible")}
                onNoteDraftChange={setNoteDraft}
                onSaveNote={() => saveNote(fullStudyVerse.ref)}
                onHighlight={() => toggleHighlight(fullStudyVerse.ref)}
                onBookmark={() => toggleBookmark(fullStudyVerse.ref)}
                onOpenReference={openReference}
                onAddMemory={() => addMemoryVerse(fullStudyVerse.ref)}
                onUpdateMemoryProgress={(progress) => updateMemoryProgress(fullStudyVerse.ref, progress)}
                onRemoveMemory={() => removeMemoryVerse(fullStudyVerse.ref)}
              />
            )}

            {tab === "personStudy" && activePerson && (
              <PersonStudyScreen
                person={activePerson}
                versesByRef={versesByRef}
                onBack={() => setTab("bible")}
                onOpenReference={openReference}
              />
            )}

            {tab === "bookIntro" && activeBookIntro && (
              <BookIntroScreen
                intro={activeBookIntro}
                versesByRef={versesByRef}
                onBack={() => setTab("bible")}
                onOpenReference={openReference}
                onOpenLibraryResource={(slug) => {
                  void openLibraryResource(slug, "detail");
                }}
              />
            )}

            {tab === "bookIntro" && !activeBookIntro && (
              <div className="p-4 md:p-8">
                <EmptyState title="Book introduction not ready" body="Reviewed book introductions are being added one book at a time." />
              </div>
            )}

            {tab === "settings" && (
              <SettingsScreen
                hasSupabaseConfig={hasSupabaseConfig}
                hasSupabaseUrl={Boolean(supabaseUrl)}
                hasSupabaseAnonKey={Boolean(supabaseAnonKey)}
                user={user}
                authEmail={authEmail}
                authMessage={authMessage}
                noteCount={saved.notes.length}
                highlightCount={saved.highlights.length}
                bookmarkCount={saved.bookmarks.length}
                exportMessage={syncMessage}
                onAuthEmailChange={setAuthEmail}
                onSendMagicLink={sendMagicLink}
                onSignOut={signOut}
                onExportStudyData={exportStudyData}
              />
            )}
          </section>
        </div>

        <MobileNav tab={tab} onTab={setTab} />
      </div>

      {tab === "bible" && studyRef && activeVerse && (
        <StudyDrawer
          verse={activeVerse}
          activeTab={studyTab}
          dictionaryEntry={activeDictionaryEntry}
          crossReferences={activeCrossReferences}
          commentaryEntries={activeCommentaryEntries}
          bookIntroduction={activeVerse ? bookIntroductionsByBook.get(activeVerse.book) ?? null : null}
          versesByRef={versesByRef}
          allVerses={allVerses}
          existingNote={notesByRef.get(studyRef)?.[0] ?? null}
          highlighted={highlightsByRef.has(studyRef)}
          bookmarked={bookmarksByRef.has(studyRef)}
          memoryItem={scriptureMemory.find((item) => item.verse_ref === studyRef) ?? null}
          noteDraft={noteDraft}
          audioPlaying={speechState.targetId === `verse-${studyRef}` && speechState.playing && !speechState.paused}
          speechRate={speechState.rate}
          syncMessage={syncMessage}
          storageMode={user ? "Supabase account" : "Local fallback"}
          onActiveTabChange={setStudyTab}
          onNoteDraftChange={setNoteDraft}
          onClose={() => setStudyRef(null)}
          onHighlight={() => toggleHighlight(studyRef)}
          onBookmark={() => toggleBookmark(studyRef)}
          onCopy={() => copyVerse(studyRef)}
          onShare={() => shareVerse(studyRef)}
          onSaveNote={() => saveNote(studyRef)}
          onDeleteNote={() => deleteNote(studyRef)}
          onLookupWord={(word) => {
            void lookupWord(word);
          }}
          onOpenReference={openReference}
          onOpenBookIntroduction={() => {
            if (activeVerse) openBookIntroduction(activeVerse.book);
          }}
          onAddMemory={() => addMemoryVerse(studyRef)}
          onUpdateMemoryProgress={(progress) => updateMemoryProgress(studyRef, progress)}
          onRemoveMemory={() => removeMemoryVerse(studyRef)}
          onOpenFullStudy={() => {
            setFullStudyRef(studyRef);
            setNoteDraft(notesByRef.get(studyRef)?.[0]?.body ?? "");
            setStudyRef(null);
            setTab("fullStudy");
          }}
          onToggleAudio={() => toggleSpeech(`verse-${studyRef}`, studyRef, `${studyRef}. ${activeVerse.plainText}`)}
          onSpeechRateChange={updateSpeechRate}
        />
      )}
    </main>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
        active
          ? "bg-[var(--green)] text-white shadow-sm"
          : "text-[var(--muted)] hover:bg-white hover:text-[var(--ink)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function TodayScreen({
  book,
  chapter,
  chapterAnalysis,
  currentLibraryProgress,
  keyWords,
  memoryItem,
  selectedVerse,
  selectedRef,
  noteCount,
  highlightCount,
  bookmarkCount,
  onContinue,
  onJohn316,
  onListen,
  onOpenChapterAnalysis,
  onOpenLibrary,
  onListenLibrary,
  onRepeatMemory,
}: {
  book: string;
  chapter: number;
  chapterAnalysis: ChapterStudyAnalysis;
  currentLibraryProgress: LibraryProgress | null;
  keyWords: string[];
  memoryItem: ScriptureMemoryItem | null;
  selectedVerse: BibleVerse;
  selectedRef: string;
  noteCount: number;
  highlightCount: number;
  bookmarkCount: number;
  onContinue: () => void;
  onJohn316: () => void;
  onListen: () => void;
  onOpenChapterAnalysis: () => void;
  onOpenLibrary: () => void;
  onListenLibrary: () => void;
  onRepeatMemory: (ref: string, nextProgress: number) => void;
}) {
  const [memoryMode, setMemoryMode] = useState<"repeat" | "hide" | "letters">("repeat");
  const memoryProgress = memoryItem?.progress ?? 0;
  const repeatedWords = chapterAnalysis.repeatedWords.slice(0, 6);

  return (
    <div className="space-y-4 p-4 pb-36 md:p-8 md:pb-10">
      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Today</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
          Walk with the Lord today
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Start simple: read, listen, study one chapter, memorize one verse, pray, and write down what the Lord is teaching you.
        </p>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <TodayCard
          icon={<BookOpen size={18} />}
          title="Continue Bible Reading"
          action={
            <button className="rounded-full bg-[var(--green)] px-4 py-2 text-xs font-semibold text-white" onClick={onContinue} type="button">
              Continue
            </button>
          }
        >
          <p className="text-2xl font-semibold text-[var(--ink)]">{book} {chapter}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Pick up where you left off in the KJV reader.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)]" onClick={onListen} type="button">
              <Headphones size={15} />
              Listen
            </button>
            <button className="rounded-full border border-[var(--line)] bg-[var(--warm)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)]" onClick={onJohn316} type="button">
              John 3:16
            </button>
          </div>
        </TodayCard>

        <TodayCard
          icon={<BarChart3 size={18} />}
          title="Study This Chapter"
          action={
            <button className="rounded-full bg-[var(--green)] px-4 py-2 text-xs font-semibold text-white" onClick={onOpenChapterAnalysis} type="button">
              Chapter Analysis
            </button>
          }
        >
          <p className="text-2xl font-semibold text-[var(--ink)]">{book} {chapter}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat label="Words" value={String(chapterAnalysis.stats.words)} />
            <MiniStat label="Verses" value={String(chapterAnalysis.stats.verses)} />
            <MiniStat label="Selected" value={String(wordsFromText(selectedVerse.plainText).length)} />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Key words</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {keyWords.slice(0, 6).map((word) => (
              <span key={`today-key-${word}`} className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]">
                {word}
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Repeated words</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {repeatedWords.map((item) => (
              <span key={`today-repeat-${item.word}`} className="rounded-full bg-[var(--warm)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                {item.word} {item.count}
              </span>
            ))}
          </div>
        </TodayCard>

        <TodayCard
          icon={<Brain size={18} />}
          title="Memory Verse"
          action={<span className="rounded-full bg-[var(--paper)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">{formatPercent(memoryProgress)}</span>}
        >
          <p className="text-sm font-semibold text-[var(--green)]">{selectedVerse.ref}</p>
          <p className="mt-2 font-serif text-lg leading-8 text-[var(--scripture-ink)]">
            {memoryMode === "hide" ? hideEveryOtherWord(selectedVerse.text) : memoryMode === "letters" ? firstLetterPrompt(selectedVerse.text) : selectedVerse.text}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              className={`rounded-full px-3 py-2 text-xs font-semibold ${memoryMode === "repeat" ? "bg-[var(--green)] text-white" : "border border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"}`}
              onClick={() => {
                setMemoryMode("repeat");
                onRepeatMemory(selectedVerse.ref, Math.min(100, memoryProgress + 25));
              }}
              type="button"
            >
              Repeat
            </button>
            <button
              className={`rounded-full px-3 py-2 text-xs font-semibold ${memoryMode === "hide" ? "bg-[var(--green)] text-white" : "border border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"}`}
              onClick={() => setMemoryMode("hide")}
              type="button"
            >
              Hide Words
            </button>
            <button
              className={`rounded-full px-3 py-2 text-xs font-semibold ${memoryMode === "letters" ? "bg-[var(--green)] text-white" : "border border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"}`}
              onClick={() => setMemoryMode("letters")}
              type="button"
            >
              First Letters
            </button>
          </div>
        </TodayCard>

        <TodayCard
          icon={<Library size={18} />}
          title="Continue Library Reading"
          action={
            <button className="rounded-full bg-[var(--green)] px-4 py-2 text-xs font-semibold text-white" onClick={onOpenLibrary} type="button">
              Open
            </button>
          }
        >
          {currentLibraryProgress ? (
            <>
              <p className="text-lg font-semibold text-[var(--ink)]">{currentLibraryProgress.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{currentLibraryProgress.author}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[var(--green)]" style={{ width: formatPercent(currentLibraryProgress.progress) }} />
              </div>
              <p className="mt-2 text-sm font-semibold text-[var(--muted)]">{formatPercent(currentLibraryProgress.progress)} complete</p>
              <button className="mt-3 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)]" onClick={onListenLibrary} type="button">
                <Headphones size={15} />
                Listen
              </button>
            </>
          ) : (
            <p className="text-sm leading-6 text-[var(--muted)]">Open the Library and start a public-domain resource. Continue Reading will appear here.</p>
          )}
        </TodayCard>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <TodayCard icon={<MessageSquareText size={18} />} title="Prayer Focus Placeholder">
          <div className="grid gap-2 sm:grid-cols-3">
            <PlaceholderPill label="Missionary" value="Coming soon" />
            <PlaceholderPill label="Church member" value="Coming soon" />
            <PlaceholderPill label="Ministry" value="Coming soon" />
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Prayer module coming soon.</p>
        </TodayCard>

        <TodayCard icon={<NotebookPen size={18} />} title="Journal Placeholder">
          <p className="text-sm font-semibold text-[var(--green)]">{selectedRef}</p>
          <p className="mt-2 rounded-2xl border border-dashed border-stone-300 bg-[var(--paper)] p-3 text-sm leading-6 text-[var(--muted)]">
            Write what the Lord is teaching you.
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Journal module coming soon.</p>
        </TodayCard>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Notes" value={noteCount} />
        <Stat label="Highlights" value={highlightCount} />
        <Stat label="Bookmarks" value={bookmarkCount} />
      </section>
    </div>
  );
}

function TodayCard({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[var(--green)]">
          {icon}
          <h2 className="text-base font-semibold text-[var(--ink)]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function PlaceholderPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-semibold text-[var(--ink)]">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function PersonStudyScreen({
  person,
  versesByRef,
  onBack,
  onOpenReference,
}: {
  person: StudyPerson;
  versesByRef: Map<string, BibleVerse>;
  onBack: () => void;
  onOpenReference: (targetRef: string) => void;
}) {
  return (
    <div className="space-y-4 p-4 pb-36 md:p-8 md:pb-10">
      <section className="sticky top-[92px] z-10 -mx-4 border-b border-[var(--line)] bg-[var(--paper)]/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:rounded-3xl md:border md:bg-white md:p-5 md:shadow-sm">
        <button
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--green)]"
          onClick={onBack}
          type="button"
        >
          <ChevronLeft size={16} />
          Back to Bible
        </button>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">People Study</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink)]">{person.name}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">{person.summary}</p>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--green)]">
            <Users size={18} />
            <h2 className="text-base font-semibold text-[var(--ink)]">Profile</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">First appearance</p>
              <button className="mt-1 text-sm font-semibold text-[var(--green)]" onClick={() => onOpenReference(person.firstAppearance)} type="button">
                {person.firstAppearance}
              </button>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Key passages</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {person.majorPassages.map((passage) => (
                  <button
                    key={`person-passage-${person.id}-${passage}`}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                    onClick={() => onOpenReference(passage.includes(":") ? passage : `${passage}:1`)}
                    type="button"
                  >
                    {passage}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--green)]">
            <Clipboard size={18} />
            <h2 className="text-base font-semibold text-[var(--ink)]">Lessons Learned</h2>
          </div>
          <div className="mt-4 grid gap-2">
            {person.lessonsLearned.map((lesson) => (
              <div key={`lesson-${person.id}-${lesson}`} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                {lesson}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--warm)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Key events</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {person.keyEvents.map((event) => (
                <span key={`event-${person.id}-${event}`} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                  {event}
                </span>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[var(--green)]">
            <BookOpen size={18} />
            <h2 className="text-base font-semibold text-[var(--ink)]">Related Verses</h2>
          </div>
          <span className="rounded-full bg-[var(--warm)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
            Reviewed entries
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {person.relatedVerses.map((reference) => {
            const verse = versesByRef.get(reference);
            return (
              <button
                key={`person-related-${person.id}-${reference}`}
                className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 text-left"
                onClick={() => onOpenReference(reference)}
                type="button"
              >
                <p className="text-sm font-semibold text-[var(--green)]">{reference}</p>
                <p className="mt-2 line-clamp-3 font-serif text-sm leading-6 text-[var(--scripture-ink)]">
                  {verse?.text ?? "Verse text is not available in the local KJV data yet."}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function referenceStart(reference: string) {
  const match = reference.match(/^(.+?)\s+(\d+)(?::(\d+))?/);
  if (!match) return reference;
  return `${match[1]} ${match[2]}:${match[3] ?? "1"}`;
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function placeEntriesForNames(names: string[]) {
  return uniqueById(
    names.flatMap((name) => {
      const normalized = name.toLowerCase();
      return studyPlaces.filter((place) => place.name.toLowerCase() === normalized || place.name.toLowerCase().includes(normalized));
    }),
  );
}

function timelineEntriesForIds(ids: string[]) {
  const byId = new Map(timelineEntries.map((entry) => [entry.id, entry]));
  return uniqueById(ids.flatMap((id) => {
    const entry = byId.get(id);
    return entry ? [entry] : [];
  }));
}

function timelineEntriesForPlaces(places: StudyPlace[]) {
  return timelineEntriesForIds(places.flatMap((place) => place.timelineLinks));
}

function bookIntroTimelineEntries(intro: BookIntroduction, places: StudyPlace[]) {
  const byBook: Record<string, string[]> = {
    Genesis: ["abraham", "isaac", "jacob", "joseph"],
    Exodus: ["moses", "exodus-wilderness"],
    Luke: ["christ-birth", "christ-ministry", "christ-crucifixion", "christ-resurrection"],
    John: ["christ-ministry", "christ-crucifixion", "christ-resurrection"],
    Romans: ["christ-crucifixion", "christ-resurrection", "pauls-journeys"],
  };
  return uniqueById([
    ...timelineEntriesForIds(byBook[intro.book] ?? []),
    ...timelineEntriesForPlaces(places),
  ]);
}

function BookIntroScreen({
  intro,
  versesByRef,
  onBack,
  onOpenReference,
  onOpenLibraryResource,
}: {
  intro: BookIntroduction;
  versesByRef: Map<string, BibleVerse>;
  onBack: () => void;
  onOpenReference: (targetRef: string) => void;
  onOpenLibraryResource: (slug: string) => void;
}) {
  const keyVerse = versesByRef.get(intro.overview.keyVerse);
  const introPlaces = placeEntriesForNames(intro.keyPlaces);
  const introTimeline = bookIntroTimelineEntries(intro, introPlaces);

  return (
    <div className="space-y-4 p-4 pb-36 md:p-8 md:pb-10">
      <section className="sticky top-[92px] z-10 -mx-4 border-b border-[var(--line)] bg-[var(--paper)]/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:rounded-3xl md:border md:bg-white md:p-5 md:shadow-sm">
        <button
          className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--green)]"
          onClick={onBack}
          type="button"
        >
          <ChevronLeft size={16} />
          Back to Bible
        </button>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Book Introduction</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink)]">{intro.book}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--muted)]">{intro.overview.theme}</p>
      </section>

      <section className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-[var(--green)]">
            <BookOpen size={18} />
            <h2 className="text-base font-semibold text-[var(--ink)]">Overview</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <OverviewItem label="Author" value={intro.overview.author} />
            <OverviewItem label="Date" value={intro.overview.date} />
            <OverviewItem label="Audience" value={intro.overview.audience} />
            <OverviewItem label="Key verse" value={intro.overview.keyVerse} onClick={() => onOpenReference(intro.overview.keyVerse)} />
          </div>
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Purpose</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{intro.overview.purpose}</p>
          </div>
        </article>

        <article className="rounded-3xl border border-[var(--line)] bg-[var(--scripture)] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[var(--green)]">
              <Star size={18} />
              <h2 className="text-base font-semibold text-[var(--ink)]">Key Verse</h2>
            </div>
            <button
              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
              onClick={() => onOpenReference(intro.overview.keyVerse)}
              type="button"
            >
              Open {intro.overview.keyVerse}
            </button>
          </div>
          <p className="mt-4 font-serif text-xl leading-9 text-[var(--scripture-ink)]">
            {keyVerse?.text ?? "Verse text is not available in the local KJV data yet."}
          </p>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <StudySection title="Outline">
          <div className="space-y-2">
            {intro.outline.map((item) => (
              <button
                key={`${intro.book}-outline-${item.reference}`}
                className="w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 text-left"
                onClick={() => onOpenReference(referenceStart(item.reference))}
                type="button"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--green)]">{item.title}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">{item.reference}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.summary}</p>
              </button>
            ))}
          </div>
        </StudySection>

        <StudySection title="Christ in the Book">
          <p className="text-sm leading-6 text-[var(--muted)]">{intro.christInTheBook}</p>
        </StudySection>

        <StudySection title="Key People">
          <div className="flex flex-wrap gap-2">
            {intro.keyPeople.map((person) => (
              <span key={`${intro.book}-person-${person}`} className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]">
                {person}
              </span>
            ))}
          </div>
        </StudySection>

        <StudySection title="Key Places">
          <div className="flex flex-wrap gap-2">
            {intro.keyPlaces.map((place) => (
              <span key={`${intro.book}-place-${place}`} className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                {place}
              </span>
            ))}
          </div>
        </StudySection>

        <StudySection title="Atlas & Timeline">
          <div className="grid gap-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
              <div className="flex items-center gap-2 text-[var(--green)]">
                <MapPin size={17} />
                <h3 className="text-sm font-semibold">Reviewed Places</h3>
              </div>
              <div className="mt-3 grid gap-2">
                {introPlaces.length ? introPlaces.map((place) => (
                  <PlaceContextCard key={`intro-place-${intro.book}-${place.id}`} place={place} onOpenReference={onOpenReference} />
                )) : (
                  <p className="text-sm leading-6 text-[var(--muted)]">Reviewed atlas entries will appear here as this book is expanded.</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
              <div className="flex items-center gap-2 text-[var(--green)]">
                <Timer size={17} />
                <h3 className="text-sm font-semibold">Simple Timeline</h3>
              </div>
              <div className="mt-3 grid gap-2">
                {introTimeline.length ? introTimeline.map((entry) => (
                  <TimelineContextCard key={`intro-timeline-${intro.book}-${entry.id}`} entry={entry} onOpenReference={onOpenReference} />
                )) : (
                  <p className="text-sm leading-6 text-[var(--muted)]">Timeline entries will appear here as this book is expanded.</p>
                )}
              </div>
            </div>
          </div>
        </StudySection>

        <StudySection title="Memory Verses">
          <div className="grid gap-2 sm:grid-cols-2">
            {intro.memoryVerses.map((reference) => {
              const verse = versesByRef.get(reference);
              return (
                <button
                  key={`${intro.book}-memory-${reference}`}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 text-left"
                  onClick={() => onOpenReference(reference)}
                  type="button"
                >
                  <p className="text-sm font-semibold text-[var(--green)]">{reference}</p>
                  <p className="mt-2 line-clamp-3 font-serif text-sm leading-6 text-[var(--scripture-ink)]">
                    {verse?.text ?? "Verse text is not available in the local KJV data yet."}
                  </p>
                </button>
              );
            })}
          </div>
        </StudySection>

        <StudySection title="Recommended Resources">
          <div className="space-y-2">
            {intro.recommendedResources.map((resource) => (
              <article key={`${intro.book}-resource-${resource.id}`} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{resource.kind}</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--green)]">{resource.title}</p>
                    {resource.author && <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{resource.author}</p>}
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold capitalize text-[var(--muted)]">
                    {resource.status}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{resource.note}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {resource.resourceSlug && (
                    <button
                      className="rounded-full bg-[var(--green)] px-3 py-1.5 text-xs font-semibold text-white"
                      onClick={() => onOpenLibraryResource(resource.resourceSlug!)}
                      type="button"
                    >
                      Open Resource
                    </button>
                  )}
                  {resource.warning && (
                    <span className="rounded-full bg-[var(--highlight)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]">
                      {resource.warning}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </StudySection>
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-[var(--green)]">
          <Clipboard size={18} />
          <h2 className="text-base font-semibold text-[var(--ink)]">Source Notes</h2>
        </div>
        <div className="mt-4 grid gap-2">
          {intro.sourceNotes.map((note) => (
            <p key={`${intro.book}-source-${note}`} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
              {note}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}

function OverviewItem({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{value}</p>
    </>
  );

  if (onClick) {
    return (
      <button className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 text-left" onClick={onClick} type="button">
        {content}
      </button>
    );
  }

  return <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">{content}</div>;
}

function PassageShortcutRow({
  label,
  emptyText,
  passages,
  onOpenPassage,
}: {
  label: string;
  emptyText: string;
  passages: BiblePassage[];
  onOpenPassage: (passage: BiblePassage) => void;
}) {
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex w-max gap-2 pr-2">
            {passages.length ? passages.map((passage) => (
              <button
                key={`${label}-${passage.id}`}
                className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                onClick={() => onOpenPassage(passage)}
                type="button"
              >
                {passage.label}
              </button>
            )) : (
              <span className="rounded-full bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">{emptyText}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BibleMarkerRow({
  markers,
  onOpenMarker,
  onSaveMarker,
}: {
  markers: BibleMarkers;
  onOpenMarker: (markerId: BibleMarkerId) => void;
  onSaveMarker: (markerId: BibleMarkerId) => void;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Bible Markers</p>
        <p className="text-xs font-semibold text-[var(--muted)]">Tap to jump · Save current</p>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
        {BIBLE_MARKER_IDS.map((markerId) => {
          const marker = markers[markerId];
          return (
            <div key={`marker-${markerId}`} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-2">
              <button
                className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 text-left"
                onClick={() => onOpenMarker(markerId)}
                type="button"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--green)] text-sm font-bold text-white">
                  {markerId}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                    {marker?.label ?? `Set Marker ${markerId}`}
                  </span>
                  <span className="block text-xs font-semibold text-[var(--muted)]">
                    {marker ? "Jump now" : "Empty"}
                  </span>
                </span>
              </button>
              <button
                className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                onClick={() => onSaveMarker(markerId)}
                type="button"
              >
                <Save size={13} />
                Save current
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BibleReader({
  book,
  books,
  chapter,
  chapters,
  verseJump,
  verses,
  selectedRef,
  flashRef,
  hasPrevious,
  hasNext,
  highlightsByRef,
  notesByRef,
  bookmarksByRef,
  selectedVerseRef,
  allVerses,
  versesByRef,
  chapterAnalysis,
  chapterConnectionsData,
  chapterCrossReferences,
  chapterCommentaryEntries,
  chapterKeyVerses,
  chapterResourceRecommendations,
  bookIntroduction,
  scriptureMemory,
  recentPassages,
  favoritePassages,
  bibleMarkers,
  currentChapterPinned,
  readingProgress,
  speechState,
  bibleListeningProgress,
  listenRangeStart,
  listenRangeEnd,
  repeatChapter,
  repeatBook,
  stopAfterSelection,
  hasSpeechSynthesis,
  playlists,
  playlistName,
  listenStatusMessage,
  onBookChange,
  onChapterChange,
  onVerseJumpChange,
  onVerseSelect,
  onPrevious,
  onNext,
  onQuickJump,
  onOpenPassage,
  onToggleCurrentFavorite,
  onOpenMarker,
  onSaveMarker,
  onListenCurrentChapter,
  onListenFromCurrentVerse,
  onListenRange,
  onListenWholeBook,
  onStopListening,
  onListenRangeStartChange,
  onListenRangeEndChange,
  onRepeatChapterChange,
  onRepeatBookChange,
  onStopAfterSelectionChange,
  onPlaylistNameChange,
  onCreatePlaylist,
  onAddMemoryVerse,
  onUpdateMemoryProgress,
  onRemoveMemoryVerse,
  onOpenReference,
  onOpenBookIntroduction,
  onOpenLibraryResource,
  onOpenPersonStudy,
  onVerseClick,
  onWordClick,
}: {
  book: string;
  books: string[];
  chapter: number;
  chapters: number[];
  verseJump: number;
  verses: BibleVerse[];
  selectedRef: string;
  flashRef: string | null;
  hasPrevious: boolean;
  hasNext: boolean;
  highlightsByRef: Map<string, UserHighlight>;
  notesByRef: Map<string, UserNote[]>;
  bookmarksByRef: Map<string, UserBookmark>;
  selectedVerseRef: React.MutableRefObject<HTMLDivElement | null>;
  allVerses: BibleVerse[];
  versesByRef: Map<string, BibleVerse>;
  chapterAnalysis: ChapterStudyAnalysis;
  chapterConnectionsData: ActiveChapterConnections;
  chapterCrossReferences: CrossReference[];
  chapterCommentaryEntries: CommentaryEntry[];
  chapterKeyVerses: string[];
  chapterResourceRecommendations: ChapterResourceRecommendation[];
  bookIntroduction: BookIntroduction | null;
  scriptureMemory: ScriptureMemoryItem[];
  recentPassages: BiblePassage[];
  favoritePassages: BiblePassage[];
  bibleMarkers: BibleMarkers;
  currentChapterPinned: boolean;
  readingProgress: { book: string; chapter: number; percent: number };
  speechState: SpeechState;
  bibleListeningProgress: BibleListeningProgress | null;
  listenRangeStart: number;
  listenRangeEnd: number;
  repeatChapter: boolean;
  repeatBook: boolean;
  stopAfterSelection: boolean;
  hasSpeechSynthesis: boolean;
  playlists: BibleAudioPlaylist[];
  playlistName: string;
  listenStatusMessage: string;
  onBookChange: (book: string) => void;
  onChapterChange: (chapter: number) => void;
  onVerseJumpChange: (verse: number) => void;
  onVerseSelect: (verse: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onQuickJump: (query: string) => void;
  onOpenPassage: (passage: BiblePassage) => void;
  onToggleCurrentFavorite: () => void;
  onOpenMarker: (markerId: BibleMarkerId) => void;
  onSaveMarker: (markerId: BibleMarkerId) => void;
  onListenCurrentChapter: () => void;
  onListenFromCurrentVerse: () => void;
  onListenRange: () => void;
  onListenWholeBook: () => void;
  onStopListening: () => void;
  onListenRangeStartChange: (verse: number) => void;
  onListenRangeEndChange: (verse: number) => void;
  onRepeatChapterChange: (repeat: boolean) => void;
  onRepeatBookChange: (repeat: boolean) => void;
  onStopAfterSelectionChange: (stop: boolean) => void;
  onPlaylistNameChange: (name: string) => void;
  onCreatePlaylist: () => void;
  onAddMemoryVerse: (ref: string) => void;
  onUpdateMemoryProgress: (ref: string, progress: number) => void;
  onRemoveMemoryVerse: (ref: string) => void;
  onOpenReference: (targetRef: string) => void;
  onOpenBookIntroduction: () => void;
  onOpenLibraryResource: (slug: string) => void;
  onOpenPersonStudy: (personId: string) => void;
  onVerseClick: (ref: string) => void;
  onWordClick: (word: string, ref: string) => void;
}) {
  const bibleSpeechActive = speechState.targetId?.startsWith("bible-") && speechState.playing;
  const selectedVerseNumber = Number(selectedRef.split(":")[1] ?? verseJump);
  const [quickJumpText, setQuickJumpText] = useState("");
  const [explorerWord, setExplorerWord] = useState("believe");
  const selectedVerse = verses.find((verse) => verse.ref === selectedRef) ?? verses[0];
  const progressPercent = Math.round(readingProgress.percent);
  const explorer = useMemo(
    () => buildWordExplorer(explorerWord, book, chapter, allVerses),
    [allVerses, book, chapter, explorerWord],
  );
  const chapterNotes = Array.from(notesByRef.entries()).filter(([ref]) => ref.startsWith(`${book} ${chapter}:`));
  const memoryForChapter = scriptureMemory.filter((item) => item.verse_ref.startsWith(`${book} ${chapter}:`));
  return (
    <div className="space-y-4 p-4 md:p-8">
      <section className="rounded-2xl border border-[var(--line)] bg-white/95 p-3 shadow-sm backdrop-blur md:sticky md:top-4 md:z-10 md:rounded-3xl md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Quick Navigation</p>
            <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{selectedRef}</p>
          </div>
          <button
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
              currentChapterPinned
                ? "border-[var(--gold)] bg-[var(--highlight)] text-[var(--ink)]"
                : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
            }`}
            onClick={onToggleCurrentFavorite}
            type="button"
          >
            <Star size={15} />
            {currentChapterPinned ? "Pinned" : "Pin passage"}
          </button>
          {bookIntroduction && (
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs font-semibold text-[var(--green)]"
              onClick={onOpenBookIntroduction}
              type="button"
            >
              <BookOpen size={15} />
              Book Introduction
            </button>
          )}
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onQuickJump(quickJumpText);
            setQuickJumpText("");
          }}
        >
          <label className="sr-only" htmlFor="quick-jump-input">Quick Jump</label>
          <input
            id="quick-jump-input"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-[var(--line)] bg-white px-4 text-base font-semibold text-[var(--ink)] outline-none placeholder:text-stone-400"
            inputMode="text"
            placeholder="John 3, John 3:16, Romans 8:28"
            value={quickJumpText}
            onChange={(event) => setQuickJumpText(event.target.value)}
          />
          <button className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--green)] px-5 text-sm font-semibold text-white" type="submit">
            <Search size={16} />
            Go
          </button>
        </form>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_78px_78px] gap-2 md:grid-cols-[minmax(0,1fr)_110px_110px]">
          <label className="sr-only" htmlFor="reader-book-select">Book</label>
          <select
            id="reader-book-select"
            aria-label="Book"
            className="h-11 min-w-0 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-semibold text-[var(--ink)] md:text-base"
            value={book}
            onChange={(event) => onBookChange(event.target.value)}
          >
            {books.map((bookName) => (
              <option key={bookName} value={bookName}>
                {bookName}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="reader-chapter-select">Chapter</label>
          <select
            id="reader-chapter-select"
            aria-label="Chapter"
            className="h-11 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-semibold text-[var(--ink)] md:text-base"
            value={chapter}
            onChange={(event) => onChapterChange(Number(event.target.value))}
          >
            {chapters.map((chapterNumber) => (
              <option key={chapterNumber} value={chapterNumber}>
                {chapterNumber}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="reader-verse-select">Verse</label>
          <select
            id="reader-verse-select"
            aria-label="Verse"
            className="h-11 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-semibold text-[var(--ink)] md:text-base"
            value={Number.isFinite(selectedVerseNumber) ? selectedVerseNumber : verseJump}
            onChange={(event) => {
              const nextVerse = Number(event.target.value);
              onVerseJumpChange(nextVerse);
              onVerseSelect(nextVerse);
            }}
          >
            {verses.map((verse) => (
              <option key={`verse-select-${verse.ref}`} value={verse.verse}>
                {verse.verse}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--warm)] px-3 text-base font-semibold disabled:opacity-40"
            disabled={!hasPrevious}
            onClick={onPrevious}
            type="button"
          >
            <ChevronLeft size={18} />
            Previous chapter
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--warm)] px-3 text-base font-semibold disabled:opacity-40"
            disabled={!hasNext}
            onClick={onNext}
            type="button"
          >
            Next chapter
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Reading Progress</p>
            <p className="text-sm font-semibold text-[var(--green)]">
              {readingProgress.book} {readingProgress.chapter} · {progressPercent}%
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
            <div className="h-full rounded-full bg-[var(--green)] transition-[width]" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <BibleMarkerRow markers={bibleMarkers} onOpenMarker={onOpenMarker} onSaveMarker={onSaveMarker} />

        <PassageShortcutRow
          label="Favorites"
          emptyText="Pin a passage for one-tap access."
          passages={favoritePassages}
          onOpenPassage={onOpenPassage}
        />
        <PassageShortcutRow
          label="Recent"
          emptyText="Recent passages will appear as you move through the Bible."
          passages={recentPassages}
          onOpenPassage={onOpenPassage}
        />
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm md:rounded-3xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Listen Mode</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">Bible audio playlist planning</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Uses this device&apos;s built-in speech for now. The playlist structure leaves room for future licensed KJV audio files.
            </p>
          </div>
          {bibleListeningProgress && (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--warm)] px-4 py-3 text-sm font-semibold text-[var(--muted)]">
              <p className="text-[var(--green)]">{bibleListeningProgress.label}</p>
              <p>{formatPercent(bibleListeningProgress.progress)} listened</p>
            </div>
          )}
        </div>

        {!hasSpeechSynthesis && (
          <p className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
            Text-to-speech is not available in this browser. Bible audio will use device speech when the browser supports it.
          </p>
        )}

        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--green)] px-4 py-3 text-sm font-semibold text-white" onClick={onListenCurrentChapter} type="button">
            {speechState.targetId === `bible-chapter-${book}-${chapter}` && speechState.playing && !speechState.paused ? <Pause size={16} /> : <Play size={16} />}
            Current Chapter
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--ink)]" onClick={onListenFromCurrentVerse} type="button">
            <Headphones size={16} />
            From Verse {Number.isFinite(selectedVerseNumber) ? selectedVerseNumber : verseJump}
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--ink)]" onClick={onListenRange} type="button">
            <ListMusic size={16} />
            Selected Range
          </button>
          <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm font-semibold text-[var(--ink)]" onClick={onListenWholeBook} type="button">
            <BookOpen size={16} />
            Whole Book
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1.2fr]">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Range start
              <input
                className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]"
                max={verses.length}
                min={1}
                onChange={(event) => onListenRangeStartChange(Number(event.target.value))}
                type="number"
                value={listenRangeStart}
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Range end
              <input
                className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]"
                max={verses.length}
                min={1}
                onChange={(event) => onListenRangeEndChange(Number(event.target.value))}
                type="number"
                value={listenRangeEnd}
              />
            </label>
          </div>

          <div className="grid gap-2 text-sm font-semibold text-[var(--muted)]">
            <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
              <input checked={repeatChapter} onChange={(event) => onRepeatChapterChange(event.target.checked)} type="checkbox" />
              Repeat chapter
            </label>
            <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
              <input checked={repeatBook} onChange={(event) => onRepeatBookChange(event.target.checked)} type="checkbox" />
              Repeat book
            </label>
            <label className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
              <input checked={stopAfterSelection} onChange={(event) => onStopAfterSelectionChange(event.target.checked)} type="checkbox" />
              Stop after chapter/range
            </label>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--warm)] p-3">
            <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Playlist name
              <input
                className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                onChange={(event) => onPlaylistNameChange(event.target.value)}
                value={playlistName}
              />
            </label>
            <button className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-white" onClick={onCreatePlaylist} type="button">
              <Save size={16} />
              Create Playlist
            </button>
          </div>
        </div>

        {bibleSpeechActive && (
          <button className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--muted)]" onClick={onStopListening} type="button">
            <Square size={15} />
            Stop Bible Audio
          </button>
        )}
        {listenStatusMessage && (
          <p className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
            {listenStatusMessage}
          </p>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {playlists.slice(0, 4).map((playlist) => (
            <article key={playlist.id} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
              <div className="flex items-center gap-2 text-[var(--green)]">
                <ListMusic size={17} />
                <h3 className="text-sm font-semibold">{playlist.name}</h3>
              </div>
              <div className="mt-3 space-y-2">
                {playlist.items.map((item) => (
                  <p key={item.id} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[var(--muted)]">
                    {item.label}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <ChapterStudyWorkflow
        allVerses={allVerses}
        analysis={chapterAnalysis}
        connections={chapterConnectionsData}
        chapterCommentaryEntries={chapterCommentaryEntries}
        chapterCrossReferences={chapterCrossReferences}
        chapterKeyVerses={chapterKeyVerses}
        chapterResourceRecommendations={chapterResourceRecommendations}
        bookIntroduction={bookIntroduction}
        chapterNotes={chapterNotes}
        explorer={explorer}
        explorerWord={explorerWord}
        memoryForChapter={memoryForChapter}
        selectedVerse={selectedVerse}
        versesByRef={versesByRef}
        onAddMemoryVerse={onAddMemoryVerse}
        onExplorerWordChange={setExplorerWord}
        onLookupWord={(word) => onWordClick(word, selectedVerse.ref)}
        onOpenBookIntroduction={onOpenBookIntroduction}
        onOpenLibraryResource={onOpenLibraryResource}
        onOpenReference={onOpenReference}
        onOpenPersonStudy={onOpenPersonStudy}
        onRemoveMemoryVerse={onRemoveMemoryVerse}
        onUpdateMemoryProgress={onUpdateMemoryProgress}
      />

      <article className="rounded-3xl border border-[var(--line)] bg-[var(--scripture)] px-4 py-5 shadow-sm md:px-8 md:py-7">
        <div className="mb-5 flex items-baseline justify-between gap-4 border-b border-stone-300/70 pb-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--ink)]">{book} {chapter}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">King James Version</p>
          </div>
          <p className="text-sm font-semibold text-[var(--green)]">{verses.length} verses</p>
        </div>

        <div className="space-y-1">
          {verses.map((verse) => {
            const highlighted = highlightsByRef.has(verse.ref);
            const hasNote = notesByRef.has(verse.ref);
            const bookmarked = bookmarksByRef.has(verse.ref);
            const selected = selectedRef === verse.ref;
            const flashed = flashRef === verse.ref;
            return (
              <div
                key={verse.ref}
                ref={selected ? selectedVerseRef : null}
                className={`group rounded-2xl border px-3 py-3 transition ${
                  selected
                    ? "border-[var(--gold)] bg-white shadow-sm"
                    : "border-transparent hover:border-stone-200 hover:bg-white/70"
                } ${highlighted ? "bg-[var(--highlight)]" : ""} ${flashed ? "ring-4 ring-[var(--gold-soft)]" : ""}`}
                onClick={() => onVerseClick(verse.ref)}
                role="button"
                tabIndex={0}
              >
                <p className="font-serif text-[1.2rem] leading-9 text-[var(--scripture-ink)] md:text-[1.34rem] md:leading-10">
                  <sup className="mr-2 font-sans text-xs font-bold text-[var(--green)]">{verse.verse}</sup>
                  {verse.text.split(/(\s+)/).map((part, index) => {
                    if (/^\s+$/.test(part)) return part;
                    return (
                      <button
                        key={`${verse.ref}-${index}`}
                        className="rounded px-0.5 text-left font-serif hover:bg-[var(--gold-soft)] hover:text-[var(--ink)]"
                        onClick={(event) => {
                          event.stopPropagation();
                          onWordClick(part, verse.ref);
                        }}
                        type="button"
                      >
                        {part}
                      </button>
                    );
                  })}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[var(--muted)]">
                  {highlighted && <Highlighter size={14} />}
                  {hasNote && <NotebookPen size={14} />}
                  {bookmarked && <Bookmark size={14} />}
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </div>
  );
}

function teachingNotesFileBase(book: string, chapter: number) {
  return `${book.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${chapter}-teaching-notes`;
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function sectionOrEmpty(lines: string[]) {
  const filtered = lines.filter(Boolean);
  return filtered.length ? filtered : ["No reviewed entries yet."];
}

function verseLine(ref: string, versesByRef: Map<string, BibleVerse>) {
  const verse = versesByRef.get(ref);
  return verse ? `${ref} - ${verse.plainText}` : ref;
}

function teachingDictionaryEntries(data: TeachingNotesExportData) {
  const words = new Set([
    ...keyWordsForVerse(data.fallbackMemoryVerse),
    ...data.analysis.repeatedWords.slice(0, 12).map((item) => item.word),
  ]);

  return Array.from(words)
    .map((word) => findDictionaryEntry(word))
    .filter((entry) => entry.found)
    .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.lookupWord === entry.lookupWord) === index)
    .slice(0, 12);
}

function teacherNotesChapterKey(book: string, chapter: number) {
  return `${book} ${chapter}`;
}

function linesFromTeacherNote(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function commentaryStudyLabel(entry: CommentaryEntry) {
  if (entry.author === "Matthew Henry") return "Devotional / practical";
  if (entry.author === "H. A. Ironside") return "Expository";
  return "Reviewed commentary";
}

function teachingWorkspaceSummary(data: TeachingNotesExportData): TeachingWorkspaceSummary {
  const passage = `${data.book} ${data.chapter}`;
  const reviewed = REVIEWED_TEACHING_SUMMARIES[passage];
  const fallbackKeyVerse = data.keyVerses[0] ?? data.fallbackMemoryVerse.ref;
  const keyWords = Array.from(
    new Set([
      ...keyWordsForVerse(data.fallbackMemoryVerse),
      ...data.analysis.repeatedWords.slice(0, 6).map((item) => item.word),
    ]),
  ).slice(0, 8);

  return {
    passage,
    mainTheme: reviewed?.mainTheme ?? data.connections.themes[0] ?? data.bookIntroduction?.overview.theme ?? "Reviewed chapter study",
    keyVerse: reviewed?.keyVerse ?? fallbackKeyVerse,
    keyWords,
    teachingAim:
      reviewed?.teachingAim ??
      data.bookIntroduction?.overview.purpose ??
      "Use the reviewed chapter data to teach the passage clearly from the KJV text.",
    suggestedTitle: reviewed?.suggestedTitle ?? `${passage} Lesson`,
  };
}

function buildLessonOutline(data: TeachingNotesExportData, teacherNotes: TeacherNotesDraft): LessonOutlineSection[] {
  const summary = teachingWorkspaceSummary(data);
  const definitions = teachingDictionaryEntries(data).slice(0, 6);
  const teacherMainPoints = linesFromTeacherNote(teacherNotes.mainPoints);
  const teacherApplications = linesFromTeacherNote(teacherNotes.applications);
  const hookLines = linesFromTeacherNote(teacherNotes.hook);
  const illustrationLines = linesFromTeacherNote(teacherNotes.illustrations);
  const closingLines = linesFromTeacherNote(teacherNotes.closingThought);
  const keyVerseLines = data.keyVerses.length ? data.keyVerses.map((ref) => verseLine(ref, data.versesByRef)) : [verseLine(summary.keyVerse, data.versesByRef)];

  return [
    {
      title: "Introduction",
      lines: sectionOrEmpty([
        `Passage: ${summary.passage}`,
        `Suggested lesson title: ${summary.suggestedTitle}`,
        `Main theme: ${summary.mainTheme}`,
        ...hookLines.map((line) => `Teacher hook: ${line}`),
      ]),
    },
    {
      title: "Main Points",
      lines: sectionOrEmpty([
        `Teaching aim: ${summary.teachingAim}`,
        ...keyVerseLines.map((line) => `Key verse: ${line}`),
        ...data.connections.themes.slice(0, 5).map((theme) => `Reviewed theme: ${theme}`),
        ...data.connections.people.slice(0, 4).map((person) => `Person: ${person.name} - ${person.summary}`),
        ...data.connections.timeline.slice(0, 4).map((entry) => `Timeline: ${entry.era} - ${entry.title}. ${entry.description}`),
        ...data.connections.types.slice(0, 3).map((type) => `Type of Christ: ${type.title} - ${type.pointsToChrist}`),
        ...teacherMainPoints.map((line) => `Teacher main point: ${line}`),
      ]),
    },
    {
      title: "Key Cross References",
      lines: sectionOrEmpty(data.crossReferences.slice(0, 8).map((reference) => {
        const preview = data.versesByRef.get(reference.target_ref)?.plainText;
        return `${reference.verse_ref} -> ${reference.target_ref}${reference.label ? ` (${reference.label})` : ""}${preview ? ` - ${preview}` : ""}`;
      })),
    },
    {
      title: "Word Studies",
      lines: sectionOrEmpty([
        ...summary.keyWords.map((word) => `Key word: ${word}`),
        ...definitions.map((entry) => `${entry.lookupWord}: ${entry.definition}`),
      ]),
    },
    {
      title: "Applications",
      lines: sectionOrEmpty([
        ...teacherApplications.map((line) => `Teacher application: ${line}`),
        ...illustrationLines.map((line) => `Illustration idea: ${line}`),
      ]),
    },
    {
      title: "Conclusion",
      lines: sectionOrEmpty([
        `Memory verse: ${data.memoryVerse?.verse_ref ?? data.fallbackMemoryVerse.ref}`,
        ...closingLines.map((line) => `Closing thought: ${line}`),
      ]),
    },
  ];
}

function buildLessonOutlineMarkdown(data: TeachingNotesExportData, teacherNotes: TeacherNotesDraft) {
  const summary = teachingWorkspaceSummary(data);
  const sections = buildLessonOutline(data, teacherNotes);
  return [
    `# ${summary.passage} Lesson Outline`,
    "",
    "Drafted from existing reviewed/stored study data and local teacher notes. No doctrine was generated automatically.",
    "",
    `- Main theme: ${summary.mainTheme}`,
    `- Key verse: ${summary.keyVerse}`,
    `- Teaching aim: ${summary.teachingAim}`,
    `- Suggested lesson title: ${summary.suggestedTitle}`,
    "",
    ...sections.flatMap((section) => [
      `## ${section.title}`,
      ...sectionOrEmpty(section.lines).map((line) => `- ${line}`),
      "",
    ]),
  ].join("\n");
}

function buildTeachingNotesMarkdown(data: TeachingNotesExportData) {
  const intro = data.bookIntroduction;
  const definitions = teachingDictionaryEntries(data);
  const memoryVerseRef = data.memoryVerse?.verse_ref ?? data.fallbackMemoryVerse.ref;
  const memoryVerseText = data.memoryVerse?.verse_text || data.fallbackMemoryVerse.plainText;
  const lines: string[] = [
    `# ${data.book} ${data.chapter} Teaching Notes`,
    "",
    "Prepared from existing reviewed/stored study data. No doctrine was generated automatically.",
    "",
    "## Book Introduction Summary",
    ...sectionOrEmpty(intro ? [
      `- Author: ${intro.overview.author}`,
      `- Date: ${intro.overview.date}`,
      `- Audience: ${intro.overview.audience}`,
      `- Theme: ${intro.overview.theme}`,
      `- Key verse: ${intro.overview.keyVerse}`,
      `- Purpose: ${intro.overview.purpose}`,
      `- Christ in the book: ${intro.christInTheBook}`,
    ] : []),
    "",
    "## Key Verses",
    ...sectionOrEmpty(data.keyVerses.map((ref) => `- ${verseLine(ref, data.versesByRef)}`)),
    "",
    "## Repeated Words",
    ...sectionOrEmpty(data.analysis.repeatedWords.slice(0, 15).map((item) => `- ${item.word}: ${item.count}`)),
    "",
    "## Repeated Phrases",
    ...sectionOrEmpty(data.analysis.repeatedPhrases.slice(0, 8).map((item) => `- ${item.phrase}: ${item.count}`)),
    "",
    "## Webster Word Definitions",
    ...sectionOrEmpty(definitions.map((entry) => `- ${entry.lookupWord}: ${entry.definition}`)),
    "",
    "## TSK Cross References",
    ...sectionOrEmpty(data.crossReferences.map((reference) => {
      const preview = data.versesByRef.get(reference.target_ref)?.plainText;
      return `- ${reference.verse_ref} -> ${reference.target_ref}${reference.label ? ` (${reference.label})` : ""}${preview ? ` - ${preview}` : ""} [${reference.source_title ?? reference.source}]`;
    })),
    "",
    "## People Mentioned",
    ...sectionOrEmpty(data.connections.people.map((person) => `- ${person.name}: ${person.summary} First appearance: ${person.firstAppearance}`)),
    "",
    "## Places Mentioned",
    ...sectionOrEmpty(data.connections.places.map((place) => `- ${place.name}: ${place.description} Significance: ${place.significance}`)),
    "",
    "## Timeline Context",
    ...sectionOrEmpty(data.connections.timeline.map((entry) => `- ${entry.era}: ${entry.title} (${entry.timeframe}). ${entry.description}`)),
    "",
    "## Types of Christ",
    ...sectionOrEmpty(data.connections.types.map((type) => `- ${type.title}: ${type.description} ${type.pointsToChrist}`)),
    "",
    "## Prophecy Connections",
    ...sectionOrEmpty(data.connections.prophecies.map((prophecy) => `- ${prophecy.prophecy} -> ${prophecy.fulfillment}: ${prophecy.description}`)),
    "",
    "## Commentary References",
    ...sectionOrEmpty(data.commentaryEntries.map((entry) => [
      `- ${entry.resource_title}, ${entry.author}, ${entry.reference ?? `${data.book} ${data.chapter}:${entry.verse_start}-${entry.verse_end}`}. ${entry.public_domain_status}`,
      `  - Commentary text: ${entry.entry_text}`,
      entry.recommended_use ? `  - Recommended use: ${entry.recommended_use}` : "",
    ].filter(Boolean).join("\n"))),
    "",
    "## Personal Notes",
    ...sectionOrEmpty(data.notes.flatMap(([ref, notes]) => notes.map((note) => `- ${ref}: ${note.body}`))),
    "",
    "## Memory Verse",
    `- ${memoryVerseRef}: ${memoryVerseText}`,
    "",
    "## Recommended Resources",
    ...sectionOrEmpty(data.recommendedResources.map((resource) => `- ${resource.title}${resource.author ? `, ${resource.author}` : ""} (${resource.kind}, ${resource.status}): ${resource.note}${resource.warning ? ` Warning: ${resource.warning}` : ""}`)),
    "",
  ];

  return lines.join("\n");
}

function buildTeachingNotesPlainText(data: TeachingNotesExportData) {
  return buildTeachingNotesMarkdown(data)
    .replace(/^# /gm, "")
    .replace(/^## /gm, "\n")
    .replace(/^- /gm, "- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .concat("\n");
}

function ChapterStudyWorkflow({
  allVerses,
  analysis,
  connections,
  chapterCommentaryEntries,
  chapterCrossReferences,
  chapterKeyVerses,
  chapterResourceRecommendations,
  bookIntroduction,
  chapterNotes,
  explorer,
  explorerWord,
  memoryForChapter,
  selectedVerse,
  versesByRef,
  onAddMemoryVerse,
  onExplorerWordChange,
  onLookupWord,
  onOpenBookIntroduction,
  onOpenLibraryResource,
  onOpenReference,
  onOpenPersonStudy,
  onRemoveMemoryVerse,
  onUpdateMemoryProgress,
}: {
  allVerses: BibleVerse[];
  analysis: ChapterStudyAnalysis;
  connections: ActiveChapterConnections;
  chapterCommentaryEntries: CommentaryEntry[];
  chapterCrossReferences: CrossReference[];
  chapterKeyVerses: string[];
  chapterResourceRecommendations: ChapterResourceRecommendation[];
  bookIntroduction: BookIntroduction | null;
  chapterNotes: Array<[string, UserNote[]]>;
  explorer: WordExplorerResult;
  explorerWord: string;
  memoryForChapter: ScriptureMemoryItem[];
  selectedVerse: BibleVerse;
  versesByRef: Map<string, BibleVerse>;
  onAddMemoryVerse: (ref: string) => void;
  onExplorerWordChange: (word: string) => void;
  onLookupWord: (word: string) => void;
  onOpenBookIntroduction: () => void;
  onOpenLibraryResource: (slug: string) => void;
  onOpenReference: (targetRef: string) => void;
  onOpenPersonStudy: (personId: string) => void;
  onRemoveMemoryVerse: (ref: string) => void;
  onUpdateMemoryProgress: (ref: string, progress: number) => void;
}) {
  const suggestedWords = analysis.repeatedWords.slice(0, 8);
  const memoryPreview = memoryForChapter[0] ?? null;
  const [exportMessage, setExportMessage] = useState("");
  const [teacherNotesByChapter, setTeacherNotesByChapter] = useState<Record<string, TeacherNotesDraft>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = window.localStorage.getItem(TEACHER_NOTES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [teachingVisibility, setTeachingVisibility] = useState<TeachingWorkspaceVisibility>(() => loadTeachingWorkspaceVisibility());
  const teacherNotesKey = teacherNotesChapterKey(selectedVerse.book, selectedVerse.chapter);
  const teacherNotesDraft = teacherNotesByChapter[teacherNotesKey] ?? EMPTY_TEACHER_NOTES;
  const exportData = useMemo<TeachingNotesExportData>(() => ({
    book: selectedVerse.book,
    chapter: selectedVerse.chapter,
    bookIntroduction,
    keyVerses: chapterKeyVerses.length ? chapterKeyVerses : [selectedVerse.ref],
    analysis,
    connections,
    crossReferences: chapterCrossReferences,
    commentaryEntries: chapterCommentaryEntries,
    notes: chapterNotes,
    memoryVerse: memoryPreview,
    fallbackMemoryVerse: selectedVerse,
    recommendedResources: chapterResourceRecommendations,
    versesByRef,
  }), [
    analysis,
    bookIntroduction,
    chapterCommentaryEntries,
    chapterCrossReferences,
    chapterKeyVerses,
    chapterNotes,
    chapterResourceRecommendations,
    connections,
    memoryPreview,
    selectedVerse,
    versesByRef,
  ]);
  const markdownExport = useMemo(() => buildTeachingNotesMarkdown(exportData), [exportData]);
  const plainTextExport = useMemo(() => buildTeachingNotesPlainText(exportData), [exportData]);
  const teachingSummary = useMemo(() => teachingWorkspaceSummary(exportData), [exportData]);
  const lessonOutlineSections = useMemo(() => buildLessonOutline(exportData, teacherNotesDraft), [exportData, teacherNotesDraft]);
  const lessonOutlineMarkdown = useMemo(() => buildLessonOutlineMarkdown(exportData, teacherNotesDraft), [exportData, teacherNotesDraft]);
  const exportFileBase = teachingNotesFileBase(selectedVerse.book, selectedVerse.chapter);

  function updateTeacherNote(field: keyof TeacherNotesDraft, value: string) {
    setTeacherNotesByChapter((current) => {
      const next = {
        ...current,
        [teacherNotesKey]: {
          ...(current[teacherNotesKey] ?? EMPTY_TEACHER_NOTES),
          [field]: value,
        },
      };
      try {
        localStorage.setItem(TEACHER_NOTES_KEY, JSON.stringify(next));
      } catch {
        setExportMessage("Teacher notes are saved locally when browser storage is available.");
      }
      return next;
    });
  }

  function toggleTeachingSection(sectionId: TeachingWorkspaceSectionId) {
    setTeachingVisibility((current) => {
      const next = { ...current, [sectionId]: !current[sectionId] };
      try {
        localStorage.setItem(TEACHING_WORKSPACE_VISIBILITY_KEY, JSON.stringify(next));
      } catch {
        setExportMessage("Teaching workspace display preferences could not be saved here.");
      }
      return next;
    });
  }

  async function copyTeachingNotes() {
    try {
      await navigator.clipboard.writeText(markdownExport);
      setExportMessage("Teaching notes copied.");
    } catch {
      setExportMessage("Copy was not available here. Use one of the download buttons.");
    }
  }

  function downloadMarkdown() {
    downloadTextFile(`${exportFileBase}.md`, markdownExport, "text/markdown;charset=utf-8");
    setExportMessage("Markdown teaching notes downloaded.");
  }

  async function copyLessonOutline() {
    try {
      await navigator.clipboard.writeText(lessonOutlineMarkdown);
      setExportMessage("Lesson outline copied.");
    } catch {
      setExportMessage("Copy was not available here. Use the lesson outline download.");
    }
  }

  function downloadLessonOutlineMarkdown() {
    downloadTextFile(`${exportFileBase.replace("-teaching-notes", "-lesson-outline")}.md`, lessonOutlineMarkdown, "text/markdown;charset=utf-8");
    setExportMessage("Lesson outline Markdown downloaded.");
  }

  function downloadFullTeachingNotesMarkdown() {
    downloadTextFile(`${exportFileBase}.md`, markdownExport, "text/markdown;charset=utf-8");
    setExportMessage("Full teaching notes Markdown downloaded.");
  }

  function downloadPlainText() {
    downloadTextFile(`${exportFileBase}.txt`, plainTextExport, "text/plain;charset=utf-8");
    setExportMessage("Plain text teaching notes downloaded.");
  }

  return (
    <section id="chapter-analysis-workflow" className="scroll-mt-40 rounded-2xl border border-[var(--line)] bg-white p-4 pb-28 shadow-sm md:scroll-mt-8 md:rounded-3xl md:pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Study Workflow</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">Chapter study and teaching tools</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            A local-first passage guide for repeated words, word study, teaching prep, and Scripture memory.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {bookIntroduction && (
            <button
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-sm font-semibold text-[var(--green)]"
              onClick={onOpenBookIntroduction}
              type="button"
            >
              <BookOpen size={16} />
              Book Introduction
            </button>
          )}
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-4 py-2.5 text-sm font-semibold text-white"
            onClick={() => onAddMemoryVerse(selectedVerse.ref)}
            type="button"
          >
            <Brain size={16} />
            Add {selectedVerse.ref}
          </button>
        </div>
      </div>

      <article className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[var(--green)]">
              <Star size={18} />
              <h3 className="text-sm font-semibold">Chapter Insights</h3>
            </div>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Reviewed connections for this chapter. These are curated study helps, not automatic doctrine.
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
            Bible centered
          </span>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          <StudyInsightSection icon={<Users size={17} />} title="People">
            <div className="grid gap-2 sm:grid-cols-2">
              {connections.people.length ? connections.people.map((person) => (
                <button
                  key={person.id}
                  className="rounded-2xl border border-[var(--line)] bg-white p-3 text-left"
                  onClick={() => onOpenPersonStudy(person.id)}
                  type="button"
                >
                  <p className="text-sm font-semibold text-[var(--green)]">{person.name}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{person.description}</p>
                  <p className="mt-2 text-xs font-semibold text-[var(--ink)]">First appearance: {person.firstAppearance}</p>
                </button>
              )) : <p className="text-sm leading-6 text-[var(--muted)]">People entries will appear here as chapters are reviewed.</p>}
            </div>
          </StudyInsightSection>

          <StudyInsightSection icon={<MapPin size={17} />} title="Places">
            <div className="grid gap-2 sm:grid-cols-2">
              {connections.places.length ? connections.places.map((place) => (
                <PlaceContextCard key={place.id} place={place} onOpenReference={onOpenReference} />
              )) : <p className="text-sm leading-6 text-[var(--muted)]">Place entries will appear here as chapters are reviewed.</p>}
            </div>
          </StudyInsightSection>

          <StudyInsightSection icon={<Search size={17} />} title="Key Words">
            <div className="flex flex-wrap gap-2">
              {suggestedWords.length ? suggestedWords.map((item) => (
                <button
                  key={`insight-word-${item.word}`}
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
                  onClick={() => onExplorerWordChange(item.word)}
                  type="button"
                >
                  {item.word} <span className="text-[var(--green)]">{item.count}</span>
                </button>
              )) : <span className="text-sm leading-6 text-[var(--muted)]">Key words will appear after chapter analysis runs.</span>}
            </div>
          </StudyInsightSection>

          <StudyInsightSection icon={<BookOpen size={17} />} title="Themes">
            <div className="flex flex-wrap gap-2">
              {connections.themes.length ? connections.themes.map((theme) => (
                <span key={`theme-${theme}`} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                  {theme}
                </span>
              )) : <span className="text-sm leading-6 text-[var(--muted)]">Themes will appear here as chapters are reviewed.</span>}
            </div>
          </StudyInsightSection>

          <StudyInsightSection icon={<Timer size={17} />} title="Timeline">
            <div className="grid gap-2">
              {connections.timeline.length ? connections.timeline.map((entry) => (
                <TimelineContextCard key={`insight-timeline-${entry.id}`} entry={entry} onOpenReference={onOpenReference} />
              )) : <span className="text-sm leading-6 text-[var(--muted)]">Timeline entries will appear here as chapters are reviewed.</span>}
            </div>
          </StudyInsightSection>

          <StudyInsightSection icon={<Link size={17} />} title="Cross References">
            <div className="flex flex-wrap gap-2">
              {chapterCrossReferences.slice(0, 6).map((reference) => (
                <button
                  key={`insight-cross-${reference.id}`}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                  onClick={() => onOpenReference(reference.target_ref)}
                  type="button"
                >
                  {reference.target_ref}
                </button>
              ))}
              {!chapterCrossReferences.length && <span className="text-sm leading-6 text-[var(--muted)]">Cross references will grow as TSK data is reviewed.</span>}
            </div>
          </StudyInsightSection>

          <StudyInsightSection icon={<Library size={17} />} title="Recommended Resources">
            <div className="space-y-2">
              {chapterResourceRecommendations.map((resource) => (
                <article key={`chapter-resource-${resource.id}`} className="rounded-2xl border border-[var(--line)] bg-white p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{resource.kind}</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--green)]">{resource.title}</p>
                      {resource.author && <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{resource.author}</p>}
                    </div>
                    <span className="rounded-full bg-[var(--paper)] px-2.5 py-1 text-xs font-semibold capitalize text-[var(--muted)]">
                      {resource.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{resource.note}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {resource.resourceSlug && (
                      <button
                        className="rounded-full bg-[var(--green)] px-3 py-1.5 text-xs font-semibold text-white"
                        onClick={() => onOpenLibraryResource(resource.resourceSlug!)}
                        type="button"
                      >
                        Open Resource
                      </button>
                    )}
                    {resource.warning && (
                      <span className="rounded-full bg-[var(--highlight)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]">
                        {resource.warning}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </StudyInsightSection>

          <StudyInsightSection icon={<Star size={17} />} title="Types of Christ">
            <div className="space-y-2">
              {connections.types.length ? connections.types.map((type) => (
                <div key={type.id} className="rounded-2xl border border-[var(--line)] bg-white p-3">
                  <p className="text-sm font-semibold text-[var(--green)]">{type.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{type.description}</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--ink)]">{type.pointsToChrist}</p>
                  <ReferenceRow references={[...type.keyReferences, ...type.fulfillmentReferences]} onOpenReference={onOpenReference} />
                </div>
              )) : <p className="text-sm leading-6 text-[var(--muted)]">No reviewed type connection has been attached to this chapter yet.</p>}
            </div>
          </StudyInsightSection>

          <StudyInsightSection icon={<Clipboard size={17} />} title="Prophecy Connections">
            <div className="space-y-2">
              {connections.prophecies.length ? connections.prophecies.map((prophecy) => (
                <div key={prophecy.id} className="rounded-2xl border border-[var(--line)] bg-white p-3">
                  <p className="text-sm font-semibold text-[var(--green)]">{prophecy.prophecy} <span className="text-[var(--muted)]">→</span> {prophecy.fulfillment}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{prophecy.description}</p>
                  <ReferenceRow references={prophecy.relatedVerses} onOpenReference={onOpenReference} />
                </div>
              )) : <p className="text-sm leading-6 text-[var(--muted)]">No reviewed prophecy connection has been attached to this chapter yet.</p>}
            </div>
          </StudyInsightSection>
        </div>
      </article>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <div className="flex items-center gap-2 text-[var(--green)]">
            <BarChart3 size={18} />
            <h3 className="text-sm font-semibold">Chapter Analysis</h3>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MiniStat label="Verses" value={String(analysis.stats.verses)} />
            <MiniStat label="Words" value={String(analysis.stats.words)} />
            <MiniStat label="Key words" value={String(analysis.stats.uniqueWords)} />
            <MiniStat label="Selected" value={String(wordsFromText(selectedVerse.plainText).length)} />
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
            Average words per verse: {analysis.stats.averageWordsPerVerse}
          </p>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Repeated words</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {analysis.repeatedWords.length ? analysis.repeatedWords.slice(0, 10).map((item) => (
                <button
                  key={item.word}
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
                  onClick={() => onExplorerWordChange(item.word)}
                  type="button"
                >
                  {item.word} <span className="text-[var(--green)]">{item.count}</span>
                </button>
              )) : <span className="text-sm text-[var(--muted)]">No repeated study words found.</span>}
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Repeated phrases</p>
              <div className="mt-2 space-y-1">
                {analysis.repeatedPhrases.length ? analysis.repeatedPhrases.slice(0, 4).map((item) => (
                  <p key={item.phrase} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[var(--muted)]">
                    {item.phrase} <span className="text-[var(--green)]">x{item.count}</span>
                  </p>
                )) : <p className="text-sm text-[var(--muted)]">No repeated phrases found yet.</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Most referenced</p>
              <div className="mt-2 space-y-1">
                {analysis.mostReferencedVerses.length ? analysis.mostReferencedVerses.map((item) => (
                  <button
                    key={item.ref}
                    className="w-full rounded-xl bg-white px-3 py-2 text-left text-xs font-semibold text-[var(--green)]"
                    onClick={() => onOpenReference(item.ref)}
                    type="button"
                  >
                    {item.ref} <span className="text-[var(--muted)]">{item.count} links</span>
                  </button>
                )) : <p className="text-sm text-[var(--muted)]">More references will appear as TSK grows.</p>}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
          <div className="flex items-center gap-2 text-[var(--green)]">
            <Search size={18} />
            <h3 className="text-sm font-semibold">Occurrence Explorer</h3>
          </div>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Study word
            <input
              className="mt-2 h-11 w-full rounded-2xl border border-[var(--line)] bg-white px-3 text-base text-[var(--ink)] outline-none"
              value={explorerWord}
              onChange={(event) => onExplorerWordChange(event.target.value)}
            />
          </label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniStat label="Chapter" value={String(explorer.chapterOccurrences.length)} />
            <MiniStat label="Book" value={String(explorer.bookOccurrences.length)} />
            <MiniStat label="Bible" value={String(explorer.bibleOccurrences.length)} />
          </div>
          <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold capitalize text-[var(--ink)]">{explorer.word || "word"}</p>
              <button className="rounded-full bg-[var(--warm)] px-3 py-1 text-xs font-semibold text-[var(--green)]" onClick={() => onLookupWord(explorer.word)} type="button">
                Webster&apos;s 1828
              </button>
            </div>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--scripture-ink)]">{explorer.definition.definition}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedWords.map((item) => (
              <button
                key={`suggested-${item.word}`}
                className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)]"
                onClick={() => onExplorerWordChange(item.word)}
                type="button"
              >
                {item.word}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {explorer.bibleOccurrences[0] && (
              <button
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-left"
                onClick={() => onOpenReference(explorer.bibleOccurrences[0].ref)}
                type="button"
              >
                <p className="text-xs font-semibold text-[var(--green)]">First occurrence: {explorer.bibleOccurrences[0].ref}</p>
                <p className="mt-1 line-clamp-2 font-serif text-sm leading-6 text-[var(--scripture-ink)]">{explorer.bibleOccurrences[0].text}</p>
              </button>
            )}
            {explorer.chapterOccurrences.slice(0, 3).map((verse) => (
              <button
                key={`word-occurrence-${verse.ref}`}
                className="w-full rounded-xl bg-white px-3 py-2 text-left"
                onClick={() => onOpenReference(verse.ref)}
                type="button"
              >
                <p className="text-xs font-semibold text-[var(--green)]">{verse.ref}</p>
                <p className="mt-1 line-clamp-2 font-serif text-sm leading-6 text-[var(--scripture-ink)]">{verse.text}</p>
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {explorer.bibleOccurrences.slice(0, 12).map((verse) => (
              <button
                key={`chapter-explorer-ref-${explorer.lookupWord}-${verse.ref}`}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                onClick={() => onOpenReference(verse.ref)}
                type="button"
              >
                {verse.ref}
              </button>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--line)] bg-[var(--warm)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[var(--green)]">
              <NotebookPen size={18} />
              <h3 className="text-sm font-semibold">Teaching Mode</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {bookIntroduction && (
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                  onClick={onOpenBookIntroduction}
                  type="button"
                >
                  <BookOpen size={14} />
                  Book Introduction
                </button>
              )}
              <button
                className="inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-3 py-1.5 text-xs font-semibold text-white"
                onClick={copyTeachingNotes}
                type="button"
              >
                <Download size={14} />
                Export Teaching Notes
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                onClick={copyTeachingNotes}
                type="button"
              >
                <Clipboard size={14} />
                Copy Teaching Notes
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                onClick={downloadMarkdown}
                type="button"
              >
                <Download size={14} />
                Download Markdown
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                onClick={downloadPlainText}
                type="button"
              >
                <Download size={14} />
                Download Plain Text
              </button>
            </div>
          </div>
          {exportMessage && (
            <p className="mt-3 rounded-2xl border border-[var(--line)] bg-white px-3 py-2 text-sm leading-6 text-[var(--muted)]">
              {exportMessage}
            </p>
          )}

          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Show sections</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                ["summary", "Summary"],
                ["commentary", "Commentary"],
                ["crossReferences", "Cross References"],
                ["wordStudies", "Word Studies"],
                ["notes", "Notes"],
                ["lessonOutline", "Lesson Outline"],
              ].map(([id, label]) => (
                <button
                  key={`teaching-toggle-${id}`}
                  className={`scroll-mb-40 scroll-mt-40 shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    teachingVisibility[id as TeachingWorkspaceSectionId]
                      ? "bg-[var(--green)] text-white"
                      : "border border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
                  }`}
                  onClick={() => toggleTeachingSection(id as TeachingWorkspaceSectionId)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {teachingVisibility.summary && (
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Teaching Workspace Summary</p>
                <h4 className="mt-2 text-lg font-semibold text-[var(--ink)]">{teachingSummary.passage}</h4>
              </div>
              <span className="rounded-full bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--green)]">
                {teachingSummary.suggestedTitle}
              </span>
            </div>
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-[var(--paper)] px-3 py-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Main theme</dt>
                <dd className="mt-1 text-sm font-semibold text-[var(--ink)]">{teachingSummary.mainTheme}</dd>
              </div>
              <div className="rounded-xl bg-[var(--paper)] px-3 py-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Key verse</dt>
                <dd className="mt-1 text-sm font-semibold text-[var(--green)]">{teachingSummary.keyVerse}</dd>
              </div>
              <div className="rounded-xl bg-[var(--paper)] px-3 py-2 md:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">Main teaching aim</dt>
                <dd className="mt-1 text-sm leading-6 text-[var(--ink)]">{teachingSummary.teachingAim}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              {teachingSummary.keyWords.map((word) => (
                <button
                  key={`teaching-summary-word-${word}`}
                  className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]"
                  onClick={() => onExplorerWordChange(word)}
                  type="button"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <MiniStat label="Chapter notes" value={String(chapterNotes.length)} />
            <MiniStat label="Cross refs" value={String(chapterCrossReferences.length)} />
            <MiniStat label="Commentary links" value={String(chapterCommentaryEntries.length)} />
            <MiniStat label="Memory verses" value={String(memoryForChapter.length)} />
          </div>

          {teachingVisibility.wordStudies && (
            <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Word Studies</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedWords.length ? suggestedWords.map((item) => (
                  <button
                    key={`teaching-word-study-${item.word}`}
                    className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
                    onClick={() => onExplorerWordChange(item.word)}
                    type="button"
                  >
                    {item.word} <span className="text-[var(--green)]">{item.count}</span>
                  </button>
                )) : <span className="text-sm text-[var(--muted)]">No repeated study words found.</span>}
              </div>
            </div>
          )}

          {teachingVisibility.lessonOutline && (
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Lesson Outline Draft</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Built from reviewed chapter data, KJV references, commentary references, and your local teacher notes.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-3 py-1.5 text-xs font-semibold text-white"
                  onClick={copyLessonOutline}
                  type="button"
                >
                  <Clipboard size={14} />
                  Copy Lesson Outline
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                  onClick={downloadLessonOutlineMarkdown}
                  type="button"
                >
                  <Download size={14} />
                  Download Lesson Outline Markdown
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                  onClick={downloadFullTeachingNotesMarkdown}
                  type="button"
                >
                  <Download size={14} />
                  Download Full Teaching Notes Markdown
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {lessonOutlineSections.map((section) => (
                <section key={`lesson-outline-${section.title}`} className="rounded-xl bg-[var(--paper)] px-3 py-3">
                  <h5 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">{section.title}</h5>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-[var(--muted)]">
                    {sectionOrEmpty(section.lines).slice(0, 4).map((line) => (
                      <li key={`${section.title}-${line}`}>{line}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
          )}

          {teachingVisibility.notes && (
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Teacher Notes Area</p>
            <div className="mt-3 grid gap-3">
              <TeacherNoteField
                label="Hook / introduction"
                placeholder="Opening question, object lesson, or entry point..."
                value={teacherNotesDraft.hook}
                onChange={(value) => updateTeacherNote("hook", value)}
              />
              <TeacherNoteField
                label="Main points"
                placeholder="One point per line..."
                value={teacherNotesDraft.mainPoints}
                onChange={(value) => updateTeacherNote("mainPoints", value)}
              />
              <TeacherNoteField
                label="Illustration ideas"
                placeholder="Story, example, or visual idea..."
                value={teacherNotesDraft.illustrations}
                onChange={(value) => updateTeacherNote("illustrations", value)}
              />
              <TeacherNoteField
                label="Applications"
                placeholder="How should hearers respond to the passage?"
                value={teacherNotesDraft.applications}
                onChange={(value) => updateTeacherNote("applications", value)}
              />
              <TeacherNoteField
                label="Closing thought"
                placeholder="Closing sentence, invitation, or final emphasis..."
                value={teacherNotesDraft.closingThought}
                onChange={(value) => updateTeacherNote("closingThought", value)}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Saved locally for this browser during beta testing.</p>
          </div>
          )}

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Key verses</p>
              <div className="mt-2 space-y-1">
                {(chapterKeyVerses.length ? chapterKeyVerses : [selectedVerse.ref]).map((ref) => (
                  <button
                    key={`teaching-${ref}`}
                    className="w-full rounded-xl bg-white px-3 py-2 text-left text-xs font-semibold text-[var(--green)]"
                    onClick={() => onOpenReference(ref)}
                    type="button"
                  >
                    {ref}
                  </button>
                ))}
              </div>
            </div>
            {teachingVisibility.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Teaching notes</p>
              <div className="mt-2 space-y-1">
                {chapterNotes.slice(0, 3).map(([ref, notes]) => (
                  <button
                    key={`chapter-note-${ref}`}
                    className="w-full rounded-xl bg-white px-3 py-2 text-left text-xs font-semibold text-[var(--muted)]"
                    onClick={() => onOpenReference(ref)}
                    type="button"
                  >
                    {ref}: {notes[0]?.body.slice(0, 72)}
                  </button>
                ))}
                {!chapterNotes.length && <p className="text-sm leading-6 text-[var(--muted)]">Add verse notes and they will collect here for teaching prep.</p>}
              </div>
            </div>
            )}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <TeachingConnectionBlock title="People">
              {connections.people.length ? connections.people.map((person) => (
                <button
                  key={`teaching-person-${person.id}`}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                  onClick={() => onOpenPersonStudy(person.id)}
                  type="button"
                >
                  {person.name}
                </button>
              )) : <span className="text-sm text-[var(--muted)]">No reviewed people yet.</span>}
            </TeachingConnectionBlock>

            <TeachingConnectionBlock title="Places">
              {connections.places.length ? connections.places.map((place) => (
                <span key={`teaching-place-${place.id}`} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                  {place.name}
                </span>
              )) : <span className="text-sm text-[var(--muted)]">No reviewed places yet.</span>}
            </TeachingConnectionBlock>

            <TeachingConnectionBlock title="Timeline">
              {connections.timeline.length ? connections.timeline.map((entry) => (
                <span key={`teaching-timeline-${entry.id}`} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]">
                  {entry.era}: {entry.title}
                </span>
              )) : <span className="text-sm text-[var(--muted)]">No reviewed timeline yet.</span>}
            </TeachingConnectionBlock>

            <TeachingConnectionBlock title="Types">
              {connections.types.length ? connections.types.map((type) => (
                <span key={`teaching-type-${type.id}`} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]">
                  {type.title}
                </span>
              )) : <span className="text-sm text-[var(--muted)]">No reviewed types yet.</span>}
            </TeachingConnectionBlock>

            <TeachingConnectionBlock title="Prophecies">
              {connections.prophecies.length ? connections.prophecies.map((prophecy) => (
                <span key={`teaching-prophecy-${prophecy.id}`} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                  {prophecy.prophecy}
                </span>
              )) : <span className="text-sm text-[var(--muted)]">No reviewed prophecies yet.</span>}
            </TeachingConnectionBlock>
          </div>
          {teachingVisibility.crossReferences && (
          <div className="mt-3 flex flex-wrap gap-2">
            {chapterCrossReferences.slice(0, 4).map((reference) => (
              <button
                key={`teaching-cross-${reference.id}`}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)]"
                onClick={() => onOpenReference(reference.target_ref)}
                type="button"
              >
                {reference.target_ref}
              </button>
            ))}
          </div>
          )}
          {teachingVisibility.commentary && (
          <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Commentary Comparison</p>
            <div className="mt-2 space-y-2">
              {chapterCommentaryEntries.length ? chapterCommentaryEntries.map((entry) => (
                <details key={`teaching-commentary-${entry.id}`} className="group rounded-xl bg-[var(--paper)] px-3 py-2">
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[var(--green)]">
                          {entry.author} · {entry.resource_title}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                          {entry.reference ?? `${entry.book} ${entry.chapter}`} · {commentaryStudyLabel(entry)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="rounded-full bg-white px-2 py-1 text-[0.68rem] font-semibold text-[var(--muted)]">
                          Use with discernment
                        </span>
                        <span className="rounded-full bg-white px-2 py-1 text-[0.68rem] font-semibold text-[var(--green)] group-open:hidden">
                          Open
                        </span>
                        <span className="hidden rounded-full bg-white px-2 py-1 text-[0.68rem] font-semibold text-[var(--green)] group-open:inline">
                          Close
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--muted)]">{entry.entry_text}</p>
                  </summary>
                  <div className="mt-3 border-t border-[var(--line)] pt-3">
                    <p className="text-xs leading-5 text-[var(--ink)]">{entry.entry_text}</p>
                    {entry.recommended_use && (
                      <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs leading-5 text-[var(--muted)]">
                        Recommended use: {entry.recommended_use}
                      </p>
                    )}
                    <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Rights status: {entry.public_domain_status}</p>
                  </div>
                </details>
              )) : (
                <p className="text-sm leading-6 text-[var(--muted)]">No reviewed commentary entries yet.</p>
              )}
            </div>
          </div>
          )}
        </article>

        <article className="rounded-2xl border border-[var(--line)] bg-[var(--warm)] p-4">
          <div className="flex items-center gap-2 text-[var(--green)]">
            <Brain size={18} />
            <h3 className="text-sm font-semibold">Scripture Memory</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Build a local memory list, review with hidden words, and track progress.
          </p>
          <MemoryReviewCard
            item={memoryPreview}
            fallbackVerse={selectedVerse}
            onAddMemoryVerse={onAddMemoryVerse}
            onRemoveMemoryVerse={onRemoveMemoryVerse}
            onUpdateMemoryProgress={onUpdateMemoryProgress}
          />
          <div className="mt-3 grid gap-2">
            {memoryForChapter.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2">
                <button className="text-left text-xs font-semibold text-[var(--green)]" onClick={() => onOpenReference(item.verse_ref)} type="button">
                  {item.verse_ref}
                </button>
                <span className="text-xs font-semibold text-[var(--muted)]">{formatPercent(item.progress)}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
      <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
        Occurrence counts use the current local KJV text: {allVerses.length.toLocaleString()} verses available.
      </p>
    </section>
  );
}

function StudyInsightSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--warm)] p-3">
      <div className="flex items-center gap-2 text-[var(--green)]">
        {icon}
        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{title}</h4>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function PlaceContextCard({
  place,
  onOpenReference,
}: {
  place: StudyPlace;
  onOpenReference: (targetRef: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--green)]">{place.name}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{place.description}</p>
        </div>
        <span className="rounded-full bg-[var(--paper)] px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--muted)]">
          Map later
        </span>
      </div>
      <p className="mt-2 rounded-xl bg-[var(--paper)] px-3 py-2 text-xs leading-5 text-[var(--ink)]">
        {place.significance}
      </p>
      <ReferenceRow references={place.keyPassages.slice(0, 4)} onOpenReference={onOpenReference} />
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{place.mapNote}</p>
    </article>
  );
}

function TimelineContextCard({
  entry,
  onOpenReference,
}: {
  entry: StudyTimelineEntry;
  onOpenReference: (targetRef: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--green)]">{entry.title}</p>
          <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{entry.era} · {entry.timeframe}</p>
        </div>
        <span className="rounded-full bg-[var(--paper)] px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--muted)]">
          Timeline
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{entry.description}</p>
      <ReferenceRow references={entry.keyPassages.slice(0, 4)} onOpenReference={onOpenReference} />
    </article>
  );
}

function ReferenceRow({
  references,
  onOpenReference,
}: {
  references: string[];
  onOpenReference: (targetRef: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {references.map((reference) => (
        <button
          key={`reference-row-${reference}`}
          className="rounded-full bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
          onClick={() => onOpenReference(reference)}
          type="button"
        >
          {reference}
        </button>
      ))}
    </div>
  );
}

function TeachingConnectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function TeacherNoteField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
      {label}
      <textarea
        className="mt-2 min-h-24 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm normal-case leading-6 tracking-normal text-[var(--ink)] outline-none"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-white px-3 py-2">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

function MemoryReviewCard({
  item,
  fallbackVerse,
  onAddMemoryVerse,
  onRemoveMemoryVerse,
  onUpdateMemoryProgress,
}: {
  item: ScriptureMemoryItem | null;
  fallbackVerse: BibleVerse;
  onAddMemoryVerse: (ref: string) => void;
  onRemoveMemoryVerse: (ref: string) => void;
  onUpdateMemoryProgress: (ref: string, progress: number) => void;
}) {
  const verseRef = item?.verse_ref ?? fallbackVerse.ref;
  const verseText = item?.verse_text ?? fallbackVerse.text;

  return (
    <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--green)]">{verseRef}</p>
        <span className="rounded-full bg-[var(--paper)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
          {item ? `${formatPercent(item.progress)} learned` : "Not added"}
        </span>
      </div>
      <p className="mt-2 font-serif text-base leading-7 text-[var(--scripture-ink)]">{verseText}</p>
      <div className="mt-3 rounded-xl bg-[var(--paper)] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Hide words</p>
        <p className="mt-2 font-serif text-sm leading-6 text-[var(--scripture-ink)]">{hideEveryOtherWord(verseText)}</p>
      </div>
      <div className="mt-3 rounded-xl bg-[var(--paper)] p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">First-letter prompt</p>
        <p className="mt-2 font-serif text-sm leading-6 text-[var(--scripture-ink)]">{firstLetterPrompt(verseText)}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="rounded-full bg-[var(--green)] px-4 py-2.5 text-xs font-semibold text-white"
          onClick={() => (item ? onUpdateMemoryProgress(verseRef, Math.min(100, item.progress + 25)) : onAddMemoryVerse(verseRef))}
          type="button"
        >
          {item ? "Repeat verse" : "Add to memory"}
        </button>
        <button
          className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-xs font-semibold text-[var(--muted)] disabled:opacity-40"
          disabled={!item}
          onClick={() => onRemoveMemoryVerse(verseRef)}
          type="button"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function SearchScreen({
  searchTerm,
  searchFilter,
  results,
  dictionarySearchTerm,
  dictionarySearchResults,
  dictionarySearchStatus,
  onSearchTermChange,
  onSearchFilterChange,
  onDictionarySearchTermChange,
  onOpenVerse,
  onOpenDictionaryEntry,
}: {
  searchTerm: string;
  searchFilter: TestamentFilter;
  results: BibleVerse[];
  dictionarySearchTerm: string;
  dictionarySearchResults: DictionarySearchResult[];
  dictionarySearchStatus: string;
  onSearchTermChange: (value: string) => void;
  onSearchFilterChange: (value: TestamentFilter) => void;
  onDictionarySearchTermChange: (value: string) => void;
  onOpenVerse: (verse: BibleVerse) => void;
  onOpenDictionaryEntry: (entry: DictionarySearchResult) => void;
}) {
  const filters: { id: TestamentFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "old", label: "Old Testament" },
    { id: "new", label: "New Testament" },
  ];

  return (
    <div className="space-y-4 p-4 md:p-8">
      <form
        className="rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          onSearchTermChange(searchTerm);
        }}
      >
        <label className="text-sm font-semibold text-[var(--muted)]">
          Search the KJV
          <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4">
            <Search size={18} className="text-[var(--green)]" />
            <input
              className="w-full bg-transparent text-base outline-none placeholder:text-stone-400"
              placeholder="faith, grace, John 3:16..."
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
            />
          </div>
        </label>
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <button className="rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white" type="submit">
            Search
          </button>
          <button
            className="rounded-full border border-[var(--line)] bg-[var(--warm)] px-4 py-3 text-sm font-semibold text-[var(--ink)]"
            onClick={() => {
              onSearchTermChange("");
            }}
            type="button"
          >
            Clear search
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                searchFilter === filter.id
                  ? "bg-[var(--ink)] text-white"
                  : "border border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
              }`}
              onClick={() => onSearchFilterChange(filter.id)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </form>

      <section className="space-y-3">
        {searchTerm.trim().length < 2 ? (
          <EmptyState title="Type at least two letters" body="Search matches references and KJV verse text." />
        ) : results.length === 0 ? (
          <EmptyState title="No results found" body="Try a shorter word or another phrase." />
        ) : (
          <>
            <p className="px-1 text-sm font-semibold text-[var(--muted)]">
              Showing {results.length} result{results.length === 1 ? "" : "s"}
            </p>
            {results.map((verse) => (
              <button
                key={verse.ref}
                className="w-full rounded-2xl border border-[var(--line)] bg-white p-4 text-left shadow-sm"
                onClick={() => onOpenVerse(verse)}
                type="button"
              >
                <p className="text-sm font-semibold text-[var(--green)]">{verse.ref}</p>
                <p className="mt-2 font-serif text-lg leading-7 text-[var(--scripture-ink)]">
                  <HighlightedText text={verse.text} query={searchTerm} />
                </p>
              </button>
            ))}
          </>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm">
        <label className="text-sm font-semibold text-[var(--muted)]">
          Search Webster&apos;s 1828
          <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4">
            <BookOpen size={18} className="text-[var(--green)]" />
            <input
              className="w-full bg-transparent text-base outline-none placeholder:text-stone-400"
              placeholder="believe, love, death..."
              value={dictionarySearchTerm}
              onChange={(event) => onDictionarySearchTermChange(event.target.value)}
            />
          </div>
        </label>

        <div className="mt-3 space-y-3">
          {dictionarySearchTerm.trim().length < 2 ? (
            <p className="text-sm leading-6 text-[var(--muted)]">Search the imported Webster&apos;s 1828 headwords.</p>
          ) : dictionarySearchResults.length === 0 ? (
            <p className="text-sm leading-6 text-[var(--muted)]">{dictionarySearchStatus || "No dictionary entries found yet."}</p>
          ) : (
            dictionarySearchResults.map((entry) => (
              <button
                key={`${entry.normalized_headword}-${entry.source_line_start}-${entry.source_line_end}`}
                className="w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 text-left"
                onClick={() => onOpenDictionaryEntry(entry)}
                type="button"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-[var(--ink)]">{entry.headword}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--green)]">Webster&apos;s 1828</span>
                </div>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--scripture-ink)]">{entry.definition}</p>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const terms = getSearchTerms(query);
  if (!terms.length) return text;

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  return text.split(pattern).map((part, index) => {
    const matched = terms.some((term) => part.toLowerCase() === term.toLowerCase());
    if (!matched) return <span key={`${part}-${index}`}>{part}</span>;
    return (
      <mark key={`${part}-${index}`} className="rounded bg-[var(--highlight)] px-1 text-[var(--scripture-ink)]">
        {part}
      </mark>
    );
  });
}

function getSearchTerms(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const terms = [trimmed, ...trimmed.split(/\s+/)].filter((term) => term.length > 1);
  return Array.from(new Set(terms)).sort((a, b) => b.length - a.length);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function NotesScreen({
  notes,
  highlights,
  bookmarks,
  verses,
  onOpenVerse,
}: {
  notes: UserNote[];
  highlights: UserHighlight[];
  bookmarks: UserBookmark[];
  verses: BibleVerse[];
  onOpenVerse: (verse: BibleVerse) => void;
}) {
  const items = [
    ...notes.map((note) => ({ kind: "Note", ref: note.verse_ref, body: note.body, created_at: note.created_at })),
    ...highlights.map((highlight) => ({ kind: "Highlight", ref: highlight.verse_ref, body: "Highlighted verse", created_at: highlight.created_at })),
    ...bookmarks.map((bookmark) => ({ kind: "Bookmark", ref: bookmark.verse_ref, body: "Bookmarked verse", created_at: bookmark.created_at })),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <div className="space-y-4 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Notes & Highlights</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Signed-in study data syncs to Supabase. Signed-out study data stays in local storage.</p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No saved study items yet" body="Open a verse to add a highlight, note, or bookmark." />
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const verse = verses.find((candidate) => candidate.ref === item.ref);
            return (
              <button
                key={`${item.kind}-${item.ref}-${index}`}
                className="w-full rounded-2xl border border-[var(--line)] bg-white p-4 text-left shadow-sm"
                onClick={() => verse && onOpenVerse(verse)}
                type="button"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--green)]">{item.ref}</p>
                  <p className="rounded-full bg-[var(--warm)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">{item.kind}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--ink)]">{item.body}</p>
                {verse && <p className="mt-3 font-serif text-base leading-7 text-[var(--scripture-ink)]">{verse.text}</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function libraryResourceMatches(resource: LibraryResource, terms: string[]) {
  const haystack = [
    resource.title,
    resource.author,
    resource.category,
    resource.original_category ?? "",
    resource.description,
    ...resource.resource_labels,
    ...resource.resource_warnings,
  ]
    .join(" ")
    .toLowerCase();

  return terms.some((term) => haystack.includes(term.toLowerCase()));
}

function libraryReadingMinutes(resource: LibraryResource) {
  if (!resource.word_count) return "Time unknown";
  return `${Math.max(1, Math.round(resource.word_count / 225))} min read`;
}

function voiceDisplayName(voice: SpeechSynthesisVoice) {
  const lower = voice.name.toLowerCase();
  const label = lower.includes("female")
    ? "Female"
    : lower.includes("male")
      ? "Male"
      : voice.localService
        ? "Device voice"
        : "Browser voice";
  return `${voice.name} · ${label}`;
}

function annotationLabel(type: LibraryAnnotationType) {
  if (type === "highlight") return "Highlight";
  if (type === "note") return "Note";
  return "Bookmark";
}

function LibraryScreen({
  view,
  resources,
  filteredResources,
  categories,
  activeCategory,
  searchTerm,
  activeResource,
  activeText,
  loading,
  progressState,
  completedResources,
  completedState,
  listeningProgress,
  annotations,
  noteDraft,
  continueReadingResources,
  featuredResources,
  stats,
  fontSize,
  speechState,
  speechVoices,
  selectedSpeechVoiceURI,
  readerRef,
  onCategoryChange,
  onSearchTermChange,
  onOpenHome,
  onOpenDetail,
  onOpenReader,
  onScrollReader,
  onFontSizeChange,
  onReaderSettingsChange,
  onBookmarkLocation,
  onJumpBookmark,
  onNoteDraftChange,
  onSaveAnnotation,
  onCopySelection,
  onListenResource,
  onSpeechRateChange,
  onSpeechVoiceChange,
  onStopSpeech,
  onSleepTimerChange,
  onMarkFinished,
  onRestartResource,
  onRemoveCompleted,
  onReadAgain,
}: {
  view: LibraryView;
  resources: LibraryResource[];
  filteredResources: LibraryResource[];
  categories: string[];
  activeCategory: string;
  searchTerm: string;
  activeResource: LibraryResource | null;
  activeText: string;
  loading: boolean;
  progressState: LibraryProgressState;
  completedResources: CompletedResource[];
  completedState: CompletedResourceState;
  listeningProgress: ListeningProgressState;
  annotations: LibraryAnnotationState;
  noteDraft: string;
  continueReadingResources: LibraryProgress[];
  featuredResources: LibraryResource[];
  stats: {
    booksStarted: number;
    booksCompleted: number;
    readingStreak: string;
    totalResources: number;
  };
  fontSize: number;
  speechState: SpeechState;
  speechVoices: SpeechSynthesisVoice[];
  selectedSpeechVoiceURI: string;
  readerRef: React.RefObject<HTMLDivElement | null>;
  onCategoryChange: (category: string) => void;
  onSearchTermChange: (value: string) => void;
  onOpenHome: () => void;
  onOpenDetail: (slug: string) => void;
  onOpenReader: (slug: string) => void;
  onScrollReader: () => void;
  onFontSizeChange: (size: number) => void;
  onReaderSettingsChange: (settings: Partial<Pick<LibraryProgress, "lineSpacing" | "readingWidth" | "theme">>) => void;
  onBookmarkLocation: () => void;
  onJumpBookmark: (progress: number) => void;
  onNoteDraftChange: (value: string) => void;
  onSaveAnnotation: (type: LibraryAnnotationType) => void;
  onCopySelection: () => void;
  onListenResource: (resource: LibraryResource, text: string, progress: number) => void;
  onSpeechRateChange: (rate: number) => void;
  onSpeechVoiceChange: (voiceURI: string) => void;
  onStopSpeech: () => void;
  onSleepTimerChange: (minutes: number | null) => void;
  onMarkFinished: (resource: LibraryResource) => void;
  onRestartResource: (resource: LibraryResource) => void;
  onRemoveCompleted: (slug: string) => void;
  onReadAgain: (slug: string) => void;
}) {
  if (view === "reader" && activeResource) {
    const progress = progressState[activeResource.slug];
    const listening = listeningProgress[activeResource.slug];
    return (
      <LibraryReader
        resource={activeResource}
        text={activeText}
        loading={loading}
        progress={progress}
        completed={Boolean(completedState[activeResource.slug])}
        listeningProgress={listening}
        annotations={annotations[activeResource.slug] ?? []}
        noteDraft={noteDraft}
        fontSize={fontSize}
        readerRef={readerRef}
        onBack={() => onOpenDetail(activeResource.slug)}
        onHome={onOpenHome}
        onScroll={onScrollReader}
        onFontSizeChange={onFontSizeChange}
        onReaderSettingsChange={onReaderSettingsChange}
        onBookmarkLocation={onBookmarkLocation}
        onJumpBookmark={onJumpBookmark}
        onNoteDraftChange={onNoteDraftChange}
        onSaveAnnotation={onSaveAnnotation}
        onCopySelection={onCopySelection}
        speechState={speechState}
        speechVoices={speechVoices}
        selectedSpeechVoiceURI={selectedSpeechVoiceURI}
        onListen={() => onListenResource(activeResource, activeText, listening?.progress ?? progress?.progress ?? 0)}
        onSpeechRateChange={onSpeechRateChange}
        onSpeechVoiceChange={onSpeechVoiceChange}
        onStopSpeech={onStopSpeech}
        onSleepTimerChange={onSleepTimerChange}
        onMarkFinished={() => onMarkFinished(activeResource)}
        onRestart={() => onRestartResource(activeResource)}
      />
    );
  }

  if (view === "detail" && activeResource) {
    return (
      <LibraryDetail
        resource={activeResource}
        progress={progressState[activeResource.slug]}
        completed={completedState[activeResource.slug]}
        onBack={onOpenHome}
        onOpenReader={() => onOpenReader(activeResource.slug)}
        onReadAgain={() => onReadAgain(activeResource.slug)}
      />
    );
  }

  const recentlyAdded = resources.slice(-8).reverse();
  const resourcesByAuthor = Object.entries(
    resources.reduce<Record<string, LibraryResource[]>>((groups, resource) => {
      groups[resource.author] = [...(groups[resource.author] ?? []), resource];
      return groups;
    }, {}),
  )
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .slice(0, 8);
  const categoryCards = categories
    .filter((category) => category !== "All")
    .map((category) => ({
      category,
      resources: resources.filter((resource) => resource.category === category),
    }))
    .filter((item) => item.resources.length)
    .slice(0, 12);
  const subjectShelves = [
    { title: "Commentary", resources: resources.filter((resource) => libraryResourceMatches(resource, ["commentary", "commentaries"])) },
    { title: "Prayer", resources: resources.filter((resource) => libraryResourceMatches(resource, ["prayer", "pray"])) },
    { title: "Bible Study", resources: resources.filter((resource) => libraryResourceMatches(resource, ["dictionary", "topical", "cross references", "bible study", "handbook", "survey"])) },
    { title: "KJV Defense / Textual Issues", resources: resources.filter((resource) => libraryResourceMatches(resource, ["kjv", "king james", "textual", "scripture", "authorized"])) },
    { title: "Baptist History", resources: resources.filter((resource) => libraryResourceMatches(resource, ["baptist history", "baptist"])) },
    { title: "Missions", resources: resources.filter((resource) => libraryResourceMatches(resource, ["missions", "missionary", "mission"])) },
    { title: "Preaching & Teaching", resources: resources.filter((resource) => libraryResourceMatches(resource, ["preaching", "teaching", "sermon", "devotional"])) },
  ].filter((shelf) => shelf.resources.length);

  return (
    <div className="space-y-5 p-4 pb-36 md:p-8 md:pb-10">
      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Library</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
              Curated study resources
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
              Browse verified public-domain resources with category, rights, doctrinal review, and recommended-use labels visible before you read.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--warm)] px-4 py-3 text-center">
            <p className="text-2xl font-semibold text-[var(--green)]">{resources.length}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Resources</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <LibraryStat label="Books started" value={String(stats.booksStarted)} />
        <LibraryStat label="Books completed" value={String(stats.booksCompleted)} />
        <LibraryStat label="Reading streak" value={stats.readingStreak} />
        <LibraryStat label="Available" value={String(stats.totalResources)} />
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm">
        <label className="text-sm font-semibold text-[var(--muted)]">
          Search Library
          <div className="mt-2 flex h-12 items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4">
            <Search size={18} className="text-[var(--green)]" />
            <input
              className="w-full bg-transparent text-base outline-none placeholder:text-stone-400"
              placeholder="title, author, category, label..."
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
            />
          </div>
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                activeCategory === category
                  ? "bg-[var(--ink)] text-white"
                  : "border border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
              }`}
              onClick={() => onCategoryChange(category)}
              type="button"
            >
              {libraryCategoryLabel(category)}
            </button>
          ))}
        </div>
      </section>

      {featuredResources.length > 0 && (
        <LibraryShelf title="Featured">
          {featuredResources.map((resource) => (
            <LibraryResourceCard
              key={`featured-${resource.slug}`}
              resource={resource}
              progress={progressState[resource.slug]}
              listeningProgress={listeningProgress[resource.slug]}
              completed={Boolean(completedState[resource.slug])}
              onOpen={() => onOpenDetail(resource.slug)}
            />
          ))}
        </LibraryShelf>
      )}

      {continueReadingResources.length > 0 && (
        <LibraryShelf title="Continue Reading" horizontal>
          {continueReadingResources.map((progress) => (
            <button
              key={`continue-${progress.slug}`}
              className="min-w-[260px] rounded-2xl border border-[var(--line)] bg-white p-4 text-left shadow-sm md:min-w-0"
              onClick={() => onOpenReader(progress.slug)}
              type="button"
            >
              <p className="text-sm font-semibold text-[var(--green)]">{progress.title}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{progress.author}</p>
              <div className="mt-3 h-2 rounded-full bg-[var(--warm)]">
                <div className="h-2 rounded-full bg-[var(--green)]" style={{ width: formatPercent(progress.progress) }} />
              </div>
              <p className="mt-2 text-xs font-semibold text-[var(--muted)]">{formatPercent(progress.progress)} read</p>
            </button>
          ))}
        </LibraryShelf>
      )}

      {recentlyAdded.length > 0 && (
        <LibraryShelf title="Recently Added">
          {recentlyAdded.map((resource) => (
            <LibraryResourceCard
              key={`recent-${resource.slug}`}
              resource={resource}
              progress={progressState[resource.slug]}
              listeningProgress={listeningProgress[resource.slug]}
              completed={Boolean(completedState[resource.slug])}
              onOpen={() => onOpenDetail(resource.slug)}
            />
          ))}
        </LibraryShelf>
      )}

      {completedResources.length > 0 && (
        <LibraryShelf title="Completed" horizontal>
          {completedResources.map((completed) => (
            <article key={`completed-${completed.slug}`} className="min-w-[260px] rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm md:min-w-0">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-[var(--green)]" size={20} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)]">{completed.title}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{completed.author}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">Completed {new Date(completed.completedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-3 py-2 text-sm font-semibold text-white" onClick={() => onReadAgain(completed.slug)} type="button">
                  <RotateCcw size={15} />
                  Read Again
                </button>
                <button className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm font-semibold text-[var(--muted)]" onClick={() => onRemoveCompleted(completed.slug)} type="button">
                  <Trash2 size={15} />
                  Remove
                </button>
              </div>
            </article>
          ))}
        </LibraryShelf>
      )}

      {resourcesByAuthor.length > 0 && (
        <LibraryShelf title="By Author" horizontal>
          {resourcesByAuthor.map(([author, authorResources]) => (
            <button
              key={`author-${author}`}
              className="min-w-[220px] rounded-2xl border border-[var(--line)] bg-white p-4 text-left shadow-sm"
              onClick={() => onSearchTermChange(author)}
              type="button"
            >
              <p className="text-base font-semibold text-[var(--ink)]">{author}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{authorResources.length} resource{authorResources.length === 1 ? "" : "s"}</p>
              <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--scripture-ink)]">{authorResources.slice(0, 3).map((resource) => resource.title).join(", ")}</p>
            </button>
          ))}
        </LibraryShelf>
      )}

      <LibraryShelf title="By Category" horizontal>
        {categoryCards.map(({ category, resources: categoryResources }) => (
          <button
            key={`category-${category}`}
            className="min-w-[220px] rounded-2xl border border-[var(--line)] bg-white p-4 text-left shadow-sm"
            onClick={() => onCategoryChange(category)}
            type="button"
          >
            <p className="text-base font-semibold text-[var(--ink)]">{libraryCategoryLabel(category)}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{categoryResources.length} resource{categoryResources.length === 1 ? "" : "s"}</p>
            <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--scripture-ink)]">{categoryResources.slice(0, 2).map((resource) => resource.title).join(", ")}</p>
          </button>
        ))}
      </LibraryShelf>

      {subjectShelves.map((shelf) => (
        <LibraryShelf key={`subject-${shelf.title}`} title={shelf.title}>
          {shelf.resources.slice(0, 8).map((resource) => (
            <LibraryResourceCard
              key={`${shelf.title}-${resource.slug}`}
              resource={resource}
              progress={progressState[resource.slug]}
              listeningProgress={listeningProgress[resource.slug]}
              completed={Boolean(completedState[resource.slug])}
              onOpen={() => onOpenDetail(resource.slug)}
            />
          ))}
        </LibraryShelf>
      ))}

      <LibraryShelf title={searchTerm || activeCategory !== "All" ? "Search Results" : "All Resources"}>
        {(searchTerm || activeCategory !== "All" ? filteredResources : resources).map((resource) => (
          <LibraryResourceCard
            key={resource.slug}
            resource={resource}
            progress={progressState[resource.slug]}
            listeningProgress={listeningProgress[resource.slug]}
            completed={Boolean(completedState[resource.slug])}
            onOpen={() => onOpenDetail(resource.slug)}
          />
        ))}
      </LibraryShelf>
    </div>
  );
}

function LibraryDetail({
  resource,
  progress,
  completed,
  onBack,
  onOpenReader,
  onReadAgain,
}: {
  resource: LibraryResource;
  progress?: LibraryProgress;
  completed?: CompletedResource;
  onBack: () => void;
  onOpenReader: () => void;
  onReadAgain: () => void;
}) {
  return (
    <div className="space-y-4 p-4 pb-36 md:p-8 md:pb-10">
      <button
        className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--green)] shadow-sm"
        onClick={onBack}
        type="button"
      >
        <ChevronLeft size={17} />
        Back to Library
      </button>

      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{libraryCategoryLabel(resource.category)}</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">{resource.title}</h1>
            <p className="mt-3 text-base leading-7 text-[var(--muted)]">
              {resource.author} {resource.year ? `(${resource.year})` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white" onClick={completed ? onReadAgain : onOpenReader} type="button">
              {completed ? "Read Again" : progress?.progress ? "Continue Reading" : "Open Resource"}
            </button>
            {completed && (
              <button className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--green)]" onClick={onReadAgain} type="button">
                <RotateCcw size={16} />
                Restart
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--scripture-ink)]">{resource.description}</p>
        <ResourceBadgeRow labels={resource.resource_labels} warnings={resource.resource_warnings} />

        {progress && (
          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--warm)] p-4">
            <div className="flex items-center justify-between gap-3 text-sm font-semibold text-[var(--muted)]">
              <span>{completed ? "Completed" : "Reading progress"}</span>
              <span>{completed ? new Date(completed.completedAt).toLocaleDateString() : formatPercent(progress.progress)}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white">
              <div className="h-2 rounded-full bg-[var(--green)]" style={{ width: formatPercent(progress.progress) }} />
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Resource Labels</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <StatusCard label="Category" status={libraryCategoryLabel(resource.category)} good />
          <StatusCard label="Author" status={resource.author} good />
          <StatusCard label="Year" status={resource.year ? String(resource.year) : "Unknown"} good={Boolean(resource.year)} />
          <StatusCard label="Public domain status" status={resource.public_domain_status} good={resource.public_domain_status === "verified"} />
          <StatusCard label="Rights status" status={resource.rights_status.replaceAll("_", " ")} good={resource.rights_status.startsWith("verified")} />
          <StatusCard label="Doctrinal review" status={resource.doctrinal_review_status} good={!resource.doctrinal_review_status.toLowerCase().includes("rejected")} />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Perspective notes</p>
            <p className="mt-2 text-sm leading-6 text-[var(--scripture-ink)]">{resource.perspective_notes}</p>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Recommended use</p>
            <p className="mt-2 text-sm leading-6 text-[var(--scripture-ink)]">{resource.recommended_use}</p>
          </div>
        </div>
        <ResourceBadgeRow labels={resource.resource_labels} warnings={resource.resource_warnings} />
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Rights Details</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <StatusCard label="Public domain" status={resource.public_domain_status} good={resource.public_domain_status === "verified"} />
          <StatusCard label="Commercial use" status={resource.commercial_use_status.replaceAll("_", " ")} good={resource.commercial_use_status.startsWith("verified")} />
          <StatusCard label="Words" status={resource.word_count ? resource.word_count.toLocaleString() : "Unknown"} good={Boolean(resource.word_count)} />
        </div>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{resource.rights_basis}</p>
      </section>
    </div>
  );
}

function LibraryReader({
  resource,
  text,
  loading,
  progress,
  completed,
  listeningProgress,
  annotations,
  noteDraft,
  fontSize,
  readerRef,
  onBack,
  onHome,
  onScroll,
  onFontSizeChange,
  onReaderSettingsChange,
  onBookmarkLocation,
  onJumpBookmark,
  onNoteDraftChange,
  onSaveAnnotation,
  onCopySelection,
  speechState,
  speechVoices,
  selectedSpeechVoiceURI,
  onListen,
  onSpeechRateChange,
  onSpeechVoiceChange,
  onStopSpeech,
  onSleepTimerChange,
  onMarkFinished,
  onRestart,
}: {
  resource: LibraryResource;
  text: string;
  loading: boolean;
  progress?: LibraryProgress;
  completed: boolean;
  listeningProgress?: ListeningProgress;
  annotations: LibraryAnnotation[];
  noteDraft: string;
  fontSize: number;
  readerRef: React.RefObject<HTMLDivElement | null>;
  onBack: () => void;
  onHome: () => void;
  onScroll: () => void;
  onFontSizeChange: (size: number) => void;
  onReaderSettingsChange: (settings: Partial<Pick<LibraryProgress, "lineSpacing" | "readingWidth" | "theme">>) => void;
  onBookmarkLocation: () => void;
  onJumpBookmark: (progress: number) => void;
  onNoteDraftChange: (value: string) => void;
  onSaveAnnotation: (type: LibraryAnnotationType) => void;
  onCopySelection: () => void;
  speechState: SpeechState;
  speechVoices: SpeechSynthesisVoice[];
  selectedSpeechVoiceURI: string;
  onListen: () => void;
  onSpeechRateChange: (rate: number) => void;
  onSpeechVoiceChange: (voiceURI: string) => void;
  onStopSpeech: () => void;
  onSleepTimerChange: (minutes: number | null) => void;
  onMarkFinished: () => void;
  onRestart: () => void;
}) {
  const speechActive = speechState.targetId === `resource-${resource.slug}` && speechState.playing;
  const activeProgress = progress ?? defaultLibraryProgress(resource, fontSize);
  const readerThemeClass =
    activeProgress.theme === "dark"
      ? "bg-[#171712] text-[#eee8d8]"
      : activeProgress.theme === "light"
        ? "bg-[#fffdf8] text-[#292721]"
        : "bg-[var(--scripture)] text-[var(--scripture-ink)]";
  const readerWidthClass =
    activeProgress.readingWidth === "narrow"
      ? "max-w-2xl"
      : activeProgress.readingWidth === "wide"
        ? "max-w-5xl"
        : "max-w-3xl";
  const estimatedMinutes = resource.word_count ? Math.max(1, Math.round(resource.word_count / 225)) : null;
  const listeningValue = listeningProgress?.progress ?? speechState.progress;

  return (
    <div className={`flex h-[calc(100vh-96px)] flex-col overflow-x-hidden md:h-[calc(100vh-48px)] ${readerThemeClass}`}>
      <header className="shrink-0 overflow-x-hidden border-b border-[var(--line)] bg-[var(--paper)]/95 p-3 backdrop-blur md:p-4">
        <div className="flex items-center justify-between gap-2">
          <button className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--green)] shadow-sm" onClick={onBack} type="button">
            <ChevronLeft size={17} />
            Detail
          </button>
          <button className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--muted)] shadow-sm" onClick={onHome} type="button">
            Library
          </button>
        </div>

        <div className="mt-3 min-w-0">
          <h1 className="truncate text-lg font-semibold text-[var(--ink)]">{resource.title}</h1>
          <p className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{resource.author}</p>
        </div>

        <div className="mt-3 grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--green)]"
            onClick={() => onFontSizeChange(Math.max(15, fontSize - 1))}
            title="Decrease font size"
            type="button"
          >
            <Minus size={17} />
          </button>
            <div>
            <div className="h-2 rounded-full bg-white">
              <div className="h-2 rounded-full bg-[var(--green)]" style={{ width: formatPercent(activeProgress.progress) }} />
            </div>
            <p className="mt-1 text-center text-xs font-semibold text-[var(--muted)]">
              {completed ? "Completed" : `${formatPercent(activeProgress.progress)} read`}
              {estimatedMinutes ? ` · about ${estimatedMinutes} min` : ""}
              {listeningValue > 0 && listeningValue < 100 ? ` · ${formatPercent(listeningValue)} listened` : ""}
            </p>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--green)]"
            onClick={() => onFontSizeChange(Math.min(24, fontSize + 1))}
            title="Increase font size"
            type="button"
          >
            <Plus size={17} />
          </button>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Line spacing
            <select
              className="mt-1 h-10 w-full rounded-full border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)] outline-none"
              value={activeProgress.lineSpacing}
              onChange={(event) => onReaderSettingsChange({ lineSpacing: Number(event.target.value) })}
            >
              <option value={1.45}>Tight</option>
              <option value={1.65}>Normal</option>
              <option value={1.9}>Roomy</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Width
            <select
              className="mt-1 h-10 w-full rounded-full border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)] outline-none"
              value={activeProgress.readingWidth}
              onChange={(event) => onReaderSettingsChange({ readingWidth: event.target.value as LibraryReadingWidth })}
            >
              <option value="narrow">Narrow</option>
              <option value="comfortable">Comfort</option>
              <option value="wide">Wide</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Theme
            <select
              className="mt-1 h-10 w-full rounded-full border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)] outline-none"
              value={activeProgress.theme}
              onChange={(event) => onReaderSettingsChange({ theme: event.target.value as LibraryReaderTheme })}
            >
              <option value="light">Light</option>
              <option value="sepia">Sepia</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-white"
            onClick={onListen}
            type="button"
          >
            {speechActive && !speechState.paused ? <Pause size={16} /> : <Play size={16} />}
            {speechActive ? (speechState.paused ? "Resume" : "Pause") : "Listen"}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--muted)]"
            onClick={onStopSpeech}
            type="button"
          >
            <Square size={15} />
            Stop
          </button>
          <label className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--muted)]">
            Speed
            <select
              className="bg-transparent text-[var(--ink)] outline-none"
              value={speechState.rate}
              onChange={(event) => onSpeechRateChange(Number(event.target.value))}
            >
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </label>
          <label className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--muted)] sm:min-w-[220px]">
            <Volume2 size={15} />
            Voice
            <select
              className="min-w-0 flex-1 bg-transparent text-[var(--ink)] outline-none"
              value={selectedSpeechVoiceURI}
              onChange={(event) => onSpeechVoiceChange(event.target.value)}
            >
              {speechVoices.length ? speechVoices.map((voice) => (
                <option key={voice.voiceURI} value={voice.voiceURI}>
                  {voiceDisplayName(voice)}
                </option>
              )) : (
                <option value="">Default device voice</option>
              )}
            </select>
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--muted)]">
            <Timer size={15} />
            Sleep
            <select
              className="bg-transparent text-[var(--ink)] outline-none"
              value={speechState.sleepTimerMinutes ?? ""}
              onChange={(event) => onSleepTimerChange(event.target.value ? Number(event.target.value) : null)}
            >
              <option value="">Off</option>
              <option value={5}>5m</option>
              <option value={10}>10m</option>
              <option value={15}>15m</option>
              <option value={30}>30m</option>
              <option value={60}>60m</option>
            </select>
          </label>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-4 py-2 text-sm font-semibold text-white"
            onClick={onBookmarkLocation}
            type="button"
          >
            <Bookmark size={16} />
            Bookmark
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--green)]"
            onClick={() => onSaveAnnotation("highlight")}
            type="button"
          >
            <Highlighter size={16} />
            Highlight Selection
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--green)]"
            onClick={onCopySelection}
            type="button"
          >
            <Clipboard size={16} />
            Copy Selection
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--green)]"
            onClick={() => onSaveAnnotation("bookmark")}
            type="button"
          >
            <Bookmark size={16} />
            Bookmark Place
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[var(--gold)] px-4 py-2 text-sm font-semibold text-white"
            onClick={onMarkFinished}
            type="button"
          >
            <CheckCircle2 size={16} />
            Mark Finished
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--muted)]"
            onClick={onRestart}
            type="button"
          >
            <RotateCcw size={16} />
            Restart
          </button>
          {(progress?.bookmarks ?? []).map((bookmark) => (
            <button
              key={`reader-bookmark-${bookmark}`}
              className="shrink-0 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold text-[var(--muted)]"
              onClick={() => onJumpBookmark(bookmark)}
              type="button"
            >
              {bookmark}%
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-2xl border border-[var(--line)] bg-white p-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <input
              className="h-10 rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 text-sm text-[var(--ink)] outline-none placeholder:text-stone-400"
              placeholder="Reader note for selected text or this location..."
              value={noteDraft}
              onChange={(event) => onNoteDraftChange(event.target.value)}
            />
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--green)] px-4 py-2 text-sm font-semibold text-white"
              onClick={() => onSaveAnnotation("note")}
              type="button"
            >
              <NotebookPen size={16} />
              Save Note
            </button>
          </div>
          {speechActive && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
                <span>Listening progress</span>
                <span>{formatPercent(speechState.progress)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-[var(--warm)]">
                <div className="h-2 rounded-full bg-[var(--gold)]" style={{ width: formatPercent(speechState.progress) }} />
              </div>
              {speechState.sleepTimerMinutes && speechState.sleepTimerEndsAt && (
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  Sleep timer: {speechState.sleepTimerMinutes} minutes, stops around {new Date(speechState.sleepTimerEndsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </p>
              )}
            </div>
          )}
          {annotations.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {annotations.slice(0, 8).map((annotation) => (
                <button
                  key={annotation.id}
                  className="min-w-[210px] rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-left"
                  onClick={() => onJumpBookmark(annotation.location)}
                  type="button"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--green)]">
                    {annotationLabel(annotation.type)} · {annotation.location}%
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--muted)]">
                    {annotation.note || annotation.text}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <article
        ref={readerRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-32 md:px-10 md:py-8"
        onScroll={onScroll}
      >
        {loading ? (
          <EmptyState title="Loading resource" body="Preparing the reader." />
        ) : (
          <div className={`mx-auto whitespace-pre-wrap font-serif ${readerWidthClass}`} style={{ fontSize, lineHeight: activeProgress.lineSpacing }}>
            {text}
          </div>
        )}
      </article>
    </div>
  );
}

function LibraryShelf({ title, children, horizontal = false }: { title: string; children: React.ReactNode; horizontal?: boolean }) {
  return (
    <section>
      <h2 className="px-1 text-lg font-semibold text-[var(--ink)]">{title}</h2>
      <div
        className={
          horizontal
            ? "mt-3 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 xl:grid-cols-4"
            : "mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4"
        }
      >
        {children}
      </div>
    </section>
  );
}

function LibraryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
      <p className="text-2xl font-semibold text-[var(--green)]">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
    </div>
  );
}

function LibraryResourceCard({
  resource,
  progress,
  listeningProgress,
  completed,
  onOpen,
}: {
  resource: LibraryResource;
  progress?: LibraryProgress;
  listeningProgress?: ListeningProgress;
  completed: boolean;
  onOpen: () => void;
}) {
  const progressValue = completed ? 100 : progress?.progress ?? 0;
  const listeningValue = listeningProgress?.progress ?? 0;
  const coverSeed = resource.category.length + resource.title.length;
  const coverClass = coverSeed % 3 === 0 ? "from-[#334d41] to-[#9a7b3f]" : coverSeed % 3 === 1 ? "from-[#4f3d2d] to-[#476455]" : "from-[#263f5f] to-[#8a6d3b]";

  return (
    <button className="w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" onClick={onOpen} type="button">
      <div className={`relative min-h-[148px] bg-gradient-to-br ${coverClass} p-4 text-white`}>
        <div className="absolute inset-x-5 top-4 h-px bg-white/30" />
        <p className="max-w-[10rem] text-xs font-semibold uppercase tracking-[0.14em] text-white/75">{libraryCategoryLabel(resource.category)}</p>
        <h3 className="mt-5 line-clamp-3 text-xl font-semibold leading-6">{resource.title}</h3>
        <p className="mt-3 line-clamp-1 text-sm font-semibold text-white/80">{resource.author}</p>
        {completed && (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[var(--green)]">
            Finished
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="rounded-full bg-[var(--warm)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">{libraryCategoryLabel(resource.category)}</p>
          <p className="rounded-full bg-[var(--paper)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">{libraryReadingMinutes(resource)}</p>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--scripture-ink)]">{resource.description}</p>
        <ResourceBadgeRow labels={resource.resource_labels.slice(0, 3)} warnings={resource.resource_warnings.slice(0, 2)} compact />
        <div className="mt-4 space-y-2">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
              <span>Reading</span>
              <span>{formatPercent(progressValue)}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-[var(--warm)]">
              <div className="h-2 rounded-full bg-[var(--green)]" style={{ width: formatPercent(progressValue) }} />
            </div>
          </div>
          {listeningValue > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
                <span>Listening</span>
                <span>{formatPercent(listeningValue)}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-[var(--warm)]">
                <div className="h-2 rounded-full bg-[var(--gold)]" style={{ width: formatPercent(listeningValue) }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function ResourceBadgeRow({
  labels,
  warnings,
  compact = false,
}: {
  labels: string[];
  warnings: string[];
  compact?: boolean;
}) {
  const visibleLabels = labels.filter(Boolean);
  const visibleWarnings = warnings.filter(Boolean);
  if (!visibleLabels.length && !visibleWarnings.length) return null;

  return (
    <div className={`${compact ? "mt-3" : "mt-4"} flex flex-wrap gap-2`}>
      {visibleLabels.map((label) => (
        <span
          key={`resource-label-${label}`}
          className="rounded-full bg-[var(--paper)] px-3 py-1 text-xs font-semibold text-[var(--green)]"
        >
          {label}
        </span>
      ))}
      {visibleWarnings.map((warning) => (
        <span
          key={`resource-warning-${warning}`}
          className="rounded-full bg-[var(--highlight)] px-3 py-1 text-xs font-semibold text-[var(--ink)]"
        >
          {warning}
        </span>
      ))}
    </div>
  );
}

function libraryCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    "Preaching/teaching": "Preaching & Teaching",
    "Fiction/classics": "Classics",
    "Christian life": "Christian Living",
    "Baptist history": "Baptist History",
    "Bible study helps": "Bible Handbooks",
  };

  return labels[category] ?? category;
}

function FullStudyScreen({
  verse,
  keyWords,
  crossReferences,
  commentaryEntries,
  connections,
  versesByRef,
  existingNote,
  highlighted,
  bookmarked,
  memoryItem,
  noteDraft,
  syncMessage,
  onBack,
  onNoteDraftChange,
  onSaveNote,
  onHighlight,
  onBookmark,
  onOpenReference,
  onAddMemory,
  onUpdateMemoryProgress,
  onRemoveMemory,
}: {
  verse: BibleVerse;
  keyWords: string[];
  crossReferences: CrossReference[];
  commentaryEntries: CommentaryEntry[];
  connections: ActiveChapterConnections;
  versesByRef: Map<string, BibleVerse>;
  existingNote: UserNote | null;
  highlighted: boolean;
  bookmarked: boolean;
  noteDraft: string;
  syncMessage: string;
  memoryItem: ScriptureMemoryItem | null;
  onBack: () => void;
  onNoteDraftChange: (value: string) => void;
  onSaveNote: () => void;
  onHighlight: () => void;
  onBookmark: () => void;
  onOpenReference: (targetRef: string) => void;
  onAddMemory: () => void;
  onUpdateMemoryProgress: (progress: number) => void;
  onRemoveMemory: () => void;
}) {
  const definitions = keyWords
    .map((word) => findDictionaryEntry(word))
    .filter((entry) => entry.found);
  const firstDefinition = definitions[0] ?? null;
  const sections = [
    { id: "full-study-verse", label: "Verse" },
    { id: "full-study-key-words", label: "Key Words" },
    { id: "full-study-cross-references", label: "Cross References" },
    { id: "full-study-atlas-timeline", label: "Atlas & Timeline" },
    { id: "full-study-my-study", label: "My Study" },
    { id: "full-study-commentary", label: "Commentary" },
    { id: "full-study-memory", label: "Memory" },
  ];

  return (
    <div className="space-y-4 p-4 pb-36 md:p-8 md:pb-10">
      <div className="sticky top-[104px] z-10 -mx-4 border-b border-[var(--line)] bg-[var(--paper)]/95 px-4 pb-3 pt-2 backdrop-blur md:top-0 md:mx-0 md:rounded-2xl md:border md:px-4">
        <div className="flex items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--green)] shadow-sm"
            onClick={onBack}
            type="button"
          >
            <ChevronLeft size={17} />
            Back to Bible
          </button>
          <p className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
            Mini Passage Guide
          </p>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Full study sections">
          {sections.map((section) => (
            <a
              key={section.id}
              className="shrink-0 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--muted)]"
              href={`#${section.id}`}
            >
              {section.label}
            </a>
          ))}
        </nav>
      </div>

      <StudySection id="full-study-verse" title="Verse">
        <p className="text-sm font-semibold text-[var(--green)]">{verse.ref}</p>
        <p className="mt-2 font-serif text-xl leading-9 text-[var(--scripture-ink)] md:text-2xl md:leading-10">{verse.text}</p>
      </StudySection>

      <StudySection id="full-study-key-words" title="Key Words">
        <div className="flex flex-wrap gap-2">
          {keyWords.map((word) => (
            <span
              key={`full-keyword-${word}`}
              className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-sm font-semibold text-[var(--ink)]"
            >
              {word}
            </span>
          ))}
        </div>

        {definitions.length ? (
          <div className="mt-4 space-y-3">
            {definitions.map((entry) => (
              <article key={`definition-${entry.lookupWord}`} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-base font-semibold capitalize text-[var(--ink)]">{entry.word}</h4>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--green)]">Webster&apos;s 1828</span>
                </div>
                {entry.lookupWord !== entry.word && (
                  <p className="mt-1 text-xs font-semibold text-[var(--muted)]">Normalized to: {entry.lookupWord}</p>
                )}
                <p className="mt-2 text-sm leading-6 text-[var(--scripture-ink)]">{entry.definition}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">No Webster&apos;s definitions are loaded for these words yet.</p>
        )}
        {firstDefinition && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <MiniStat label="Lookup" value={firstDefinition.lookupWord} />
            <MiniStat label="Source" value="1828" />
            <MiniStat label="Ready" value={firstDefinition.found ? "Yes" : "Soon"} />
          </div>
        )}
      </StudySection>

      <StudySection id="full-study-cross-references" title="Cross References">
        {crossReferences.length ? (
          <div className="space-y-2">
            {crossReferences.map((reference) => {
              const preview = versesByRef.get(reference.target_ref)?.text;
              return (
                <button
                  key={`full-cross-reference-${reference.id}`}
                  className="w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 text-left"
                  onClick={() => onOpenReference(reference.target_ref)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--green)]">{reference.target_ref}</p>
                    <p className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">{reference.source}</p>
                  </div>
                  <p className="mt-2 line-clamp-3 font-serif text-sm leading-6 text-[var(--scripture-ink)]">
                    {preview ?? reference.label}
                  </p>
                  {reference.source_title && (
                    <p className="mt-2 text-xs font-semibold text-[var(--muted)]">{reference.source_title}</p>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm leading-6 text-[var(--muted)]">No cross references are loaded for this verse yet.</p>
        )}
      </StudySection>

      <StudySection id="full-study-atlas-timeline" title="Atlas & Timeline">
        <div className="grid gap-3 lg:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 text-[var(--green)]">
              <MapPin size={17} />
              <h4 className="text-sm font-semibold">Places</h4>
            </div>
            <div className="mt-3 space-y-2">
              {connections.places.length ? connections.places.map((place) => (
                <PlaceContextCard key={`full-study-place-${place.id}`} place={place} onOpenReference={onOpenReference} />
              )) : (
                <p className="text-sm leading-6 text-[var(--muted)]">No reviewed atlas entries are attached to this chapter yet.</p>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-[var(--green)]">
              <Timer size={17} />
              <h4 className="text-sm font-semibold">Timeline</h4>
            </div>
            <div className="mt-3 space-y-2">
              {connections.timeline.length ? connections.timeline.map((entry) => (
                <TimelineContextCard key={`full-study-timeline-${entry.id}`} entry={entry} onOpenReference={onOpenReference} />
              )) : (
                <p className="text-sm leading-6 text-[var(--muted)]">No reviewed timeline entries are attached to this chapter yet.</p>
              )}
            </div>
          </div>
        </div>
      </StudySection>

      <StudySection id="full-study-my-study" title="My Study">
        <div className="grid grid-cols-2 gap-2">
          <CompactActionButton active={highlighted} icon={<Highlighter size={17} />} label={highlighted ? "Highlighted" : "Highlight"} onClick={onHighlight} />
          <CompactActionButton active={bookmarked} icon={<Bookmark size={17} />} label={bookmarked ? "Bookmarked" : "Bookmark"} onClick={onBookmark} />
        </div>
        <label className="mt-4 block text-sm font-semibold text-[var(--muted)]">
          Personal note
          <textarea
            className="mt-2 min-h-32 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 text-base leading-6 outline-none"
            placeholder="Write a note for this verse..."
            value={noteDraft}
            onChange={(event) => onNoteDraftChange(event.target.value)}
          />
        </label>
        <button className="mt-3 rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white" onClick={onSaveNote} type="button">
          {existingNote ? "Update note" : "Save note"}
        </button>
        {syncMessage && <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{syncMessage}</p>}
      </StudySection>

      <StudySection id="full-study-commentary" title="Commentary">
        {commentaryEntries.length ? (
          <div className="space-y-3">
            {commentaryEntries.map((entry) => (
              <CommentaryDetails key={`full-commentary-${entry.id}`} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-[var(--muted)]">Commentary resources will appear here after verified public-domain content is imported.</p>
        )}
      </StudySection>

      <StudySection id="full-study-memory" title="Memory">
        <MemoryReviewCard
          item={memoryItem}
          fallbackVerse={verse}
          onAddMemoryVerse={() => onAddMemory()}
          onRemoveMemoryVerse={() => onRemoveMemory()}
          onUpdateMemoryProgress={(_ref, progress) => onUpdateMemoryProgress(progress)}
        />
      </StudySection>
    </div>
  );
}

function SettingsScreen({
  hasSupabaseConfig,
  hasSupabaseUrl,
  hasSupabaseAnonKey,
  user,
  authEmail,
  authMessage,
  noteCount,
  highlightCount,
  bookmarkCount,
  exportMessage,
  onAuthEmailChange,
  onSendMagicLink,
  onSignOut,
  onExportStudyData,
}: {
  hasSupabaseConfig: boolean;
  hasSupabaseUrl: boolean;
  hasSupabaseAnonKey: boolean;
  user: User | null;
  authEmail: string;
  authMessage: string;
  noteCount: number;
  highlightCount: number;
  bookmarkCount: number;
  exportMessage: string;
  onAuthEmailChange: (value: string) => void;
  onSendMagicLink: () => void;
  onSignOut: () => void;
  onExportStudyData: () => void;
}) {
  return (
    <div className="space-y-4 p-4 pb-36 md:p-8 md:pb-10">
      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Supabase Auth is wired for email magic links. Add environment variables and run the schema to use real account sync.
        </p>

        <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--warm)] p-4">
          <p className="text-sm font-semibold text-[var(--ink)]">Account status</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {user ? `Signed in as ${user.email}` : hasSupabaseConfig ? "Supabase configured. Sign in with email." : "Prototype local mode. Supabase not configured yet."}
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <StatusCard
            label="Supabase URL"
            status={hasSupabaseUrl ? "Configured" : "Missing"}
            good={hasSupabaseUrl}
          />
          <StatusCard
            label="Anon key"
            status={hasSupabaseAnonKey ? "Configured" : "Missing"}
            good={hasSupabaseAnonKey}
          />
          <StatusCard
            label="Auth connection"
            status={user ? "Signed in" : hasSupabaseConfig ? "Ready to test" : "Unavailable"}
            good={Boolean(user || hasSupabaseConfig)}
          />
        </div>

        {user ? (
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--warm)] p-4">
              <p className="text-sm font-semibold text-[var(--green)]">Signed in — syncing to Supabase</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Notes, highlights, and bookmarks are saved to your account.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-white" onClick={onSignOut} type="button">
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--warm)] p-4">
              <p className="text-sm font-semibold text-[var(--green)]">Signed out — saving locally</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Study data stays in this browser until you sign in.</p>
            </div>
            <input
              className="h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 text-base outline-none"
              placeholder="you@example.com"
              type="email"
              value={authEmail}
              onChange={(event) => onAuthEmailChange(event.target.value)}
            />
            <button className="rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white" onClick={onSendMagicLink} type="button">
              Send sign-in link
            </button>
            {authMessage && <p className="text-sm text-[var(--muted)]">{authMessage}</p>}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Export My Notes</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Download notes, highlights, and bookmarks as JSON before beta testing changes.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white"
            onClick={onExportStudyData}
            type="button"
          >
            <Download size={16} />
            Export JSON
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatusCard label="Notes" status={String(noteCount)} good />
          <StatusCard label="Highlights" status={String(highlightCount)} good />
          <StatusCard label="Bookmarks" status={String(bookmarkCount)} good />
        </div>
        {exportMessage && <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{exportMessage}</p>}
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Prepared for future resources</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--muted)]">
          <li>Strong&apos;s numbers: data model can attach resources to verses and words.</li>
          <li>Treasury of Scripture Knowledge: source metadata table is included.</li>
          <li>Commentaries: public-domain rights records are required before import.</li>
        </ul>
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Private beta feedback</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Open the beta feedback page after testing the Bible reader and Study tab.</p>
          </div>
          <a
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-sm font-semibold text-[var(--green)]"
            href="/feedback"
          >
            <MessageSquareText size={16} />
            Give Feedback
          </a>
        </div>
      </section>
    </div>
  );
}

function StatusCard({
  label,
  status,
  good,
}: {
  label: string;
  status: string;
  good: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${good ? "text-[var(--green)]" : "text-[var(--ink)]"}`}>
        {status}
      </p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 p-8 text-center">
      <p className="text-lg font-semibold text-[var(--ink)]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p>
    </div>
  );
}

function CommentaryDetails({ entry, compact = false }: { entry: CommentaryEntry; compact?: boolean }) {
  const reference =
    entry.reference ??
    `${entry.book} ${entry.chapter}:${entry.verse_start}${entry.verse_end !== entry.verse_start ? `-${entry.verse_end}` : ""}`;

  return (
    <details className="group rounded-2xl border border-[var(--line)] bg-white p-4">
      <summary className="cursor-pointer list-none">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--green)]">{entry.resource_title}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{entry.author}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--paper)] px-3 py-1 text-xs font-semibold text-[var(--muted)] group-open:hidden">
            Open
          </span>
          <span className="hidden shrink-0 rounded-full bg-[var(--paper)] px-3 py-1 text-xs font-semibold text-[var(--muted)] group-open:inline">
            Close
          </span>
        </div>
        <p className="mt-2 text-xs font-semibold text-[var(--muted)]">{reference}</p>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--ink)]">{entry.entry_text}</p>
      </summary>

      <div className="mt-3 border-t border-[var(--line)] pt-3">
        <p className={`${compact ? "text-sm" : "text-base"} leading-7 text-[var(--ink)]`}>{entry.entry_text}</p>
        {entry.recommended_use && (
          <p className="mt-3 rounded-xl bg-[var(--paper)] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
            Recommended use: {entry.recommended_use}
          </p>
        )}
        <dl className="mt-3 space-y-2 text-xs leading-5 text-[var(--muted)]">
          <div>
            <dt className="font-semibold text-[var(--ink)]">Source</dt>
            <dd>{entry.source_title ?? entry.resource_title}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--ink)]">Rights status</dt>
            <dd>{entry.public_domain_status || "Public-domain status pending review."}</dd>
          </div>
          {entry.source_url && (
            <div>
              <dt className="font-semibold text-[var(--ink)]">Source URL</dt>
              <dd className="break-words">{entry.source_url}</dd>
            </div>
          )}
        </dl>
      </div>
    </details>
  );
}

function StudySection({
  id,
  title,
  children,
  action,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-48 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm md:scroll-mt-24">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--green)]">{title}</h3>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function StudyDrawer({
  verse,
  activeTab,
  dictionaryEntry,
  crossReferences,
  commentaryEntries,
  bookIntroduction,
  versesByRef,
  allVerses,
  existingNote,
  highlighted,
  bookmarked,
  memoryItem,
  noteDraft,
  audioPlaying,
  speechRate,
  syncMessage,
  storageMode,
  onActiveTabChange,
  onNoteDraftChange,
  onClose,
  onHighlight,
  onBookmark,
  onCopy,
  onShare,
  onSaveNote,
  onDeleteNote,
  onLookupWord,
  onOpenReference,
  onOpenBookIntroduction,
  onAddMemory,
  onUpdateMemoryProgress,
  onRemoveMemory,
  onOpenFullStudy,
  onToggleAudio,
  onSpeechRateChange,
}: {
  verse: BibleVerse;
  activeTab: StudyDrawerTab;
  dictionaryEntry: DictionaryEntry | null;
  crossReferences: CrossReference[];
  commentaryEntries: CommentaryEntry[];
  bookIntroduction: BookIntroduction | null;
  versesByRef: Map<string, BibleVerse>;
  allVerses: BibleVerse[];
  existingNote: UserNote | null;
  highlighted: boolean;
  bookmarked: boolean;
  memoryItem: ScriptureMemoryItem | null;
  noteDraft: string;
  audioPlaying: boolean;
  speechRate: number;
  syncMessage: string;
  storageMode: string;
  onActiveTabChange: (tab: StudyDrawerTab) => void;
  onNoteDraftChange: (value: string) => void;
  onClose: () => void;
  onHighlight: () => void;
  onBookmark: () => void;
  onCopy: () => void;
  onShare: () => void;
  onSaveNote: () => void;
  onDeleteNote: () => void;
  onLookupWord: (word: string) => void;
  onOpenReference: (targetRef: string) => void;
  onOpenBookIntroduction: () => void;
  onAddMemory: () => void;
  onUpdateMemoryProgress: (progress: number) => void;
  onRemoveMemory: () => void;
  onOpenFullStudy: () => void;
  onToggleAudio: () => void;
  onSpeechRateChange: (rate: number) => void;
}) {
  const [drawerSize, setDrawerSize] = useState<StudyDrawerSize>("half");
  const dragStartYRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const tabs: { id: StudyDrawerTab; label: string }[] = [
    { id: "study", label: "Study" },
    { id: "actions", label: "Actions" },
    { id: "dictionary", label: "Dictionary" },
    { id: "occurrences", label: "Occurrences" },
    { id: "crossReferences", label: "Cross References" },
    { id: "notes", label: "Notes" },
    { id: "audio", label: "Audio" },
    { id: "commentary", label: "Commentary" },
    { id: "memory", label: "Memory" },
  ];
  const commentarySources = useMemo(
    () => Array.from(new Set(commentaryEntries.map((entry) => entry.resource_title))).sort(),
    [commentaryEntries],
  );
  const [commentarySourceFilter, setCommentarySourceFilter] = useState("all");
  const activeCommentarySourceFilter =
    commentarySourceFilter === "all" || commentarySources.includes(commentarySourceFilter)
      ? commentarySourceFilter
      : "all";
  const filteredCommentaryEntries = useMemo(
    () =>
      activeCommentarySourceFilter === "all"
        ? commentaryEntries
        : commentaryEntries.filter((entry) => entry.resource_title === activeCommentarySourceFilter),
    [activeCommentarySourceFilter, commentaryEntries],
  );
  const keyWords = useMemo(() => keyWordsForVerse(verse), [verse]);
  const topCrossReferences = crossReferences.slice(0, 3);
  const drawerWordExplorer = useMemo(
    () => buildWordExplorer(dictionaryEntry?.lookupWord || keyWords[0] || "", verse.book, verse.chapter, allVerses),
    [allVerses, dictionaryEntry?.lookupWord, keyWords, verse.book, verse.chapter],
  );
  const sizeOrder: StudyDrawerSize[] = ["collapsed", "half", "full"];
  const sizeButtons: { id: StudyDrawerSize; label: string }[] = [
    { id: "collapsed", label: "Low" },
    { id: "half", label: "Half" },
    { id: "full", label: "Full" },
  ];
  const drawerHeight =
    drawerSize === "collapsed"
      ? "h-[154px]"
      : drawerSize === "full"
        ? "h-[calc(100dvh-88px)]"
        : "h-[54dvh]";

  useEffect(() => {
    if (activeTab === "study") {
      tabsRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [activeTab, verse.ref]);

  function resizeDrawer(direction: number) {
    setDrawerSize((current) => {
      const currentIndex = sizeOrder.indexOf(current);
      return sizeOrder[Math.max(0, Math.min(sizeOrder.length - 1, currentIndex + direction))];
    });
  }

  function handleDragEnd(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragStartYRef.current === null) return;
    const delta = event.clientY - dragStartYRef.current;
    dragStartYRef.current = null;
    didDragRef.current = Math.abs(delta) > 24;
    if (delta < -24) resizeDrawer(1);
    if (delta > 24) resizeDrawer(-1);
  }

  return (
    <aside className={`fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-40 mx-auto w-full max-w-6xl overflow-hidden border-t border-[var(--line)] bg-[var(--paper)] shadow-2xl shadow-stone-950/20 transition-[height] duration-200 md:bottom-6 md:right-6 md:left-auto md:h-auto md:max-h-[calc(100vh-3rem)] md:w-[430px] md:rounded-3xl md:border ${drawerHeight}`}>
      <div className="flex h-full flex-col md:max-h-[calc(100vh-3rem)]">
        <div className="border-b border-[var(--line)] px-4 pb-4 pt-2">
          <div className="flex justify-center pb-2">
            <button
              aria-label="Adjust Study Drawer height"
              className="flex h-7 w-20 items-center justify-center rounded-full"
              onClick={() => {
                if (didDragRef.current) {
                  didDragRef.current = false;
                  return;
                }
                resizeDrawer(drawerSize === "full" ? -2 : 1);
              }}
              onPointerDown={(event) => {
                dragStartYRef.current = event.clientY;
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerUp={handleDragEnd}
              type="button"
            >
              <span className="h-1.5 w-14 rounded-full bg-stone-400" />
            </button>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[var(--green)]">{verse.ref}</p>
                <span className="rounded-full bg-[var(--warm)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                  {storageMode}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 font-serif text-lg leading-7 text-[var(--scripture-ink)]">
                {verse.text}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <div className="flex rounded-full border border-[var(--line)] bg-white p-0.5">
                {sizeButtons.map((size) => (
                  <button
                    key={size.id}
                    aria-label={`Set Study Drawer to ${size.label}`}
                    className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                      drawerSize === size.id ? "bg-[var(--green)] text-white" : "text-[var(--muted)]"
                    }`}
                    onClick={() => setDrawerSize(size.id)}
                    type="button"
                  >
                    {size.label}
                  </button>
                ))}
              </div>
              <button className="rounded-full border border-[var(--line)] bg-white p-2" onClick={onClose} type="button">
                <X size={18} />
              </button>
            </div>
          </div>

          {drawerSize !== "collapsed" && (
            <div
              ref={tabsRef}
              className="-mx-4 mt-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 pr-10 scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`shrink-0 snap-start rounded-full px-4 py-2.5 text-sm font-semibold shadow-sm ${
                    activeTab === tab.id
                      ? "bg-[var(--green)] text-white ring-2 ring-[var(--gold-soft)]"
                      : "border border-[var(--line)] bg-white text-[var(--muted)]"
                  }`}
                  onClick={(event) => {
                    onActiveTabChange(tab.id);
                    if (tab.id !== "study") {
                      event.currentTarget.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
                    }
                  }}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
              <span aria-hidden="true" className="w-6 shrink-0" />
            </div>
          )}
        </div>

        {drawerSize !== "collapsed" && <div className="overflow-y-auto px-4 pb-28 pt-4 md:pb-4">
          {activeTab === "study" && (
            <div className="space-y-3">
              <StudySection
                title="Verse"
                action={
                  <div className="flex flex-wrap justify-end gap-2">
                    {bookIntroduction && (
                      <button
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]"
                        onClick={onOpenBookIntroduction}
                        type="button"
                      >
                        <BookOpen size={14} />
                        Book Intro
                      </button>
                    )}
                    <button
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
                      onClick={onOpenFullStudy}
                      type="button"
                    >
                      <BookOpen size={14} />
                      Full Study
                    </button>
                  </div>
                }
              >
                <p className="text-sm font-semibold text-[var(--green)]">{verse.ref}</p>
                <p className="mt-2 font-serif text-lg leading-8 text-[var(--scripture-ink)]">{verse.text}</p>
              </StudySection>

              <StudySection title="Key Words">
                <div className="flex flex-wrap gap-2">
                  {keyWords.map((word) => (
                    <button
                      key={word}
                      className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-sm font-semibold text-[var(--ink)]"
                      onClick={() => onLookupWord(word)}
                      type="button"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </StudySection>

              <StudySection title="Cross References">
                {topCrossReferences.length ? (
                  <div className="space-y-2">
                    {topCrossReferences.map((reference) => {
                      const preview = versesByRef.get(reference.target_ref)?.text;
                      return (
                        <button
                          key={`study-${reference.id}`}
                          className="w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 text-left"
                          onClick={() => onOpenReference(reference.target_ref)}
                          type="button"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-[var(--green)]">{reference.target_ref}</p>
                            <p className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">{reference.source}</p>
                          </div>
                          <p className="mt-2 line-clamp-2 font-serif text-sm leading-6 text-[var(--scripture-ink)]">
                            {preview ?? reference.label}
                          </p>
                          {reference.source_title && (
                            <p className="mt-2 text-xs font-semibold text-[var(--muted)]">{reference.source_title}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-[var(--muted)]">No quick cross references are loaded for this verse yet.</p>
                )}
              </StudySection>

              <StudySection title="My Study">
                <div className="grid grid-cols-2 gap-2">
                  <CompactActionButton icon={<NotebookPen size={17} />} label={existingNote ? "Edit note" : "Add note"} onClick={() => onActiveTabChange("notes")} />
                  <CompactActionButton active={highlighted} icon={<Highlighter size={17} />} label={highlighted ? "Unhighlight" : "Highlight"} onClick={onHighlight} />
                  <CompactActionButton active={bookmarked} icon={<Bookmark size={17} />} label={bookmarked ? "Saved" : "Bookmark"} onClick={onBookmark} />
                  <CompactActionButton active={Boolean(memoryItem)} icon={<Brain size={17} />} label={memoryItem ? "Memory" : "Memorize"} onClick={() => {
                    if (!memoryItem) onAddMemory();
                    onActiveTabChange("memory");
                  }} />
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Memory review is local-first for beta testing.</p>
              </StudySection>

              <StudySection title="Commentary">
                {commentaryEntries.length > 0 ? (
                  <div className="space-y-2">
                    {commentaryEntries.map((entry) => (
                      <button
                        key={`study-commentary-${entry.id}`}
                        className="w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 text-left"
                        onClick={() => onActiveTabChange("commentary")}
                        type="button"
                      >
                        <p className="text-sm font-semibold text-[var(--green)]">{entry.resource_title}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{entry.author}</p>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--ink)]">{entry.entry_text}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-[var(--muted)]">Verified commentary resources will appear here without covering the Bible reader.</p>
                )}
              </StudySection>
            </div>
          )}

          {activeTab === "actions" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <ActionButton active={highlighted} icon={<Highlighter size={18} />} label={highlighted ? "Unhighlight" : "Highlight"} onClick={onHighlight} />
                <ActionButton active={bookmarked} icon={<Bookmark size={18} />} label={bookmarked ? "Saved" : "Bookmark"} onClick={onBookmark} />
                <ActionButton icon={<Clipboard size={18} />} label="Copy" onClick={onCopy} />
                <ActionButton icon={<Share2 size={18} />} label="Share" onClick={onShare} />
                <ActionButton icon={<NotebookPen size={18} />} label="Note" onClick={() => onActiveTabChange("notes")} />
                <ActionButton icon={<Volume2 size={18} />} label="Audio" onClick={() => onActiveTabChange("audio")} />
                <ActionButton icon={<Search size={18} />} label="Occurrences" onClick={() => onActiveTabChange("occurrences")} />
              </div>

              <WordLookupStrip verse={verse} onLookupWord={onLookupWord} />

              {syncMessage && (
                <p className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                  {syncMessage}
                </p>
              )}
            </div>
          )}

          {activeTab === "dictionary" && (
            <div className="space-y-4">
              <WordLookupStrip verse={verse} onLookupWord={onLookupWord} />

              {dictionaryEntry ? (
                <section className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--green)]">Webster&apos;s 1828</p>
                  <h3 className="mt-2 text-3xl font-semibold capitalize text-[var(--ink)]">{dictionaryEntry.word}</h3>
                  {dictionaryEntry.lookupWord && dictionaryEntry.lookupWord !== dictionaryEntry.word && (
                    <p className="mt-1 text-sm text-[var(--muted)]">Normalized to: {dictionaryEntry.lookupWord}</p>
                  )}
                  <p className="mt-4 text-base leading-7 text-[var(--scripture-ink)]">{dictionaryEntry.definition}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <MiniStat label="Chapter" value={String(drawerWordExplorer.chapterOccurrences.length)} />
                    <MiniStat label="Book" value={String(drawerWordExplorer.bookOccurrences.length)} />
                    <MiniStat label="Bible" value={String(drawerWordExplorer.bibleOccurrences.length)} />
                  </div>
                  <button
                    className="mt-3 w-full rounded-full bg-[var(--green)] px-4 py-2.5 text-sm font-semibold text-white"
                    onClick={() => onActiveTabChange("occurrences")}
                    type="button"
                  >
                    Open Occurrence Explorer
                  </button>
                  {drawerWordExplorer.chapterOccurrences.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {drawerWordExplorer.chapterOccurrences.slice(0, 3).map((occurrence) => (
                        <button
                          key={`drawer-word-${occurrence.ref}`}
                          className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-left"
                          onClick={() => onOpenReference(occurrence.ref)}
                          type="button"
                        >
                          <p className="text-xs font-semibold text-[var(--green)]">{occurrence.ref}</p>
                          <p className="mt-1 line-clamp-2 font-serif text-sm leading-6 text-[var(--scripture-ink)]">{occurrence.text}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              ) : (
                <EmptyState title="Tap a word" body="Tap any word in the verse above or the Bible text to look up a Webster's 1828 definition." />
              )}
            </div>
          )}

          {activeTab === "occurrences" && (
            <OccurrenceExplorerPanel
              explorer={drawerWordExplorer}
              onLookupWord={onLookupWord}
              onOpenReference={onOpenReference}
            />
          )}

          {activeTab === "crossReferences" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
                <div className="flex items-center gap-2 text-[var(--green)]">
                  <Link size={17} />
                  <h3 className="text-sm font-semibold">Cross references</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  TSK structure is in place. John 3:16 has sample references now; the full import can come later.
                </p>
              </div>

              {crossReferences.length ? (
                crossReferences.map((reference) => {
                  const preview = versesByRef.get(reference.target_ref)?.text;
                  return (
                    <button
                      key={reference.id}
                      className="w-full rounded-2xl border border-[var(--line)] bg-white p-4 text-left transition hover:border-[var(--gold)]"
                      onClick={() => onOpenReference(reference.target_ref)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--green)]">{reference.target_ref}</p>
                        <p className="rounded-full bg-[var(--warm)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">{reference.source}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[var(--ink)]">{reference.label}</p>
                      <p className="mt-3 line-clamp-3 font-serif text-base leading-7 text-[var(--scripture-ink)]">
                        {preview ?? "Verse preview not available yet."}
                      </p>
                      {(reference.source_title || reference.public_domain_status) && (
                        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                          {[reference.source_title, reference.public_domain_status].filter(Boolean).join(" - ")}
                        </p>
                      )}
                    </button>
                  );
                })
              ) : (
                <EmptyState title="No cross references yet" body="This verse is ready for a future TSK import." />
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
                <p className="text-sm font-semibold text-[var(--green)]">
                  {existingNote ? "Saved note" : "New note"}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {existingNote
                    ? `Last saved for ${verse.ref}. Edit the text below or delete it.`
                    : `No saved note for ${verse.ref} yet.`}
                </p>
              </div>
              <label className="block text-sm font-semibold text-[var(--muted)]">
                Note for {verse.ref}
                <textarea
                  className="mt-2 min-h-32 w-full rounded-2xl border border-[var(--line)] bg-white p-3 text-base leading-6 outline-none"
                  placeholder="Write a note for this verse..."
                  value={noteDraft}
                  onChange={(event) => onNoteDraftChange(event.target.value)}
                />
              </label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <button className="rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white" onClick={onSaveNote} type="button">
                  {existingNote ? "Update note" : "Save note"}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[var(--muted)] disabled:opacity-40"
                  disabled={!existingNote}
                  onClick={onDeleteNote}
                  type="button"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
              {syncMessage && <p className="text-sm leading-6 text-[var(--muted)]">{syncMessage}</p>}
            </div>
          )}

          {activeTab === "audio" && (
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
              <div className="flex items-center gap-3 text-[var(--green)]">
                <Headphones size={22} />
                <h3 className="text-lg font-semibold">Listen</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Uses this device&apos;s built-in speech. No AI narration, paid API, or licensed audio is connected.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white"
                  onClick={onToggleAudio}
                  type="button"
                >
                  {audioPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {audioPlaying ? "Pause" : "Play"}
                </button>
                <label className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm font-semibold text-[var(--muted)]">
                  Speed
                  <select
                    className="bg-transparent text-[var(--ink)] outline-none"
                    value={speechRate}
                    onChange={(event) => onSpeechRateChange(Number(event.target.value))}
                  >
                    <option value={0.8}>0.8x</option>
                    <option value={1}>1x</option>
                    <option value={1.2}>1.2x</option>
                    <option value={1.5}>1.5x</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {activeTab === "commentary" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
                <h3 className="text-sm font-semibold text-[var(--green)]">Commentary</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Verified entries appear here after Scripture, Webster, TSK, and curated connections. Commentary stays secondary to the Bible text.
                </p>
                <label className="mt-4 block text-sm font-semibold text-[var(--muted)]">
                  Resource
                  <select
                    className="mt-2 h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm font-semibold text-[var(--ink)] outline-none"
                    value={activeCommentarySourceFilter}
                    onChange={(event) => setCommentarySourceFilter(event.target.value)}
                  >
                    <option value="all">All commentary resources</option>
                    {commentarySources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {filteredCommentaryEntries.length ? (
                filteredCommentaryEntries.map((entry) => (
                  <CommentaryDetails key={entry.id} entry={entry} compact />
                ))
              ) : (
                <EmptyState title="No commentary entry yet" body="This verse is ready for a future public-domain commentary import." />
              )}
            </div>
          )}

          {activeTab === "memory" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
                <div className="flex items-center gap-2 text-[var(--green)]">
                  <Brain size={18} />
                  <h3 className="text-sm font-semibold">Scripture Memory</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Repeat the verse, hide words, use first-letter prompts, and save local progress.
                </p>
              </div>
              <MemoryReviewCard
                item={memoryItem}
                fallbackVerse={verse}
                onAddMemoryVerse={() => onAddMemory()}
                onRemoveMemoryVerse={() => onRemoveMemory()}
                onUpdateMemoryProgress={(_ref, progress) => onUpdateMemoryProgress(progress)}
              />
              {memoryItem && (
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((progress) => (
                    <button
                      key={`memory-progress-${progress}`}
                      className={`rounded-full px-3 py-2 text-xs font-semibold ${
                        memoryItem.progress >= progress
                          ? "bg-[var(--green)] text-white"
                          : "border border-[var(--line)] bg-white text-[var(--muted)]"
                      }`}
                      onClick={() => onUpdateMemoryProgress(progress)}
                      type="button"
                    >
                      {progress}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>}
      </div>
    </aside>
  );
}

function WordLookupStrip({
  verse,
  onLookupWord,
}: {
  verse: BibleVerse;
  onLookupWord: (word: string) => void;
}) {
  const words = verse.text
    .split(/\s+/)
    .map((word) => word.replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ""))
    .filter(Boolean);

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
      <p className="text-sm font-semibold text-[var(--muted)]">Dictionary lookup</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {words.slice(0, 28).map((word, index) => (
          <button
            key={`${word}-${index}`}
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-sm font-semibold text-[var(--ink)]"
            onClick={() => onLookupWord(word)}
            type="button"
          >
            {word}
          </button>
        ))}
      </div>
    </section>
  );
}

function OccurrenceExplorerPanel({
  explorer,
  onLookupWord,
  onOpenReference,
}: {
  explorer: WordExplorerResult;
  onLookupWord: (word: string) => void;
  onOpenReference: (targetRef: string) => void;
}) {
  const firstOccurrence = explorer.bibleOccurrences[0] ?? null;
  const visibleMatches = explorer.bibleOccurrences.slice(0, 36);

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--green)]">Occurrence Explorer</p>
            <h3 className="mt-2 text-3xl font-semibold capitalize text-[var(--ink)]">{explorer.word || "word"}</h3>
          </div>
          <button
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-xs font-semibold text-[var(--green)]"
            onClick={() => onLookupWord(explorer.word)}
            type="button"
          >
            Webster&apos;s 1828
          </button>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {explorer.lookupWord && explorer.lookupWord !== explorer.word
            ? `Normalized to: ${explorer.lookupWord}`
            : `Lookup root: ${explorer.lookupWord || explorer.word}`}
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--scripture-ink)]">{explorer.definition.definition}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <MiniStat label="Chapter" value={String(explorer.chapterOccurrences.length)} />
          <MiniStat label="Book" value={String(explorer.bookOccurrences.length)} />
          <MiniStat label="Bible" value={String(explorer.bibleOccurrences.length)} />
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
        <p className="text-sm font-semibold text-[var(--green)]">First occurrence</p>
        {firstOccurrence ? (
          <button
            className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 text-left"
            onClick={() => onOpenReference(firstOccurrence.ref)}
            type="button"
          >
            <p className="text-sm font-semibold text-[var(--green)]">{firstOccurrence.ref}</p>
            <p className="mt-2 line-clamp-3 font-serif text-sm leading-6 text-[var(--scripture-ink)]">{firstOccurrence.text}</p>
          </button>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">No matching verse found in the local KJV text.</p>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--green)]">Matching references</p>
          <span className="rounded-full bg-[var(--warm)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]">
            {visibleMatches.length} shown
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {visibleMatches.map((verse) => (
            <button
              key={`occurrence-${explorer.lookupWord}-${verse.ref}`}
              className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-left text-xs font-semibold text-[var(--green)]"
              onClick={() => onOpenReference(verse.ref)}
              type="button"
            >
              {verse.ref}
            </button>
          ))}
        </div>
        {explorer.bibleOccurrences.length > visibleMatches.length && (
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
            Showing the first {visibleMatches.length} references to keep mobile study quick.
          </p>
        )}
      </section>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border text-xs font-semibold ${
        active
          ? "border-[var(--gold)] bg-[var(--highlight)] text-[var(--ink)]"
          : "border-[var(--line)] bg-white text-[var(--muted)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function CompactActionButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold ${
        active
          ? "border-[var(--gold)] bg-[var(--highlight)] text-[var(--ink)]"
          : "border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span className="leading-4">{label}</span>
    </button>
  );
}

function MobileNav({ tab, onTab }: { tab: Tab; onTab: (tab: Tab) => void }) {
  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "today", label: "Today", icon: <HomeIcon size={20} /> },
    { id: "bible", label: "Bible", icon: <BookOpen size={20} /> },
    { id: "search", label: "Search", icon: <Search size={20} /> },
    { id: "library", label: "Library", icon: <Library size={20} /> },
    { id: "notes", label: "Notes", icon: <NotebookPen size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-[var(--paper)]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-6 gap-1">
        {items.map((item) => (
          <button
            key={item.id}
            className={`flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[0.7rem] font-semibold ${
              tab === item.id ? "bg-[var(--green)] text-white" : "text-[var(--muted)]"
            }`}
            onClick={() => onTab(item.id)}
            type="button"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
