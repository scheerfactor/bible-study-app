"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BookOpen, ExternalLink, Feather, ImageIcon, Landmark, Music2, Play, Presentation, Quote as QuoteIcon, Search, Square } from "lucide-react";
import hymnsData from "../../data/hymns/verified-hymns.json";
import evidenceData from "../../data/archaeology/verified-evidence.json";
import preachingData from "../../data/preaching-helps/verified-preaching-helps.json";
import presentationMediaData from "../../public/media/sermon-slides/media-assets.json";

type ResourceImageSlot = "cross" | "open-bible" | "sunrise" | "empty-tomb" | "prayer-hands" | "world-map" | "field-harvest" | "storm-judgment" | "light-window" | "pulpit" | "communion-table" | "baptism-water" | "church-window" | "quiet-study" | "shepherd-field" | "worship-piano" | "still-waters" | "scripture-lamp" | "heavens-declare" | "nimrud-relief" | "nineveh-cavalry-relief" | "babylon-lion-panel";

export type ResourcePresentationSeed = {
  title: string;
  notes: string;
  slides: Array<{
    type: "Title" | "Quote" | "Illustration";
    title: string;
    subtitle: string;
    body: string;
    imageSlot: ResourceImageSlot;
  }>;
};

export type ResourceDeskPassageContext = {
  book: string;
  chapter: number;
  terms: string[];
};

type Hymn = (typeof hymnsData)[number];
type Evidence = (typeof evidenceData)[number];
type PreachingHelp = (typeof preachingData)[number];
type PreachingHelpFilter = "All" | "Quote" | "Poem" | "Illustration";
type PresentationMedia = {
  file: string;
  slot: string;
  category: string;
  source: string;
  source_url: string;
  rightsStatus: string;
  artist: string;
  credit: string;
  recommendedUse: string;
  optimized: string;
  themes?: string[];
  bibleReferences?: string[];
};

const resourceImageSlots = new Set<ResourceImageSlot>([
  "cross", "open-bible", "sunrise", "empty-tomb", "prayer-hands", "world-map", "field-harvest", "storm-judgment", "light-window", "pulpit", "communion-table", "baptism-water", "church-window", "quiet-study", "shepherd-field", "worship-piano", "still-waters", "scripture-lamp", "heavens-declare", "nimrud-relief", "nineveh-cavalry-relief", "babylon-lion-panel",
]);

const presentationMedia = (presentationMediaData as PresentationMedia[]).filter(
  (entry): entry is PresentationMedia & { slot: ResourceImageSlot } => resourceImageSlots.has(entry.slot as ResourceImageSlot),
);

function referenceMatchesChapter(reference: string, context: ResourceDeskPassageContext) {
  const normalizedReference = reference.toLowerCase();
  const chapterPrefix = `${context.book} ${context.chapter}`.toLowerCase();
  if (normalizedReference === chapterPrefix || normalizedReference.startsWith(`${chapterPrefix}:`)) return true;
  const psalmPrefix = `psalm ${context.chapter}`;
  if (context.book === "Psalms" && (normalizedReference === psalmPrefix || normalizedReference.startsWith(`${psalmPrefix}:`))) return true;
  return false;
}

function referenceMatchesBook(reference: string, context: ResourceDeskPassageContext) {
  const normalizedReference = reference.toLowerCase();
  const bookPrefix = context.book.toLowerCase();
  if (normalizedReference.startsWith(`${bookPrefix} `)) return true;
  if (context.book === "Psalms" && normalizedReference.startsWith("psalm ")) return true;
  return false;
}

function passageTopicScore(haystack: string, terms: string[]) {
  const normalizedHaystack = ` ${haystack.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()} `;
  return terms.reduce((score, term) => {
    const normalizedTerm = term.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    return normalizedTerm.length > 2 && normalizedHaystack.includes(` ${normalizedTerm} `) ? score + 4 : score;
  }, 0);
}

function rankedForPassage<T>(
  items: readonly T[],
  score: (item: T) => number,
) {
  return items
    .map((item, index) => ({ item, index, score: score(item) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
}

function passageMatchLabel(references: string[], score: number, context: ResourceDeskPassageContext) {
  if (references.some((reference) => referenceMatchesChapter(reference, context))) return "Direct chapter reference";
  if (references.some((reference) => referenceMatchesBook(reference, context))) return "Same Bible book";
  if (score > 0) return "Topic and word match";
  return "Closest reviewed resource";
}

function presentationMediaUrl(entry: PresentationMedia) {
  return `/media/sermon-slides/${entry.file}`;
}

function recommendedMediaForContent(references: string[], terms: string[], fallback: ResourceImageSlot) {
  const normalizedReferences = references.map((reference) => reference.toLowerCase());
  const ranked = presentationMedia
    .map((entry, index) => {
      const mediaReferences = entry.bibleReferences ?? [];
      const referenceScore = mediaReferences.reduce((score, reference) => {
        const normalized = reference.toLowerCase();
        if (normalizedReferences.includes(normalized)) return score + 100;
        const referenceChapter = normalized.replace(/:\d+(?:-\d+)?$/, "");
        return normalizedReferences.some((candidate) => candidate.replace(/:\d+(?:-\d+)?$/, "") === referenceChapter) ? score + 60 : score;
      }, 0);
      const topicScore = passageTopicScore([
        entry.category,
        entry.recommendedUse,
        ...(entry.themes ?? []),
        ...mediaReferences,
      ].join(" "), terms);
      return { entry, index, score: referenceScore + topicScore };
    })
    .sort((left, right) => right.score - left.score || left.index - right.index);
  return ranked[0]?.score > 0 ? ranked[0].entry : presentationMedia.find((entry) => entry.slot === fallback);
}

function midiFrequency(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

export default function BibleStudyResourceDesk({
  onCreatePresentation,
  passageContext,
}: {
  onCreatePresentation: (seed: ResourcePresentationSeed) => void;
  passageContext?: ResourceDeskPassageContext;
}) {
  const [mode, setMode] = useState<"hymns" | "evidence" | "preaching" | "media">("hymns");
  const [preachingHelpFilter, setPreachingHelpFilter] = useState<PreachingHelpFilter>("All");
  const [preachingHelpQuery, setPreachingHelpQuery] = useState("");
  const [playingHymnId, setPlayingHymnId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rankedHymns = rankedForPassage(hymnsData, (hymn) => {
    if (!passageContext) return 0;
    const referenceScore = hymn.scriptureReferences.reduce((score, reference) => {
      if (referenceMatchesChapter(reference, passageContext)) return score + 100;
      if (referenceMatchesBook(reference, passageContext)) return score + 30;
      return score;
    }, 0);
    return referenceScore + passageTopicScore([
      hymn.title,
      hymn.lyricist,
      ...hymn.scriptureReferences,
      ...hymn.stanzas,
      hymn.refrain ?? "",
    ].join(" "), passageContext.terms);
  });
  const rankedPreachingHelps = rankedForPassage(preachingData, (entry) => {
    if (!passageContext) return 0;
    const referenceScore = entry.bibleReferences.reduce((score, reference) => {
      if (referenceMatchesChapter(reference, passageContext)) return score + 100;
      if (referenceMatchesBook(reference, passageContext)) return score + 30;
      return score;
    }, 0);
    return referenceScore + passageTopicScore([
      entry.title,
      entry.type,
      entry.author,
      entry.text,
      entry.recommendedUse,
      ...entry.topics,
      ...entry.bibleReferences,
    ].join(" "), passageContext.terms);
  });
  const rankedEvidence = rankedForPassage(evidenceData, (entry) => {
    if (!passageContext) return 0;
    const referenceScore = entry.bibleReferences.reduce((score, reference) => {
      if (referenceMatchesChapter(reference, passageContext)) return score + 100;
      if (referenceMatchesBook(reference, passageContext)) return score + 30;
      return score;
    }, 0);
    return referenceScore + passageTopicScore([
      entry.title,
      entry.object,
      entry.culture,
      entry.place,
      entry.studyNote,
      entry.teachingPrompt,
      ...entry.bibleReferences,
    ].join(" "), passageContext.terms);
  });
  const rankedMedia = rankedForPassage(presentationMedia, (entry) => {
    if (!passageContext) return 0;
    const references = entry.bibleReferences ?? [];
    const referenceScore = references.reduce((score, reference) => {
      if (referenceMatchesChapter(reference, passageContext)) return score + 100;
      if (referenceMatchesBook(reference, passageContext)) return score + 30;
      return score;
    }, 0);
    return referenceScore + passageTopicScore([
      entry.category,
      entry.recommendedUse,
      ...(entry.themes ?? []),
      ...references,
    ].join(" "), passageContext.terms);
  });
  const [selectedHymnId, setSelectedHymnId] = useState(rankedHymns[0]?.item.id ?? hymnsData[0].id);
  const selectedHymn = hymnsData.find((hymn) => hymn.id === selectedHymnId) ?? rankedHymns[0]?.item ?? hymnsData[0];
  const filteredPreachingHelps = rankedPreachingHelps.map((ranked) => ranked.item).filter((entry) => {
    if (preachingHelpFilter !== "All" && entry.type !== preachingHelpFilter) return false;
    const query = preachingHelpQuery.trim().toLowerCase();
    if (!query) return true;
    return [entry.title, entry.author, entry.text, entry.recommendedUse, entry.topics.join(" "), entry.bibleReferences.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });
  const recommendedHymn = rankedHymns[0];
  const recommendedPreachingHelp = rankedPreachingHelps[0];
  const recommendedEvidence = rankedEvidence[0];
  const recommendedMedia = rankedMedia[0];

  function stopPlayback() {
    for (const oscillator of oscillatorsRef.current) {
      try {
        oscillator.stop();
      } catch {
        // Already stopped by its scheduled end time.
      }
    }
    oscillatorsRef.current = [];
    if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
    playbackTimerRef.current = null;
    setPlayingHymnId(null);
  }

  useEffect(() => stopPlayback, []);

  async function playHymn(hymn: Hymn) {
    stopPlayback();
    const AudioContextClass = window.AudioContext;
    const context = audioContextRef.current ?? new AudioContextClass();
    audioContextRef.current = context;
    await context.resume();
    const startAt = context.currentTime + 0.08;
    const master = context.createGain();
    master.gain.value = 0.55;
    master.connect(context.destination);

    oscillatorsRef.current = hymn.notes.map((note) => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const noteStart = startAt + note.time;
      const noteEnd = noteStart + note.duration;
      oscillator.type = "triangle";
      oscillator.frequency.value = midiFrequency(note.midi);
      envelope.gain.setValueAtTime(0.0001, noteStart);
      envelope.gain.exponentialRampToValueAtTime(Math.max(0.018, note.velocity * 0.075), noteStart + 0.018);
      envelope.gain.exponentialRampToValueAtTime(0.0001, noteEnd + 0.18);
      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.start(noteStart);
      oscillator.stop(noteEnd + 0.2);
      return oscillator;
    });

    setPlayingHymnId(hymn.id);
    playbackTimerRef.current = setTimeout(stopPlayback, (hymn.durationSeconds + 0.5) * 1000);
  }

  function addHymnPresentation(hymn: Hymn) {
    const media = recommendedMediaForContent(
      hymn.scriptureReferences,
      [hymn.title, hymn.lyricist, ...hymn.stanzas, hymn.refrain ?? ""],
      "worship-piano",
    );
    const imageSlot = media?.slot ?? "worship-piano";
    onCreatePresentation({
      title: hymn.title + " Hymn",
      notes: hymn.lyricist + " · " + hymn.tune + " · " + hymn.textRights + " Music: " + hymn.musicRights + ". Background: " + (media?.category ?? "Worship") + ".",
      slides: [
        {
          type: "Title",
          title: hymn.title,
          subtitle: hymn.lyricist + " · Tune: " + hymn.tune,
          body: hymn.scriptureReferences.join(" · "),
          imageSlot,
        },
        ...hymn.stanzas.map((stanza, index) => ({
          type: "Quote" as const,
          title: hymn.title + " · Stanza " + (index + 1),
          subtitle: hymn.lyricist,
          body: hymn.refrain ? stanza + "\n\nRefrain:\n" + hymn.refrain : stanza,
          imageSlot,
        })),
      ],
    });
  }

  function addEvidencePresentation(entry: Evidence) {
    onCreatePresentation({
      title: entry.title + " Bible Background",
      notes: entry.rights + " Source: " + entry.sourceUrl,
      slides: [
        {
          type: "Title",
          title: entry.title,
          subtitle: entry.date + " · " + entry.place,
          body: entry.bibleReferences.join(" · "),
          imageSlot: entry.imageSlot as ResourceImageSlot,
        },
        {
          type: "Illustration",
          title: "What the object establishes",
          subtitle: entry.object + " · " + entry.culture,
          body: entry.studyNote,
          imageSlot: entry.imageSlot as ResourceImageSlot,
        },
        {
          type: "Illustration",
          title: "Teaching connection",
          subtitle: entry.bibleReferences.join(" · "),
          body: entry.teachingPrompt,
          imageSlot: entry.imageSlot as ResourceImageSlot,
        },
      ],
    });
  }

  function addPreachingHelpPresentation(entry: PreachingHelp) {
    const slideType = entry.type === "Illustration" ? "Illustration" : "Quote";
    const fallback: ResourceImageSlot = entry.type === "Illustration" ? "pulpit" : entry.type === "Poem" ? "church-window" : "open-bible";
    const imageSlot = recommendedMediaForContent(entry.bibleReferences, [entry.title, entry.text, entry.recommendedUse, ...entry.topics], fallback)?.slot ?? fallback;
    onCreatePresentation({
      title: entry.title,
      notes: `${entry.author}, ${entry.sourceTitle}, ${entry.sourceLocator}. ${entry.rightsStatus}. Source: ${entry.sourceUrl}\n\nReview: ${entry.reviewNote}`,
      slides: [
        {
          type: slideType,
          title: entry.title,
          subtitle: `${entry.author} · ${entry.bibleReferences.join(" · ")}`,
          body: entry.slideText,
          imageSlot,
        },
      ],
    });
  }

  function addMediaPresentation(entry: PresentationMedia & { slot: ResourceImageSlot }) {
    const references = entry.bibleReferences ?? [];
    const title = passageContext ? `${passageContext.book} ${passageContext.chapter} Background` : `${entry.category} Background`;
    onCreatePresentation({
      title,
      notes: `${entry.rightsStatus}. ${entry.credit}. Source: ${entry.source_url}`,
      slides: [{
        type: "Title",
        title: passageContext ? `${passageContext.book} ${passageContext.chapter}` : entry.category,
        subtitle: entry.recommendedUse,
        body: references.join(" · "),
        imageSlot: entry.slot,
      }],
    });
  }

  return (
    <section id="teaching-worship-desk" className="scroll-mt-28 border-y border-[var(--line)] bg-white/55 py-6">
      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Teaching and worship desk</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">Hymns, evidence, preaching helps, and backgrounds</h2>
        </div>
        <div className="grid grid-cols-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-1 sm:grid-cols-4">
          <button className={"flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold " + (mode === "hymns" ? "bg-[var(--green)] text-white" : "text-[var(--green)]")} onClick={() => setMode("hymns")} type="button">
            <Music2 size={17} /> Hymns
          </button>
          <button className={"flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold " + (mode === "evidence" ? "bg-[var(--green)] text-white" : "text-[var(--green)]")} onClick={() => setMode("evidence")} type="button">
            <Landmark size={17} /> Evidence
          </button>
          <button className={"flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold " + (mode === "preaching" ? "bg-[var(--green)] text-white" : "text-[var(--green)]")} onClick={() => setMode("preaching")} type="button">
            <Feather size={17} /> Helps
          </button>
          <button className={"flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold " + (mode === "media" ? "bg-[var(--green)] text-white" : "text-[var(--green)]")} onClick={() => setMode("media")} type="button">
            <ImageIcon size={17} /> Backgrounds
          </button>
        </div>
      </div>

      {passageContext && recommendedHymn && recommendedPreachingHelp && recommendedEvidence && recommendedMedia && (
        <div className="mt-5 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Best matches for this passage</p>
              <h3 className="mt-1 text-lg font-semibold text-[var(--ink)]">{passageContext.book} {passageContext.chapter}</h3>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--green)]">Reviewed and rights-tracked</span>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <button
              className="rounded-lg border border-[var(--line)] bg-white p-3 text-left"
              onClick={() => {
                setMode("hymns");
                setSelectedHymnId(recommendedHymn.item.id);
              }}
              type="button"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"><Music2 size={15} /> Hymn</span>
              <span className="mt-2 block text-sm font-semibold text-[var(--green)]">{recommendedHymn.item.title}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{passageMatchLabel(recommendedHymn.item.scriptureReferences, recommendedHymn.score, passageContext)}</span>
            </button>
            <button
              className="rounded-lg border border-[var(--line)] bg-white p-3 text-left"
              onClick={() => {
                setMode("preaching");
                setPreachingHelpFilter("All");
                setPreachingHelpQuery(recommendedPreachingHelp.item.title);
              }}
              type="button"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"><Feather size={15} /> {recommendedPreachingHelp.item.type}</span>
              <span className="mt-2 block text-sm font-semibold text-[var(--green)]">{recommendedPreachingHelp.item.title}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{passageMatchLabel(recommendedPreachingHelp.item.bibleReferences, recommendedPreachingHelp.score, passageContext)}</span>
            </button>
            <button className="rounded-lg border border-[var(--line)] bg-white p-3 text-left" onClick={() => setMode("evidence")} type="button">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"><Landmark size={15} /> Bible-world evidence</span>
              <span className="mt-2 block text-sm font-semibold text-[var(--green)]">{recommendedEvidence.item.title}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{passageMatchLabel(recommendedEvidence.item.bibleReferences, recommendedEvidence.score, passageContext)}</span>
            </button>
            <button className="overflow-hidden rounded-lg border border-[var(--line)] bg-white text-left" onClick={() => setMode("media")} type="button">
              <span className="relative block aspect-[16/7] bg-stone-200">
                <Image alt="" className="object-cover" fill loading="eager" sizes="(max-width: 1280px) 50vw, 25vw" src={presentationMediaUrl(recommendedMedia.item)} />
              </span>
              <span className="block p-3">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"><ImageIcon size={15} /> Background</span>
                <span className="mt-2 block text-sm font-semibold text-[var(--green)]">{recommendedMedia.item.category}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{passageMatchLabel(recommendedMedia.item.bibleReferences ?? [], recommendedMedia.score, passageContext)}</span>
              </span>
            </button>
          </div>
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
            Matches use reviewed Scripture references, chapter themes, and repeated words. Read the KJV passage first, then confirm that each hymn, illustration, historical item, or background genuinely serves the text.
          </p>
        </div>
      )}

      {mode === "hymns" && (
        <div className="mt-5">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {rankedHymns.map(({ item: hymn }, index) => (
              <button key={hymn.id} className={"shrink-0 rounded-lg border px-3 py-2 text-left text-sm font-semibold " + (selectedHymn.id === hymn.id ? "border-[var(--green)] bg-[var(--green)] text-white" : "border-[var(--line)] bg-white text-[var(--ink)]")} onClick={() => setSelectedHymnId(hymn.id)} type="button">
                {hymn.title}{passageContext && index === 0 ? " · Best match" : ""}
              </button>
            ))}
          </div>
          <div className="mt-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[var(--ink)]">{selectedHymn.title}</h3>
                <p className="mt-1 text-sm text-[var(--muted)]">{selectedHymn.lyricist} · {selectedHymn.lyricYear} · {selectedHymn.tune}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="flex h-10 items-center gap-2 rounded-lg bg-[var(--green)] px-3 text-sm font-semibold text-white" onClick={() => playingHymnId === selectedHymn.id ? stopPlayback() : void playHymn(selectedHymn)} type="button">
                  {playingHymnId === selectedHymn.id ? <Square size={16} /> : <Play size={16} />}
                  {playingHymnId === selectedHymn.id ? "Stop" : "Play piano"}
                </button>
                <button className="flex h-10 items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--green)]" onClick={() => addHymnPresentation(selectedHymn)} type="button">
                  <Presentation size={16} /> Add slides
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {selectedHymn.stanzas.map((stanza, index) => (
                <div key={selectedHymn.id + "-stanza-" + index} className="border-l-2 border-[var(--gold)] pl-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Stanza {index + 1}</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[var(--ink)]">{stanza}</p>
                </div>
              ))}
              {selectedHymn.refrain && (
                <div className="border-l-2 border-[var(--green)] pl-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Refrain</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[var(--ink)]">{selectedHymn.refrain}</p>
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
              <span>{selectedHymn.musicRights}</span>
              <a className="inline-flex items-center gap-1 font-semibold text-[var(--green)]" href={selectedHymn.textSourceUrl} rel="noreferrer" target="_blank">Lyrics source <ExternalLink size={13} /></a>
              <a className="inline-flex items-center gap-1 font-semibold text-[var(--green)]" href={selectedHymn.musicSourceUrl} rel="noreferrer" target="_blank">Music source <ExternalLink size={13} /></a>
            </div>
          </div>
        </div>
      )}

      {mode === "evidence" && (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {rankedEvidence.map(({ item: entry }) => (
            <article key={entry.id} className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)]">
              <div className="relative aspect-[4/3] bg-stone-200">
                <Image alt={entry.title} className="object-cover" fill loading="eager" sizes="(max-width: 1024px) 100vw, 33vw" src={entry.assetUrl} />
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{entry.date} · {entry.culture}</p>
                <h3 className="mt-1 text-base font-semibold text-[var(--ink)]">{entry.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{entry.studyNote}</p>
                <p className="mt-3 text-xs font-semibold text-[var(--green)]">{entry.bibleReferences.join(" · ")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="flex h-10 items-center gap-2 rounded-lg bg-[var(--green)] px-3 text-sm font-semibold text-white" onClick={() => addEvidencePresentation(entry)} type="button">
                    <Presentation size={16} /> Add slides
                  </button>
                  <a className="flex h-10 items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--green)]" href={entry.sourceUrl} rel="noreferrer" target="_blank">
                    <BookOpen size={16} /> Museum record
                  </a>
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{entry.rights}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {mode === "preaching" && (
        <div className="mt-5">
          <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["All", "Quote", "Poem", "Illustration"] as PreachingHelpFilter[]).map((filter) => (
                <button
                  key={filter}
                  className={"shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold " + (preachingHelpFilter === filter ? "border-[var(--green)] bg-[var(--green)] text-white" : "border-[var(--line)] bg-white text-[var(--ink)]")}
                  onClick={() => setPreachingHelpFilter(filter)}
                  type="button"
                >
                  {filter}
                </button>
              ))}
            </div>
            <label className="relative block w-full lg:max-w-sm">
              <span className="sr-only">Search preaching helps</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
              <input
                className="h-11 w-full rounded-lg border border-[var(--line)] bg-white pl-10 pr-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--green)]"
                onChange={(event) => setPreachingHelpQuery(event.target.value)}
                placeholder="Search topic, passage, or author"
                type="search"
                value={preachingHelpQuery}
              />
            </label>
          </div>

          <p className="mt-3 text-sm text-[var(--muted)]">
            {filteredPreachingHelps.length} source-verified public-domain {filteredPreachingHelps.length === 1 ? "entry" : "entries"}
          </p>

          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {filteredPreachingHelps.map((entry) => (
              <article key={entry.id} className="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{entry.type} · {entry.author}</p>
                    <h3 className="mt-1 text-base font-semibold text-[var(--ink)]">{entry.title}</h3>
                  </div>
                  {entry.type === "Quote" ? <QuoteIcon aria-hidden="true" className="shrink-0 text-[var(--gold)]" size={20} /> : <Feather aria-hidden="true" className="shrink-0 text-[var(--gold)]" size={20} />}
                </div>

                <blockquote className="mt-3 whitespace-pre-line border-l-2 border-[var(--gold)] pl-3 text-sm leading-6 text-[var(--ink)]">
                  {entry.slideText}
                </blockquote>
                <p className="mt-3 text-xs font-semibold text-[var(--green)]">{entry.bibleReferences.join(" · ")}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{entry.recommendedUse}</p>

                <details className="mt-3 border-t border-[var(--line)] pt-3 text-sm text-[var(--muted)]">
                  <summary className="cursor-pointer font-semibold text-[var(--green)]">Full excerpt and review note</summary>
                  <p className="mt-3 whitespace-pre-line leading-6 text-[var(--ink)]">{entry.text}</p>
                  <p className="mt-3 leading-6"><strong>Review:</strong> {entry.reviewNote}</p>
                </details>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="flex h-10 items-center gap-2 rounded-lg bg-[var(--green)] px-3 text-sm font-semibold text-white" onClick={() => addPreachingHelpPresentation(entry)} type="button">
                    <Presentation size={16} /> Add slide
                  </button>
                  <a className="flex h-10 items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 text-sm font-semibold text-[var(--green)]" href={entry.sourceUrl} rel="noreferrer" target="_blank">
                    <BookOpen size={16} /> Source
                  </a>
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">{entry.sourceTitle} · {entry.sourceLocator} · {entry.rightsStatus}</p>
              </article>
            ))}
          </div>

          {filteredPreachingHelps.length === 0 && (
            <p className="mt-4 border-l-2 border-[var(--gold)] pl-3 text-sm text-[var(--muted)]">No reviewed preaching helps match that search.</p>
          )}
        </div>
      )}

      {mode === "media" && (
        <div className="mt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">Passage-matched presentation media</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Rights-tracked backgrounds ranked by KJV reference, theme, and repeated passage words.</p>
            </div>
            <span className="rounded-full bg-[var(--paper)] px-3 py-1.5 text-xs font-semibold text-[var(--green)]">{rankedMedia.length} backgrounds</span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rankedMedia.map(({ item: entry }, index) => (
              <article key={entry.slot} className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)]">
                <div className="relative aspect-video bg-stone-200">
                  <Image alt={`${entry.category} presentation background`} className="object-cover" fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" src={presentationMediaUrl(entry)} />
                  {passageContext && index === 0 && <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[var(--green)] shadow-sm">Best match</span>}
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-[var(--ink)]">{entry.category}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{entry.recommendedUse}</p>
                  {!!entry.bibleReferences?.length && <p className="mt-3 text-xs font-semibold text-[var(--green)]">{entry.bibleReferences.join(" · ")}</p>}
                  {!!entry.themes?.length && <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{entry.themes.join(" · ")}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button className="flex h-10 items-center gap-2 rounded-lg bg-[var(--green)] px-3 text-sm font-semibold text-white" onClick={() => addMediaPresentation(entry)} type="button">
                      <Presentation size={16} /> Start slide
                    </button>
                    <span className="text-xs font-semibold text-[var(--muted)]">{entry.rightsStatus}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
