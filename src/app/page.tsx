"use client";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import {
  Bookmark,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Download,
  Pause,
  Play,
  Trash2,
  Headphones,
  Highlighter,
  Home as HomeIcon,
  Library,
  Link,
  LogOut,
  MessageSquareText,
  NotebookPen,
  Search,
  Settings,
  Share2,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import verses1769 from "es-kjv/json/verses-1769.js";

type Tab = "today" | "bible" | "search" | "notes" | "settings" | "fullStudy";
type StudyDrawerTab = "study" | "actions" | "dictionary" | "crossReferences" | "notes" | "audio" | "commentary";
type StudyDrawerSize = "collapsed" | "half" | "full";
type TestamentFilter = "all" | "old" | "new";

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

type CrossReference = {
  id: string;
  verse_ref: string;
  target_ref: string;
  label: string;
  source: string;
};

type CommentaryEntry = {
  id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  author: string;
  resource_title: string;
  entry_text: string;
  public_domain_status: string;
  source_url: string;
};

const STORAGE_KEY = "fathers-business-bible-study-state";
const LOCAL_SYNC_MESSAGE = "Saving locally until sync is available.";
const SYNC_ERROR_MESSAGE = "Could not sync yet. Your data is still saved on this device.";
const DEFAULT_BOOK = "John";
const DEFAULT_CHAPTER = 3;
const DEFAULT_VERSE = 16;

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
  loveth: "loved",
  lovedst: "loved",
  worlds: "world",
};

const localCrossReferences: CrossReference[] = [
  {
    id: "john-3-14-numbers-21-8",
    verse_ref: "John 3:14",
    target_ref: "Numbers 21:8",
    label: "The serpent lifted up in the wilderness.",
    source: "TSK",
  },
  {
    id: "john-3-14-numbers-21-9",
    verse_ref: "John 3:14",
    target_ref: "Numbers 21:9",
    label: "Looking to the lifted serpent and living.",
    source: "TSK",
  },
  {
    id: "john-3-14-john-8-28",
    verse_ref: "John 3:14",
    target_ref: "John 8:28",
    label: "The Son of man lifted up.",
    source: "TSK",
  },
  {
    id: "john-3-15-john-3-16",
    verse_ref: "John 3:15",
    target_ref: "John 3:16",
    label: "Believing in Him and everlasting life.",
    source: "TSK",
  },
  {
    id: "john-3-15-john-6-40",
    verse_ref: "John 3:15",
    target_ref: "John 6:40",
    label: "Believing on the Son and having everlasting life.",
    source: "TSK",
  },
  {
    id: "john-3-16-genesis-22-2",
    verse_ref: "John 3:16",
    target_ref: "Genesis 22:2",
    label: "Only son language and sacrifice pattern.",
    source: "TSK",
  },
  {
    id: "john-3-16-romans-5-8",
    verse_ref: "John 3:16",
    target_ref: "Romans 5:8",
    label: "God's love commended toward sinners.",
    source: "TSK",
  },
  {
    id: "john-3-16-1john-4-9",
    verse_ref: "John 3:16",
    target_ref: "1 John 4:9",
    label: "The love of God manifested by sending His only begotten Son.",
    source: "TSK",
  },
  {
    id: "john-3-16-john-3-36",
    verse_ref: "John 3:16",
    target_ref: "John 3:36",
    label: "Believing on the Son and everlasting life.",
    source: "TSK",
  },
  {
    id: "john-3-16-romans-8-32",
    verse_ref: "John 3:16",
    target_ref: "Romans 8:32",
    label: "God spared not His own Son.",
    source: "TSK",
  },
  {
    id: "john-3-17-luke-9-56",
    verse_ref: "John 3:17",
    target_ref: "Luke 9:56",
    label: "The Son of man came not to destroy, but to save.",
    source: "TSK",
  },
  {
    id: "john-3-17-john-12-47",
    verse_ref: "John 3:17",
    target_ref: "John 12:47",
    label: "Christ came not to judge the world, but to save.",
    source: "TSK",
  },
  {
    id: "john-3-17-1john-4-14",
    verse_ref: "John 3:17",
    target_ref: "1 John 4:14",
    label: "The Father sent the Son to be the Saviour of the world.",
    source: "TSK",
  },
  {
    id: "john-3-18-john-5-24",
    verse_ref: "John 3:18",
    target_ref: "John 5:24",
    label: "The believer is passed from death unto life.",
    source: "TSK",
  },
  {
    id: "john-3-18-romans-8-1",
    verse_ref: "John 3:18",
    target_ref: "Romans 8:1",
    label: "No condemnation to them which are in Christ Jesus.",
    source: "TSK",
  },
  {
    id: "john-3-18-mark-16-16",
    verse_ref: "John 3:18",
    target_ref: "Mark 16:16",
    label: "Belief and unbelief set in sharp contrast.",
    source: "TSK",
  },
];

const localCommentaryEntries: CommentaryEntry[] = [
  {
    id: "sample-ironside-john-3-16",
    book: "John",
    chapter: 3,
    verse_start: 16,
    verse_end: 16,
    author: "H. A. Ironside",
    resource_title: "John Commentary Placeholder",
    entry_text:
      "Placeholder only. This row reserves the commentary structure for a future verified public-domain import.",
    public_domain_status: "Placeholder; verify source before importing full text.",
    source_url: "",
  },
];

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

function makeSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
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
  const [studyTab, setStudyTab] = useState<StudyDrawerTab>("study");
  const [noteDraft, setNoteDraft] = useState("");
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [saved, setSaved] = useState<SavedState>({ notes: [], highlights: [], bookmarks: [] });
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [crossReferences, setCrossReferences] = useState<CrossReference[]>(localCrossReferences);
  const [commentaryEntries, setCommentaryEntries] = useState<CommentaryEntry[]>(localCommentaryEntries);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState<TestamentFilter>("all");
  const [flashRef, setFlashRef] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
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
      .select("id, verse_ref, target_ref, label, source")
      .then(({ data, error }) => {
        if (error || !data?.length) {
          setCrossReferences(localCrossReferences);
          return;
        }
        setCrossReferences(data);
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
        setCommentaryEntries(data);
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

  function goToVerse(targetBook: string, targetChapter: number, targetVerse = 1) {
    setBook(targetBook);
    setChapter(targetChapter);
    setVerseJump(targetVerse);
    setSelectedRef(`${targetBook} ${targetChapter}:${targetVerse}`);
    setTab("bible");
  }

  function openSearchResult(verse: BibleVerse) {
    goToVerse(verse.book, verse.chapter, verse.verse);
    setFlashRef(verse.ref);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashRef(null), 2200);
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

  function jumpToVerse() {
    const safeVerse = Math.max(1, Math.min(verseJump, chapterVerses.length || 1));
    setSelectedRef(`${book} ${chapter}:${safeVerse}`);
    setFlashRef(`${book} ${chapter}:${safeVerse}`);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlashRef(null), 1800);
  }

  function goChapter(direction: -1 | 1) {
    const next = chapterRefs[currentIndex + direction];
    if (!next) return;
    goToVerse(next.bookName, next.chapterNumber, 1);
  }

  function selectBook(nextBook: string) {
    const firstChapter = allVerses.find((verse) => verse.book === nextBook)?.chapter ?? 1;
    setBook(nextBook);
    setChapter(firstChapter);
    setVerseJump(1);
    setSelectedRef(`${nextBook} ${firstChapter}:1`);
  }

  function selectChapter(nextChapter: number) {
    setChapter(nextChapter);
    setVerseJump(1);
    setSelectedRef(`${book} ${nextChapter}:1`);
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
              type="button"
              title="Audio placeholder"
            >
              <Headphones size={17} />
              Listen
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
                selectedRef={selectedRef}
                noteCount={saved.notes.length}
                highlightCount={saved.highlights.length}
                bookmarkCount={saved.bookmarks.length}
                onContinue={() => setTab("bible")}
                onJohn316={() => goToVerse("John", 3, 16)}
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
                onBookChange={selectBook}
                onChapterChange={selectChapter}
                onVerseJumpChange={setVerseJump}
                onJump={jumpToVerse}
                onPrevious={() => goChapter(-1)}
                onNext={() => goChapter(1)}
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
                onSearchTermChange={setSearchTerm}
                onSearchFilterChange={setSearchFilter}
                onOpenVerse={openSearchResult}
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

            {tab === "fullStudy" && fullStudyVerse && (
              <FullStudyScreen
                verse={fullStudyVerse}
                keyWords={keyWordsForVerse(fullStudyVerse)}
                crossReferences={fullStudyCrossReferences}
                commentaryEntries={fullStudyCommentaryEntries}
                versesByRef={versesByRef}
                existingNote={notesByRef.get(fullStudyVerse.ref)?.[0] ?? null}
                highlighted={highlightsByRef.has(fullStudyVerse.ref)}
                bookmarked={bookmarksByRef.has(fullStudyVerse.ref)}
                noteDraft={noteDraft}
                syncMessage={syncMessage}
                onBack={() => setTab("bible")}
                onNoteDraftChange={setNoteDraft}
                onSaveNote={() => saveNote(fullStudyVerse.ref)}
                onHighlight={() => toggleHighlight(fullStudyVerse.ref)}
                onBookmark={() => toggleBookmark(fullStudyVerse.ref)}
                onOpenReference={openReference}
              />
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

      {studyRef && activeVerse && (
        <StudyDrawer
          verse={activeVerse}
          activeTab={studyTab}
          dictionaryEntry={activeDictionaryEntry}
          crossReferences={activeCrossReferences}
          commentaryEntries={activeCommentaryEntries}
          versesByRef={versesByRef}
          existingNote={notesByRef.get(studyRef)?.[0] ?? null}
          highlighted={highlightsByRef.has(studyRef)}
          bookmarked={bookmarksByRef.has(studyRef)}
          noteDraft={noteDraft}
          audioPlaying={audioPlaying}
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
          onOpenFullStudy={() => {
            setFullStudyRef(studyRef);
            setNoteDraft(notesByRef.get(studyRef)?.[0]?.body ?? "");
            setStudyRef(null);
            setTab("fullStudy");
          }}
          onToggleAudio={() => setAudioPlaying((value) => !value)}
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
  selectedRef,
  noteCount,
  highlightCount,
  bookmarkCount,
  onContinue,
  onJohn316,
}: {
  book: string;
  chapter: number;
  selectedRef: string;
  noteCount: number;
  highlightCount: number;
  bookmarkCount: number;
  onContinue: () => void;
  onJohn316: () => void;
}) {
  return (
    <div className="space-y-5 p-4 md:p-8">
      <section className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm md:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Today</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)] md:text-4xl">
          Continue in {book} {chapter}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Open the reader, jump to a verse, search the KJV, and keep your notes, highlights, and bookmarks together.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white" onClick={onContinue} type="button">
            Continue reading
          </button>
          <button className="rounded-full border border-[var(--line)] bg-[var(--warm)] px-5 py-3 text-sm font-semibold text-[var(--ink)]" onClick={onJohn316} type="button">
            Jump to John 3:16
          </button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Notes" value={noteCount} />
        <Stat label="Highlights" value={highlightCount} />
        <Stat label="Bookmarks" value={bookmarkCount} />
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-[var(--warm)] p-5">
        <p className="text-sm font-semibold text-[var(--muted)]">Last selected verse</p>
        <p className="mt-2 text-2xl font-semibold text-[var(--green)]">{selectedRef}</p>
      </section>
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
  onBookChange,
  onChapterChange,
  onVerseJumpChange,
  onJump,
  onPrevious,
  onNext,
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
  onBookChange: (book: string) => void;
  onChapterChange: (chapter: number) => void;
  onVerseJumpChange: (verse: number) => void;
  onJump: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onVerseClick: (ref: string) => void;
  onWordClick: (word: string, ref: string) => void;
}) {
  return (
    <div className="space-y-4 p-4 md:p-8">
      <section className="rounded-2xl border border-[var(--line)] bg-white p-3 shadow-sm md:rounded-3xl md:p-4">
        <div className="grid grid-cols-[1fr_92px] gap-2 md:grid-cols-[1fr_120px_120px_auto] md:gap-3">
          <label className="text-xs font-semibold text-[var(--muted)] md:text-sm">
            Book
            <select
              className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)] md:mt-2 md:h-11 md:text-base"
              value={book}
              onChange={(event) => onBookChange(event.target.value)}
            >
              {books.map((bookName) => (
                <option key={bookName} value={bookName}>
                  {bookName}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-[var(--muted)] md:text-sm">
            Chapter
            <select
              className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)] md:mt-2 md:h-11 md:text-base"
              value={chapter}
              onChange={(event) => onChapterChange(Number(event.target.value))}
            >
              {chapters.map((chapterNumber) => (
                <option key={chapterNumber} value={chapterNumber}>
                  {chapterNumber}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-[var(--muted)] md:text-sm">
            Verse
            <input
              className="mt-1 h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)] md:mt-2 md:h-11 md:text-base"
              min={1}
              max={verses.length}
              type="number"
              value={verseJump}
              onChange={(event) => onVerseJumpChange(Number(event.target.value))}
            />
          </label>

          <button className="mt-5 h-10 rounded-xl bg-[var(--green)] px-4 text-sm font-semibold text-white md:mt-auto md:h-11" onClick={onJump} type="button">
            Jump
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 md:flex md:items-center md:justify-between">
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--warm)] px-3 text-sm font-semibold disabled:opacity-40"
            disabled={!hasPrevious}
            onClick={onPrevious}
            type="button"
          >
            <ChevronLeft size={16} />
            Previous chapter
          </button>
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-[var(--warm)] px-3 text-sm font-semibold disabled:opacity-40"
            disabled={!hasNext}
            onClick={onNext}
            type="button"
          >
            Next
            <ChevronRight size={16} />
          </button>
          <p className="hidden text-sm font-semibold text-[var(--muted)] md:block">{book} {chapter}</p>
        </div>
      </section>

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

function SearchScreen({
  searchTerm,
  searchFilter,
  results,
  onSearchTermChange,
  onSearchFilterChange,
  onOpenVerse,
}: {
  searchTerm: string;
  searchFilter: TestamentFilter;
  results: BibleVerse[];
  onSearchTermChange: (value: string) => void;
  onSearchFilterChange: (value: TestamentFilter) => void;
  onOpenVerse: (verse: BibleVerse) => void;
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
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

function FullStudyScreen({
  verse,
  keyWords,
  crossReferences,
  commentaryEntries,
  versesByRef,
  existingNote,
  highlighted,
  bookmarked,
  noteDraft,
  syncMessage,
  onBack,
  onNoteDraftChange,
  onSaveNote,
  onHighlight,
  onBookmark,
  onOpenReference,
}: {
  verse: BibleVerse;
  keyWords: string[];
  crossReferences: CrossReference[];
  commentaryEntries: CommentaryEntry[];
  versesByRef: Map<string, BibleVerse>;
  existingNote: UserNote | null;
  highlighted: boolean;
  bookmarked: boolean;
  noteDraft: string;
  syncMessage: string;
  onBack: () => void;
  onNoteDraftChange: (value: string) => void;
  onSaveNote: () => void;
  onHighlight: () => void;
  onBookmark: () => void;
  onOpenReference: (targetRef: string) => void;
}) {
  const definitions = keyWords
    .map((word) => findDictionaryEntry(word))
    .filter((entry) => entry.found);
  const sections = [
    { id: "full-study-verse", label: "Verse" },
    { id: "full-study-key-words", label: "Key Words" },
    { id: "full-study-cross-references", label: "Cross References" },
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
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm leading-6 text-[var(--muted)]">No cross references are loaded for this verse yet.</p>
        )}
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
              <article key={`full-commentary-${entry.id}`} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3">
                <p className="text-sm font-semibold text-[var(--green)]">{entry.resource_title}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{entry.author}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--ink)]">{entry.entry_text}</p>
                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{entry.public_domain_status || "Public-domain status pending review."}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-[var(--muted)]">Commentary resources will appear here after verified public-domain content is imported.</p>
        )}
      </StudySection>

      <StudySection id="full-study-memory" title="Memory">
        <p className="text-sm leading-6 text-[var(--muted)]">Memorize is reserved for a future verse review workflow. The verse stays centered here for now.</p>
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
  versesByRef,
  existingNote,
  highlighted,
  bookmarked,
  noteDraft,
  audioPlaying,
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
  onOpenFullStudy,
  onToggleAudio,
}: {
  verse: BibleVerse;
  activeTab: StudyDrawerTab;
  dictionaryEntry: DictionaryEntry | null;
  crossReferences: CrossReference[];
  commentaryEntries: CommentaryEntry[];
  versesByRef: Map<string, BibleVerse>;
  existingNote: UserNote | null;
  highlighted: boolean;
  bookmarked: boolean;
  noteDraft: string;
  audioPlaying: boolean;
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
  onOpenFullStudy: () => void;
  onToggleAudio: () => void;
}) {
  const [drawerSize, setDrawerSize] = useState<StudyDrawerSize>("half");
  const dragStartYRef = useRef<number | null>(null);
  const didDragRef = useRef(false);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const tabs: { id: StudyDrawerTab; label: string }[] = [
    { id: "study", label: "Study" },
    { id: "actions", label: "Actions" },
    { id: "dictionary", label: "Dictionary" },
    { id: "crossReferences", label: "Cross References" },
    { id: "notes", label: "Notes" },
    { id: "audio", label: "Audio" },
    { id: "commentary", label: "Commentary" },
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
                  <button
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)]"
                    onClick={onOpenFullStudy}
                    type="button"
                  >
                    <BookOpen size={14} />
                    Open Full Study
                  </button>
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
                  <CompactActionButton icon={<BookOpen size={17} />} label="Memorize" onClick={() => onActiveTabChange("study")} />
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Memorize is a placeholder for a future review workflow.</p>
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
                </section>
              ) : (
                <EmptyState title="Tap a word" body="Tap any word in the verse above or the Bible text to look up a Webster's 1828 definition." />
              )}
            </div>
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
                <h3 className="text-lg font-semibold">Listen placeholder</h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                Audio is intentionally not connected yet. This control is prepared for future verse audio files, device text-to-speech, or licensed KJV audio.
              </p>
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white"
                onClick={onToggleAudio}
                type="button"
              >
                {audioPlaying ? <Pause size={16} /> : <Play size={16} />}
                {audioPlaying ? "Pause" : "Play"}
              </button>
              <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
                {audioPlaying ? "Playback UI active. No audio source is connected yet." : "Ready for a future audio source."}
              </p>
            </div>
          )}

          {activeTab === "commentary" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
                <h3 className="text-sm font-semibold text-[var(--green)]">Commentary placeholder</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  The table and drawer tab are ready for verified public-domain commentary imports. Full commentary content is intentionally not imported yet.
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
                  <article key={entry.id} className="rounded-2xl border border-[var(--line)] bg-white p-4">
                    <p className="text-sm font-semibold text-[var(--green)]">
                      {entry.author} — {entry.resource_title}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      {entry.book} {entry.chapter}:{entry.verse_start}
                      {entry.verse_end !== entry.verse_start ? `-${entry.verse_end}` : ""}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-[var(--ink)]">{entry.entry_text}</p>
                    <dl className="mt-3 space-y-2 text-xs leading-5 text-[var(--muted)]">
                      <div>
                        <dt className="font-semibold text-[var(--ink)]">Public-domain status</dt>
                        <dd>{entry.public_domain_status}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-[var(--ink)]">Source</dt>
                        <dd>{entry.source_url || "Source URL not added yet."}</dd>
                      </div>
                    </dl>
                  </article>
                ))
              ) : (
                <EmptyState title="No commentary entry yet" body="This verse is ready for a future public-domain commentary import." />
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
    { id: "notes", label: "Notes", icon: <Library size={20} /> },
    { id: "settings", label: "Settings", icon: <Settings size={20} /> },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-[var(--paper)]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
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
