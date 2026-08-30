"use client";

import { BookOpen, Library, MessageSquareText, Music2, Plus, Quote, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import hymnData from "../../data/hymns/presentation-hymns.json";
import preachingHelpData from "../../data/preaching-helps/verified-preaching-helps.json";

export type PresentationContentSlideSeed = {
  type: "Title" | "Scripture" | "Quote";
  title: string;
  subtitle: string;
  body?: string;
  bibleText?: string;
  speakerNotes: string;
  imageHint: string;
};

type Hymn = (typeof hymnData)[number];
type PreachingHelp = (typeof preachingHelpData)[number];
type FinderMode = "hymns" | "quotes" | "books" | "commentary" | "scripture";

export type PresentationBookResource = {
  slug: string;
  title: string;
  author: string;
  year: number;
  category: string;
  description: string;
  public_domain_status: string;
  rights_status: string;
  doctrinal_review_status: string;
  perspective_notes: string;
  recommended_use: string;
  resource_warnings: string[];
  source_url: string;
  source_license_url: string;
  rights_basis: string;
};

export type PresentationCommentaryResource = {
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

const MAX_VISIBLE_RESULTS = 40;

function includesQuery(parts: Array<string | number | null | undefined>, query: string) {
  if (!query) return true;
  return parts.join(" ").toLowerCase().includes(query);
}

export default function PresentationContentFinder({
  books,
  commentary,
  onAddSlides,
  onAddScripture,
  loadCommentaryCatalog,
  loadCommentaryChapter,
}: {
  books: PresentationBookResource[];
  commentary: PresentationCommentaryResource[];
  onAddSlides: (slides: PresentationContentSlideSeed[]) => void;
  onAddScripture: (passage: string) => void;
  loadCommentaryCatalog: (signal: AbortSignal) => Promise<{ books: { book: string; chapters: number[] }[] }>;
  loadCommentaryChapter: (signal: AbortSignal, book: string, chapter: number) => Promise<PresentationCommentaryResource[]>;
}) {
  const [mode, setMode] = useState<FinderMode>("hymns");
  const [query, setQuery] = useState("");
  const [passage, setPassage] = useState("");
  const [chapterBooks, setChapterBooks] = useState<{ book: string; chapters: number[] }[]>([]);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [lookupBook, setLookupBook] = useState("John");
  const [lookupChapter, setLookupChapter] = useState(3);
  const [chapterResult, setChapterResult] = useState<{ reference: string; entries: PresentationCommentaryResource[]; status: "loading" | "ready" | "error" } | null>(null);
  const chapterRequest = useRef<AbortController | null>(null);
  const chapters = chapterBooks.find((item) => item.book === lookupBook)?.chapters ?? [];
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    if (mode !== "commentary" || chapterBooks.length) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;
    void loadCommentaryCatalog(controller.signal).then((catalog) => {
      if (!active) return;
      if (!catalog.books.length) throw new Error("Empty commentary catalog");
      setChapterBooks(catalog.books);
      setCatalogError(false);
    }).catch(() => {
      if (active) setCatalogError(true);
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [mode, chapterBooks.length, catalogAttempt, loadCommentaryCatalog]);

  useEffect(() => () => { chapterRequest.current?.abort(); chapterRequest.current = null; }, []);

  async function findChapterCommentary() {
    if (!chapters.includes(lookupChapter)) return;
    chapterRequest.current?.abort();
    const controller = new AbortController();
    chapterRequest.current = controller;
    const reference = `${lookupBook} ${lookupChapter}`;
    setQuery("");
    setChapterResult({ reference, entries: [], status: "loading" });
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const entries = await loadCommentaryChapter(controller.signal, lookupBook, lookupChapter);
      if (chapterRequest.current !== controller) return;
      setChapterResult({ reference, entries, status: "ready" });
    } catch {
      if (chapterRequest.current === controller) setChapterResult({ reference, entries: [], status: "error" });
    } finally {
      clearTimeout(timeout);
    }
  }

  function returnToLoadedNotes() {
    chapterRequest.current?.abort();
    chapterRequest.current = null;
    setChapterResult(null);
    setQuery("");
  }

  const hymns = useMemo(() => hymnData.filter((hymn) => includesQuery([
    hymn.title,
    hymn.lyricist,
    hymn.tune,
    hymn.scriptureReferences.join(" "),
    hymn.stanzas.join(" "),
  ], normalizedQuery)), [normalizedQuery]);

  const quotes = useMemo(() => (preachingHelpData as PreachingHelp[])
    .filter((item) => item.type === "Quote")
    .filter((item) => includesQuery([
      item.title,
      item.author,
      item.text,
      item.sourceTitle,
      item.bibleReferences.join(" "),
      item.topics.join(" "),
    ], normalizedQuery)), [normalizedQuery]);

  const matchingBooks = useMemo(() => books
    .filter((book) => !/rejected|do not import/i.test(`${book.doctrinal_review_status} ${book.rights_status}`))
    .filter((book) => includesQuery([
      book.title,
      book.author,
      book.year,
      book.category,
      book.description,
      book.recommended_use,
      book.perspective_notes,
    ], normalizedQuery)), [books, normalizedQuery]);

  const matchingCommentary = useMemo(() => (chapterResult?.entries ?? commentary)
    .filter((entry) => Boolean(entry.entry_text.trim()) && /public domain/i.test(entry.public_domain_status))
    .filter((entry) => includesQuery([
      entry.reference,
      entry.book,
      entry.chapter,
      entry.author,
      entry.resource_title,
      entry.source_title,
      entry.entry_text,
      entry.recommended_use,
    ], normalizedQuery)), [commentary, chapterResult, normalizedQuery]);

  function addHymn(hymn: Hymn) {
    const rightsNote = `${hymn.textRights} Music: ${hymn.musicRights}. Sources: ${hymn.textSourceUrl} · ${hymn.musicSourceUrl}`;
    onAddSlides([
      {
        type: "Title",
        title: hymn.title,
        subtitle: `${hymn.lyricist} · Tune: ${hymn.tune}`,
        body: hymn.scriptureReferences.join(" · "),
        speakerNotes: rightsNote,
        imageHint: `hymn worship music ${hymn.scriptureReferences.join(" ")}`,
      },
      ...hymn.stanzas.map((stanza, index) => ({
        type: "Quote" as const,
        title: `${hymn.title} · Stanza ${index + 1}`,
        subtitle: hymn.lyricist,
        body: hymn.refrain ? `${stanza}\n\nRefrain:\n${hymn.refrain}` : stanza,
        speakerNotes: rightsNote,
        imageHint: `hymn worship music ${hymn.scriptureReferences.join(" ")}`,
      })),
    ]);
  }

  function addQuote(item: PreachingHelp) {
    onAddSlides([{
      type: "Quote",
      title: item.title,
      subtitle: `${item.author} · ${item.sourceTitle}`,
      body: item.slideText,
      speakerNotes: `${item.sourceLocator}. ${item.rightsStatus}. ${item.rightsBasis} Source: ${item.sourceUrl}\n\nReview: ${item.reviewNote}`,
      imageHint: `${item.title} ${item.topics.join(" ")} ${item.bibleReferences.join(" ")}`,
    }]);
  }

  function addBook(book: PresentationBookResource) {
    const body = book.recommended_use || book.description;
    const sourceNotes = [
      "Catalog summary—not a quotation from the book.",
      `Rights: ${book.public_domain_status}; ${book.rights_status}. ${book.rights_basis}`,
      `Review: ${book.doctrinal_review_status}. ${book.perspective_notes}`,
      book.resource_warnings.length ? `Warnings: ${book.resource_warnings.join(" · ")}` : "",
      `Source: ${book.source_url}`,
      book.source_license_url ? `Rights source: ${book.source_license_url}` : "",
    ].filter(Boolean).join("\n");
    onAddSlides([{
      type: "Title",
      title: book.title,
      subtitle: `${book.author} · ${book.year || "Year unknown"} · ${book.category}`,
      body,
      speakerNotes: sourceNotes,
      imageHint: `${book.title} ${book.category} Christian book study`,
    }]);
  }

  function addCommentary(entry: PresentationCommentaryResource) {
    const reference = entry.reference || `${entry.book} ${entry.chapter}:${entry.verse_start}${entry.verse_end > entry.verse_start ? `-${entry.verse_end}` : ""}`;
    const excerpt = excerptForSlide(entry.entry_text);
    onAddSlides([{
      type: "Quote",
      title: reference,
      subtitle: `${entry.author} · ${entry.resource_title}`,
      body: excerpt,
      speakerNotes: [
        `Commentary excerpt from ${entry.source_title || entry.resource_title} by ${entry.author}.`,
        `${entry.public_domain_status}. ${entry.rights_basis || "Verify the linked source record before redistribution."}`,
        entry.recommended_use ? `Recommended use: ${entry.recommended_use}` : "",
        excerpt.length < entry.entry_text.trim().length ? "Excerpt shortened for slide readability; consult the source for full context." : "",
        "Commentary is secondary material; compare every statement with the KJV text.",
        `Source: ${entry.source_url}`,
      ].filter(Boolean).join("\n"),
      imageHint: `${reference} Bible commentary ${entry.book}`,
    }]);
  }

  const resultCount = mode === "hymns"
    ? hymns.length
    : mode === "quotes"
      ? quotes.length
      : mode === "books"
        ? matchingBooks.length
        : matchingCommentary.length;

  return (
    <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Reviewed Content Finder</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Search reviewed hymns, quotations, books, and commentary—or add an exact KJV passage without leaving the deck.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]">{hymnData.length} hymns · {(preachingHelpData as PreachingHelp[]).filter((item) => item.type === "Quote").length} quotes · {books.length} books · {commentary.length} notes</span>
      </div>

      <div className="mt-3 grid grid-cols-2 rounded-xl border border-[var(--line)] bg-white p-1 sm:grid-cols-5">
        {([
          ["hymns", "Hymns", Music2],
          ["quotes", "Quotes", Quote],
          ["books", "Books", Library],
          ["commentary", "Commentary", MessageSquareText],
          ["scripture", "KJV Verse", BookOpen],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold ${mode === id ? "bg-[var(--green)] text-white" : "text-[var(--green)]"}`} onClick={() => { setMode(id); setQuery(""); }} type="button">
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {mode === "commentary" && (
        <section aria-label="Commentary chapter lookup" className="mt-3 rounded-xl border border-[var(--line)] bg-white p-3">
          <p className="text-sm font-semibold text-[var(--ink)]">Find commentary for a chapter</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Load one chapter from the full index, then search its notes and add an attributed excerpt to your deck.</p>
          {!chapterBooks.length ? (
            catalogError ? <div role="alert" className="mt-2 text-sm"><p>The chapter index could not be loaded.</p><button type="button" className="min-h-11 font-semibold text-[var(--green)]" onClick={() => { setCatalogError(false); setCatalogAttempt((attempt) => attempt + 1); }}>Retry chapter index</button></div>
              : <p role="status" className="mt-2 text-xs">Loading chapter index…</p>
          ) : (
            <form className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_6rem]" onSubmit={(event) => { event.preventDefault(); void findChapterCommentary(); }}>
              <label className="text-xs font-semibold text-[var(--muted)]">Commentary book
                <select className="mt-1 h-11 w-full rounded-lg border border-[var(--line)] bg-white px-2 text-sm text-[var(--ink)]" value={lookupBook} onChange={(event) => { setLookupBook(event.target.value); setLookupChapter(chapterBooks.find((item) => item.book === event.target.value)?.chapters[0] ?? 1); }}>
                  {chapterBooks.map((item) => <option key={item.book} value={item.book}>{item.book}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-[var(--muted)]">Chapter
                <select className="mt-1 h-11 w-full rounded-lg border border-[var(--line)] bg-white px-2 text-sm text-[var(--ink)]" value={lookupChapter} onChange={(event) => setLookupChapter(Number(event.target.value))}>
                  {chapters.map((chapter) => <option key={chapter} value={chapter}>{chapter}</option>)}
                </select>
              </label>
              <button type="submit" disabled={!chapters.includes(lookupChapter)} className="min-h-11 rounded-lg bg-[var(--green)] px-3 text-xs font-semibold text-white disabled:opacity-50 sm:col-span-2">Load chapter notes</button>
            </form>
          )}
          <div role="status" aria-live="polite" className="mt-2 text-xs leading-5 text-[var(--muted)]">
            {chapterResult?.status === "loading" ? `Loading ${chapterResult.reference} commentary…` : chapterResult?.status === "error" ? `Could not load ${chapterResult.reference}. Check your connection and use Load chapter notes to retry.` : chapterResult ? `Searching ${chapterResult.reference} only. Source attribution is retained on added slides.` : "Searching notes already loaded in this session—not the full commentary collection."}
          </div>
          {chapterResult && <button type="button" className="min-h-11 text-xs font-semibold text-[var(--green)]" onClick={returnToLoadedNotes}>Back to loaded notes</button>}
        </section>
      )}

      {mode === "scripture" ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Passage
            <input className="mt-1 h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3 text-sm normal-case tracking-normal text-[var(--ink)] outline-none" onChange={(event) => setPassage(event.target.value)} placeholder="John 3:16 or Psalm 23:1-4" value={passage} />
          </label>
          <button className="self-end rounded-xl bg-[var(--green)] px-4 py-3 text-xs font-semibold text-white disabled:opacity-50" disabled={!passage.trim()} onClick={() => onAddScripture(passage.trim())} type="button">
            Add KJV Slide
          </button>
          <p className="text-xs leading-5 text-[var(--muted)] sm:col-span-2">The app uses its verified KJV corpus and automatically chooses a fitting book or subject background. Always confirm the displayed range before presenting.</p>
        </div>
      ) : (
        <>
          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute left-3 top-3 text-[var(--muted)]" size={17} />
            <input aria-label={`Search ${mode}`} className="h-11 w-full rounded-xl border border-[var(--line)] bg-white pl-10 pr-3 text-sm text-[var(--ink)] outline-none" onChange={(event) => setQuery(event.target.value)} placeholder={mode === "hymns" ? "Search title, author, tune, lyric, or Scripture" : mode === "books" ? "Search title, author, category, use, or perspective" : mode === "commentary" ? "Search reference, book, author, source, or words" : "Search words, author, topic, source, or Scripture"} value={query} />
          </label>
          {!(mode === "commentary" && chapterResult && chapterResult.status !== "ready") && <p className="mt-2 text-xs text-[var(--muted)]">{resultCount} reviewed result{resultCount === 1 ? "" : "s"}{resultCount > MAX_VISIBLE_RESULTS ? ` · showing first ${MAX_VISIBLE_RESULTS}` : ""}</p>}
          <div className="mt-3 max-h-96 space-y-2 overflow-y-auto pr-1">
            {mode === "hymns" && hymns.map((hymn) => (
              <article key={hymn.id} className="rounded-xl border border-[var(--line)] bg-white p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[var(--green)]">{hymn.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{hymn.lyricist} · {hymn.tune} · {hymn.scriptureReferences.join(" · ")}</p>
                  </div>
                  <span className="rounded-full bg-[var(--warm)] px-2 py-1 text-[0.68rem] font-semibold text-[var(--muted)]">Music available</span>
                </div>
                <button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--green)] px-3 text-xs font-semibold text-white" onClick={() => addHymn(hymn)} type="button"><Plus size={15} /> Add hymn slides</button>
              </article>
            ))}
            {mode === "quotes" && quotes.map((item) => (
              <article key={item.id} className="rounded-xl border border-[var(--line)] bg-white p-3">
                <p className="text-sm font-semibold text-[var(--green)]">{item.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{item.author} · {item.sourceTitle} · {item.bibleReferences.join(" · ")}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--scripture-ink)]">“{item.slideText}”</p>
                <button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--green)] px-3 text-xs font-semibold text-white" onClick={() => addQuote(item)} type="button"><Plus size={15} /> Add quote slide</button>
              </article>
            ))}
            {mode === "books" && matchingBooks.slice(0, MAX_VISIBLE_RESULTS).map((book) => (
              <article key={book.slug} className="rounded-xl border border-[var(--line)] bg-white p-3">
                <p className="text-sm font-semibold text-[var(--green)]">{book.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{book.author} · {book.year || "Year unknown"} · {book.category}</p>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--scripture-ink)]">{book.recommended_use || book.description}</p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{book.public_domain_status} · {book.doctrinal_review_status}</p>
                <button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--green)] px-3 text-xs font-semibold text-white" onClick={() => addBook(book)} type="button"><Plus size={15} /> Add book source slide</button>
              </article>
            ))}
            {mode === "commentary" && matchingCommentary.slice(0, MAX_VISIBLE_RESULTS).map((entry) => {
              const reference = entry.reference || `${entry.book} ${entry.chapter}:${entry.verse_start}${entry.verse_end > entry.verse_start ? `-${entry.verse_end}` : ""}`;
              return (
                <article key={entry.id} className="rounded-xl border border-[var(--line)] bg-white p-3">
                  <p className="text-sm font-semibold text-[var(--green)]">{reference}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{entry.author} · {entry.resource_title}</p>
                  <p className="mt-2 line-clamp-4 text-sm leading-6 text-[var(--scripture-ink)]">{excerptForSlide(entry.entry_text)}</p>
                  <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{entry.public_domain_status} · Compare with the KJV text</p>
                  <button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--green)] px-3 text-xs font-semibold text-white" onClick={() => addCommentary(entry)} type="button"><Plus size={15} /> Add commentary slide</button>
                </article>
              );
            })}
            {!resultCount && !(mode === "commentary" && chapterResult && chapterResult.status !== "ready") && <p className="rounded-xl border border-dashed border-[var(--line)] bg-white p-4 text-sm text-[var(--muted)]">{mode === "commentary" && chapterResult ? `No reviewed notes match in ${chapterResult.reference}. Try another search or chapter.` : "No reviewed content matches that search yet."}</p>}
          </div>
        </>
      )}
    </div>
  );
}

function excerptForSlide(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= 420) return text;
  const candidate = text.slice(0, 421);
  const sentenceEnd = Math.max(candidate.lastIndexOf(". "), candidate.lastIndexOf("! "), candidate.lastIndexOf("? "));
  const wordEnd = candidate.lastIndexOf(" ");
  const end = sentenceEnd >= 220 ? sentenceEnd + 1 : wordEnd >= 220 ? wordEnd : 420;
  return `${candidate.slice(0, end).trim()}…`;
}
