"use client";

import { BookOpen, Music2, Plus, Quote, Search } from "lucide-react";
import { useMemo, useState } from "react";
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
type FinderMode = "hymns" | "quotes" | "scripture";

function includesQuery(parts: Array<string | number | null | undefined>, query: string) {
  if (!query) return true;
  return parts.join(" ").toLowerCase().includes(query);
}

export default function PresentationContentFinder({
  onAddSlides,
  onAddScripture,
}: {
  onAddSlides: (slides: PresentationContentSlideSeed[]) => void;
  onAddScripture: (passage: string) => void;
}) {
  const [mode, setMode] = useState<FinderMode>("hymns");
  const [query, setQuery] = useState("");
  const [passage, setPassage] = useState("");
  const normalizedQuery = query.trim().toLowerCase();

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

  const resultCount = mode === "hymns" ? hymns.length : quotes.length;

  return (
    <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Reviewed Content Finder</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Search rights-checked hymns and quotations, or add an exact KJV passage without leaving the deck.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]">{hymnData.length} hymns · {(preachingHelpData as PreachingHelp[]).filter((item) => item.type === "Quote").length} quotes</span>
      </div>

      <div className="mt-3 grid grid-cols-3 rounded-xl border border-[var(--line)] bg-white p-1">
        {([
          ["hymns", "Hymns", Music2],
          ["quotes", "Quotes", Quote],
          ["scripture", "KJV Verse", BookOpen],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold ${mode === id ? "bg-[var(--green)] text-white" : "text-[var(--green)]"}`} onClick={() => { setMode(id); setQuery(""); }} type="button">
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

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
            <input aria-label={`Search ${mode}`} className="h-11 w-full rounded-xl border border-[var(--line)] bg-white pl-10 pr-3 text-sm text-[var(--ink)] outline-none" onChange={(event) => setQuery(event.target.value)} placeholder={mode === "hymns" ? "Search title, author, tune, lyric, or Scripture" : "Search words, author, topic, source, or Scripture"} value={query} />
          </label>
          <p className="mt-2 text-xs text-[var(--muted)]">{resultCount} reviewed result{resultCount === 1 ? "" : "s"}</p>
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
            {!resultCount && <p className="rounded-xl border border-dashed border-[var(--line)] bg-white p-4 text-sm text-[var(--muted)]">No reviewed content matches that search yet.</p>}
          </div>
        </>
      )}
    </div>
  );
}
