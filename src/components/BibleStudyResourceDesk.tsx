"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { BookOpen, ExternalLink, Landmark, Music2, Play, Presentation, Square } from "lucide-react";
import hymnsData from "../../data/hymns/verified-hymns.json";
import evidenceData from "../../data/archaeology/verified-evidence.json";

type ResourceImageSlot = "church-window" | "nimrud-relief" | "nineveh-cavalry-relief" | "babylon-lion-panel";

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

type Hymn = (typeof hymnsData)[number];
type Evidence = (typeof evidenceData)[number];

function midiFrequency(note: number) {
  return 440 * 2 ** ((note - 69) / 12);
}

export default function BibleStudyResourceDesk({
  onCreatePresentation,
}: {
  onCreatePresentation: (seed: ResourcePresentationSeed) => void;
}) {
  const [mode, setMode] = useState<"hymns" | "evidence">("hymns");
  const [selectedHymnId, setSelectedHymnId] = useState(hymnsData[0].id);
  const [playingHymnId, setPlayingHymnId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedHymn = hymnsData.find((hymn) => hymn.id === selectedHymnId) ?? hymnsData[0];

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
    onCreatePresentation({
      title: hymn.title + " Hymn",
      notes: hymn.lyricist + " · " + hymn.tune + " · " + hymn.textRights + " Music: " + hymn.musicRights + ".",
      slides: [
        {
          type: "Title",
          title: hymn.title,
          subtitle: hymn.lyricist + " · Tune: " + hymn.tune,
          body: hymn.scriptureReferences.join(" · "),
          imageSlot: "church-window",
        },
        ...hymn.stanzas.map((stanza, index) => ({
          type: "Quote" as const,
          title: hymn.title + " · Stanza " + (index + 1),
          subtitle: hymn.lyricist,
          body: stanza,
          imageSlot: "church-window" as const,
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

  return (
    <section className="border-y border-[var(--line)] bg-white/55 py-6">
      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Teaching and worship desk</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">Hymns and Bible-world evidence</h2>
        </div>
        <div className="grid grid-cols-2 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-1">
          <button className={"flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold " + (mode === "hymns" ? "bg-[var(--green)] text-white" : "text-[var(--green)]")} onClick={() => setMode("hymns")} type="button">
            <Music2 size={17} /> Hymns
          </button>
          <button className={"flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold " + (mode === "evidence" ? "bg-[var(--green)] text-white" : "text-[var(--green)]")} onClick={() => setMode("evidence")} type="button">
            <Landmark size={17} /> Evidence
          </button>
        </div>
      </div>

      {mode === "hymns" && (
        <div className="mt-5">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {hymnsData.map((hymn) => (
              <button key={hymn.id} className={"shrink-0 rounded-lg border px-3 py-2 text-left text-sm font-semibold " + (selectedHymn.id === hymn.id ? "border-[var(--green)] bg-[var(--green)] text-white" : "border-[var(--line)] bg-white text-[var(--ink)]")} onClick={() => setSelectedHymnId(hymn.id)} type="button">
                {hymn.title}
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
          {evidenceData.map((entry) => (
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
    </section>
  );
}
