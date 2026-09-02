"use client";

import { BookOpen, FileText, Lightbulb, Music2, Plus, Quote, Search } from "lucide-react";
import { useMemo, useState } from "react";
import verifiedPreachingHelpsData from "../../data/preaching-helps/verified-preaching-helps.json";
import presentationHymnsData from "../../data/hymns/presentation-hymns.json";

type FinderMode = "all" | "quotes" | "illustrations" | "hymns" | "books" | "commentary";
type SermonTarget = "quotes" | "illustrations" | "importedStudyNotes";

type PreachingHelp = {
  id: string;
  type: "Quote" | "Illustration" | "Poem";
  title: string;
  author: string;
  text: string;
  sourceTitle: string;
  sourceLocator: string;
  sourceUrl: string;
  rightsStatus: string;
  bibleReferences: string[];
  topics: string[];
  recommendedUse: string;
};

type Hymn = {
  id: string;
  title: string;
  lyricist: string;
  tune: string;
  scriptureReferences: string[];
  stanzas: string[];
  refrain: string | null;
  textSourceUrl: string;
  textRights: string;
  musicSourceUrl: string;
  musicRights: string;
};

type HymnSequenceSelection = {
  stanzaIndexes: number[];
  includeRefrain: boolean;
};

export type SermonResourceBook = {
  slug: string;
  title: string;
  author: string;
  category: string;
  collection: string;
  description: string;
  recommendedUse: string;
  rightsStatus: string;
  sourceUrl: string;
};

export type SermonResourceCommentary = {
  id: string;
  reference: string;
  author: string;
  resourceTitle: string;
  text: string;
  rightsStatus: string;
  sourceUrl: string;
};

export type SermonResourceAddition = {
  target: SermonTarget;
  heading: string;
  body: string;
};

export type SermonResourceSlideSeed = {
  resourceKind: Exclude<FinderMode, "all">;
  title: string;
  subtitle: string;
  body: string;
  speakerNotes: string;
};

type FinderResult = {
  id: string;
  mode: Exclude<FinderMode, "all">;
  title: string;
  byline: string;
  detail: string;
  preview: string;
  rights: string;
  sourceUrl: string;
  searchText: string;
  addition: SermonResourceAddition;
  slide: SermonResourceSlideSeed;
  hymn?: Hymn;
};

const preachingHelps = verifiedPreachingHelpsData as PreachingHelp[];
const hymns = presentationHymnsData as Hymn[];
const MAX_VISIBLE_RESULTS = 18;

function matchesQuery(searchText: string, query: string) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = searchText.toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function resultIcon(mode: FinderResult["mode"]) {
  if (mode === "quotes") return <Quote aria-hidden="true" size={17} />;
  if (mode === "illustrations") return <Lightbulb aria-hidden="true" size={17} />;
  if (mode === "hymns") return <Music2 aria-hidden="true" size={17} />;
  if (mode === "books") return <BookOpen aria-hidden="true" size={17} />;
  return <FileText aria-hidden="true" size={17} />;
}

function modeLabel(mode: FinderResult["mode"]) {
  if (mode === "quotes") return "Quote";
  if (mode === "illustrations") return "Illustration";
  if (mode === "hymns") return "Hymn";
  if (mode === "books") return "Book";
  return "Commentary";
}

export default function SermonResourceFinder({
  initialQuery,
  books,
  commentary,
  onAdd,
  onAddToPresentation,
}: {
  initialQuery: string;
  books: SermonResourceBook[];
  commentary: SermonResourceCommentary[];
  onAdd: (addition: SermonResourceAddition) => void;
  onAddToPresentation: (slides: SermonResourceSlideSeed[]) => void;
}) {
  const [mode, setMode] = useState<FinderMode>("all");
  const [query, setQuery] = useState(initialQuery);
  const [addedId, setAddedId] = useState("");
  const [slideAddedId, setSlideAddedId] = useState("");
  const [hymnSequences, setHymnSequences] = useState<Record<string, HymnSequenceSelection>>({});

  const results = useMemo(() => {
    const helpResults: FinderResult[] = preachingHelps.map((entry) => {
      const resultMode = entry.type === "Illustration" ? "illustrations" : "quotes";
      const references = entry.bibleReferences.join(" · ");
      const sourceLine = `${entry.sourceTitle}${entry.sourceLocator ? `, ${entry.sourceLocator}` : ""}`;
      return {
        id: `help-${entry.id}`,
        mode: resultMode,
        title: entry.title,
        byline: entry.author,
        detail: [references, entry.topics.join(" · ")].filter(Boolean).join(" · "),
        preview: entry.text,
        rights: entry.rightsStatus,
        sourceUrl: entry.sourceUrl,
        searchText: [entry.title, entry.author, entry.text, entry.sourceTitle, entry.sourceLocator, references, entry.topics.join(" "), entry.recommendedUse].join(" "),
        addition: {
          target: resultMode === "illustrations" ? "illustrations" : "quotes",
          heading: `${modeLabel(resultMode)} — ${entry.title}`,
          body: `${entry.text}\n\n— ${entry.author}\nSource: ${sourceLine}\nScripture connections: ${references || "None listed"}\nRights: ${entry.rightsStatus}`,
        },
        slide: {
          resourceKind: resultMode,
          title: entry.title,
          subtitle: entry.author,
          body: entry.text,
          speakerNotes: `Source: ${sourceLine}\nSource URL: ${entry.sourceUrl}\nScripture connections: ${references || "None listed"}\nRights: ${entry.rightsStatus}\nRecommended use: ${entry.recommendedUse}`,
        },
      };
    });

    const hymnResults: FinderResult[] = hymns.map((entry) => {
      const references = entry.scriptureReferences.join(" · ");
      const firstStanza = entry.stanzas[0] ?? "";
      return {
        id: `hymn-${entry.id}`,
        mode: "hymns",
        title: entry.title,
        byline: `${entry.lyricist} · ${entry.tune}`,
        detail: references,
        preview: entry.refrain || firstStanza,
        rights: `${entry.textRights} Music: ${entry.musicRights}`,
        sourceUrl: entry.textSourceUrl,
        searchText: [entry.title, entry.lyricist, entry.tune, references, entry.stanzas.join(" "), entry.refrain ?? ""].join(" "),
        addition: {
          target: "importedStudyNotes",
          heading: `Hymn connection — ${entry.title}`,
          body: `${entry.title}\n${entry.lyricist} · Tune: ${entry.tune}\nScripture connections: ${references || "None listed"}\n\n${entry.refrain || firstStanza}\n\nText rights: ${entry.textRights}\nMusic rights: ${entry.musicRights}\nSource: ${entry.textSourceUrl}`,
        },
        slide: {
          resourceKind: "hymns",
          title: entry.title,
          subtitle: `${entry.lyricist} · ${entry.tune}`,
          body: entry.refrain || firstStanza,
          speakerNotes: `Scripture connections: ${references || "None listed"}\nText source: ${entry.textSourceUrl}\nText rights: ${entry.textRights}\nMusic source: ${entry.musicSourceUrl}\nMusic rights: ${entry.musicRights}`,
        },
        hymn: entry,
      };
    });

    const bookResults: FinderResult[] = books.map((entry) => ({
      id: `book-${entry.slug}`,
      mode: "books",
      title: entry.title,
      byline: entry.author,
      detail: [entry.category, entry.collection].filter(Boolean).join(" · "),
      preview: entry.description || entry.recommendedUse,
      rights: entry.rightsStatus,
      sourceUrl: entry.sourceUrl,
      searchText: [entry.title, entry.author, entry.category, entry.collection, entry.description, entry.recommendedUse].join(" "),
      addition: {
        target: "importedStudyNotes",
        heading: `Book connection — ${entry.title}`,
        body: `${entry.title} — ${entry.author}\n${entry.description || entry.recommendedUse}\nRecommended use: ${entry.recommendedUse}\nRights: ${entry.rightsStatus}\nSource: ${entry.sourceUrl}`,
      },
      slide: {
        resourceKind: "books",
        title: entry.title,
        subtitle: entry.author,
        body: entry.description || entry.recommendedUse,
        speakerNotes: `Recommended use: ${entry.recommendedUse}\nSource URL: ${entry.sourceUrl}\nRights: ${entry.rightsStatus}`,
      },
    }));

    const commentaryResults: FinderResult[] = commentary.map((entry) => ({
      id: `commentary-${entry.id}`,
      mode: "commentary",
      title: entry.reference,
      byline: `${entry.author} · ${entry.resourceTitle}`,
      detail: "Reviewed commentary · keep Scripture primary",
      preview: entry.text,
      rights: entry.rightsStatus,
      sourceUrl: entry.sourceUrl,
      searchText: [entry.reference, entry.author, entry.resourceTitle, entry.text].join(" "),
      addition: {
        target: "importedStudyNotes",
        heading: `Commentary connection — ${entry.reference}`,
        body: `${entry.reference}\n${entry.text}\n\n— ${entry.author}, ${entry.resourceTitle}\nRights: ${entry.rightsStatus}\nSource: ${entry.sourceUrl}`,
      },
      slide: {
        resourceKind: "commentary",
        title: entry.reference,
        subtitle: `${entry.author} · ${entry.resourceTitle}`,
        body: entry.text,
        speakerNotes: `Keep Scripture primary.\nSource URL: ${entry.sourceUrl}\nRights: ${entry.rightsStatus}`,
      },
    }));

    return [...helpResults, ...hymnResults, ...bookResults, ...commentaryResults]
      .filter((entry) => (mode === "all" || entry.mode === mode) && matchesQuery(entry.searchText, query))
      .slice(0, MAX_VISIBLE_RESULTS);
  }, [books, commentary, mode, query]);

  function hymnSelection(result: FinderResult): HymnSequenceSelection {
    return hymnSequences[result.id] ?? {
      stanzaIndexes: result.hymn?.stanzas.length ? [0] : [],
      includeRefrain: Boolean(result.hymn?.refrain),
    };
  }

  function selectedHymnSequence(result: FinderResult) {
    if (!result.hymn) return [];
    const selection = hymnSelection(result);
    const sections = selection.stanzaIndexes
      .filter((index) => result.hymn?.stanzas[index])
      .sort((left, right) => left - right)
      .flatMap((index) => {
        const stanza = { label: `Stanza ${index + 1}`, text: result.hymn?.stanzas[index] ?? "" };
        return selection.includeRefrain && result.hymn?.refrain
          ? [stanza, { label: "Refrain", text: result.hymn.refrain }]
          : [stanza];
      });
    if (!sections.length && selection.includeRefrain && result.hymn.refrain) {
      return [{ label: "Refrain", text: result.hymn.refrain }];
    }
    return sections;
  }

  function toggleHymnStanza(result: FinderResult, stanzaIndex: number) {
    const selection = hymnSelection(result);
    const stanzaIndexes = selection.stanzaIndexes.includes(stanzaIndex)
      ? selection.stanzaIndexes.filter((index) => index !== stanzaIndex)
      : [...selection.stanzaIndexes, stanzaIndex].sort((left, right) => left - right);
    setHymnSequences((current) => ({ ...current, [result.id]: { ...selection, stanzaIndexes } }));
  }

  function toggleHymnRefrain(result: FinderResult) {
    const selection = hymnSelection(result);
    setHymnSequences((current) => ({
      ...current,
      [result.id]: { ...selection, includeRefrain: !selection.includeRefrain },
    }));
  }

  function resolvedAddition(result: FinderResult): SermonResourceAddition {
    const sequence = selectedHymnSequence(result);
    if (!sequence.length || !result.hymn) return result.addition;
    const references = result.hymn.scriptureReferences.join(" · ");
    const sequenceText = sequence.map((section) => `${section.label}\n${section.text}`).join("\n\n");
    return {
      ...result.addition,
      body: `${result.hymn.title}\n${result.hymn.lyricist} · Tune: ${result.hymn.tune}\nSelected sequence: ${sequence.map((section) => section.label).join(" → ")}\nScripture connections: ${references || "None listed"}\n\n${sequenceText}\n\nText rights: ${result.hymn.textRights}\nMusic rights: ${result.hymn.musicRights}\nSource: ${result.hymn.textSourceUrl}`,
    };
  }

  function resolvedSlides(result: FinderResult): SermonResourceSlideSeed[] {
    const sequence = selectedHymnSequence(result);
    if (!sequence.length) return result.hymn ? [] : [result.slide];
    return sequence.map((section, index) => ({
      ...result.slide,
      subtitle: `${result.slide.subtitle} · ${section.label}`,
      body: section.text,
      speakerNotes: `Hymn sequence: ${index + 1} of ${sequence.length}\nSelected section: ${section.label}\n${result.slide.speakerNotes}`,
    }));
  }

  function addResult(result: FinderResult) {
    onAdd(resolvedAddition(result));
    setAddedId(result.id);
  }

  function addResultToPresentation(result: FinderResult) {
    const slides = resolvedSlides(result);
    if (!slides.length) return;
    onAddToPresentation(slides);
    setSlideAddedId(result.id);
  }

  const tabs: Array<{ id: FinderMode; label: string }> = [
    { id: "all", label: "All" },
    { id: "quotes", label: "Quotes" },
    { id: "illustrations", label: "Illustrations" },
    { id: "hymns", label: "Hymns" },
    { id: "books", label: "Books" },
    { id: "commentary", label: "Commentary" },
  ];

  return (
    <article className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Sermon Resource Finder</p>
      <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">Search reviewed resources in one place</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Find source-checked quotes, illustrations, hymns, books, and commentary. Add a resource to the sermon or send it directly to the presentation slides without losing its author, source, or rights status.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {tabs.map((tab) => (
          <button
            key={`sermon-resource-mode-${tab.id}`}
            className={`min-h-11 rounded-xl px-3 text-xs font-semibold ${mode === tab.id ? "bg-[var(--ink)] text-white" : "border border-[var(--line)] bg-[var(--paper)] text-[var(--muted)]"}`}
            onClick={() => setMode(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <label className="relative mt-4 block">
        <span className="sr-only">Search sermon resources</span>
        <Search aria-hidden="true" className="absolute left-3 top-3.5 text-[var(--muted)]" size={17} />
        <input
          className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] pl-10 pr-3 text-sm text-[var(--ink)] outline-none"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search passage, subject, title, author, hymn, or words"
          value={query}
        />
      </label>
      <p className="mt-2 text-xs text-[var(--muted)]">{results.length} reviewed result{results.length === 1 ? "" : "s"}{results.length === MAX_VISIBLE_RESULTS ? ` · showing first ${MAX_VISIBLE_RESULTS}` : ""}</p>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {results.map((result) => (
          <section key={result.id} className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">{resultIcon(result.mode)} {modeLabel(result.mode)}</p>
                <h3 className="mt-2 text-base font-semibold text-[var(--ink)]">{result.title}</h3>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">{result.byline}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[var(--green)]">Reviewed</span>
            </div>
            {result.detail && <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{result.detail}</p>}
            {result.hymn && (
              <fieldset className="mt-3 rounded-xl border border-[var(--line)] bg-white p-3">
                <legend className="px-1 text-xs font-semibold text-[var(--muted)]">Build hymn slide sequence</legend>
                <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {result.hymn.stanzas.map((_, index) => (
                    <label key={`${result.id}-stanza-${index + 1}`} className="flex min-h-10 items-center gap-2 rounded-lg bg-[var(--paper)] px-3 text-xs font-semibold text-[var(--ink)]">
                      <input
                        aria-label={`${result.title} Stanza ${index + 1}`}
                        checked={hymnSelection(result).stanzaIndexes.includes(index)}
                        onChange={() => toggleHymnStanza(result, index)}
                        type="checkbox"
                      />
                      Stanza {index + 1}
                    </label>
                  ))}
                </div>
                {result.hymn.refrain && (
                  <label className="mt-2 flex min-h-10 items-center gap-2 rounded-lg bg-[var(--paper)] px-3 text-xs font-semibold text-[var(--ink)]">
                    <input
                      aria-label={`${result.title} repeat refrain after each stanza`}
                      checked={hymnSelection(result).includeRefrain}
                      onChange={() => toggleHymnRefrain(result)}
                      type="checkbox"
                    />
                    Repeat refrain after each selected stanza
                  </label>
                )}
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  {selectedHymnSequence(result).length
                    ? `${selectedHymnSequence(result).length} ordered slide${selectedHymnSequence(result).length === 1 ? "" : "s"}: ${selectedHymnSequence(result).map((section) => section.label).join(" → ")}`
                    : "Choose at least one stanza or the refrain."}
                </p>
              </fieldset>
            )}
            <p className="mt-3 line-clamp-5 whitespace-pre-line text-sm leading-6 text-[var(--ink)]">{selectedHymnSequence(result)[0]?.text ?? result.preview}</p>
            <p className="mt-3 text-xs leading-5 text-[var(--muted)]"><strong>Rights:</strong> {result.rights}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--green)] px-3 text-xs font-semibold text-white" onClick={() => addResult(result)} type="button">
                <Plus aria-hidden="true" size={15} /> Add to sermon
              </button>
              <button disabled={Boolean(result.hymn) && !selectedHymnSequence(result).length} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--green)] bg-white px-3 text-xs font-semibold text-[var(--green)] disabled:cursor-not-allowed disabled:opacity-50" onClick={() => addResultToPresentation(result)} type="button">
                {result.hymn ? `Create ${selectedHymnSequence(result).length} hymn slide${selectedHymnSequence(result).length === 1 ? "" : "s"}` : "Send to presentation"}
              </button>
              {result.sourceUrl && <a className="inline-flex min-h-10 items-center rounded-xl border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--green)]" href={result.sourceUrl} rel="noreferrer" target="_blank">Review source</a>}
            </div>
            {addedId === result.id && <p aria-live="polite" className="mt-2 text-xs font-semibold text-[var(--green)]">Added with source and rights notes.</p>}
            {slideAddedId === result.id && <p aria-live="polite" className="mt-2 text-xs font-semibold text-[var(--green)]">Added the ordered hymn sequence to presentation slides with source and rights notes.</p>}
          </section>
        ))}
        {!results.length && <p className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)]">No reviewed resources match yet. Try a passage, doctrine, author, hymn title, or sermon subject.</p>}
      </div>
    </article>
  );
}
