"use client";

import {
  ExternalLink,
  Headphones,
  Pause,
  Play,
  Radio,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import radioData from "../../data/media/manifests/radio-stations.json";
import uploadedData from "../../data/media/manifests/uploaded-public-domain-audio-pilots.json";
import intakeData from "../../data/media/manifests/media-intake-candidates.json";

type RadioStation = {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  trackIds: string[];
};

type RadioReview = {
  mediaRecordId: string;
  sourceManifest: "uploaded-public-domain-audio-pilots" | "media-intake-candidates";
  approvalStatus: string;
  playbackReview: string;
};

type UploadedAudioRecord = {
  id: string;
  workTitle: string;
  segmentTitle: string;
  creator: string;
  kind: string;
  category: string;
  sourceUrl: string;
  rightsStatus: string;
  rightsEvidence: string;
  publicUrl: string;
  contentType: string;
  duration?: string;
};

type IntakeAudioRecord = {
  id: string;
  title: string;
  creator: string;
  kind: string;
  series: string;
  passage?: string;
  duration: string;
  sourceUrl: string;
  sourcePageUrl?: string;
  rightsStatus: string;
  rightsEvidence: string;
  requiredAttribution?: string;
};

type RadioTrack = {
  id: string;
  title: string;
  segmentTitle: string;
  creator: string;
  kind: string;
  category: string;
  passage: string;
  durationLabel: string;
  audioUrl: string;
  sourceUrl: string;
  rightsLabel: string;
  rightsEvidence: string;
  attribution: string;
};

const manifest = radioData as {
  reviewedAt: string;
  launchStatus: string;
  stations: RadioStation[];
  reviewedTracks: RadioReview[];
};
const uploadedRecords = uploadedData as UploadedAudioRecord[];
const intakeRecords = intakeData as IntakeAudioRecord[];

function normalizedTrack(review: RadioReview): RadioTrack | null {
  if (review.sourceManifest === "uploaded-public-domain-audio-pilots") {
    const record = uploadedRecords.find((candidate) => candidate.id === review.mediaRecordId);
    if (!record) return null;
    return {
      id: record.id,
      title: record.workTitle,
      segmentTitle: record.segmentTitle,
      creator: record.creator,
      kind: record.kind,
      category: record.category,
      passage: record.kind === "Bible Audio" ? record.segmentTitle : "",
      durationLabel: record.duration ?? "Audio",
      audioUrl: record.publicUrl,
      sourceUrl: record.sourceUrl,
      rightsLabel: "Public domain in the USA",
      rightsEvidence: record.rightsEvidence,
      attribution: `${record.creator}. Recording source: LibriVox.`,
    };
  }

  const record = intakeRecords.find((candidate) => candidate.id === review.mediaRecordId);
  if (!record) return null;
  return {
    id: record.id,
    title: record.title,
    segmentTitle: record.series,
    creator: record.creator,
    kind: record.kind,
    category: record.series,
    passage: record.passage ?? "",
    durationLabel: record.duration,
    audioUrl: record.sourceUrl,
    sourceUrl: record.sourcePageUrl ?? record.sourceUrl,
    rightsLabel: "Free public use with attribution",
    rightsEvidence: record.rightsEvidence,
    attribution: record.requiredAttribution ?? record.creator,
  };
}

const reviewedTracks = manifest.reviewedTracks
  .map(normalizedTrack)
  .filter((track): track is RadioTrack => Boolean(track));
const tracksById = new Map(reviewedTracks.map((track) => [track.id, track]));

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default function RadioWorkspace() {
  const [stationId, setStationId] = useState(manifest.stations[0]?.id ?? "mix");
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [playRequested, setPlayRequested] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackMessage, setPlaybackMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const station = manifest.stations.find((candidate) => candidate.id === stationId) ?? manifest.stations[0];
  const queue = useMemo(
    () => station.trackIds.map((trackId) => tracksById.get(trackId)).filter((track): track is RadioTrack => Boolean(track)),
    [station],
  );
  const currentTrack = queue[activeIndex] ?? queue[0] ?? null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    if (!playRequested) return;
    void audio.play().then(() => {
      setPlaying(true);
      setPlaybackMessage("");
    }).catch(() => {
      setPlaying(false);
      setPlaybackMessage("Playback needs one more tap in this browser.");
    });
  }, [currentTrack, playRequested]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function changeStation(nextStationId: string) {
    audioRef.current?.pause();
    setStationId(nextStationId);
    setActiveIndex(0);
    setPlaying(false);
    setPlayRequested(false);
    setPlaybackMessage("");
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    setPlayRequested(true);
    try {
      await audio.play();
      setPlaying(true);
      setPlaybackMessage("");
    } catch {
      setPlaybackMessage("Playback could not start. Check the connection and try again.");
    }
  }

  function chooseTrack(index: number) {
    if (index === activeIndex) {
      void togglePlayback();
      return;
    }
    setPlayRequested(true);
    setActiveIndex(index);
  }

  function moveTrack(direction: -1 | 1) {
    if (!queue.length) return;
    const nextIndex = shuffle
      ? Math.floor(Math.random() * queue.length)
      : (activeIndex + direction + queue.length) % queue.length;
    setPlayRequested(true);
    setActiveIndex(nextIndex);
  }

  function seek(nextTime: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
      <header className="border-b border-[var(--line)] pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--green)]">
              <Radio size={18} /> Live-style listening
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--ink)]">Father&apos;s Business Radio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              KJV Scripture, prayer, devotion, and Bible preaching from reviewed public-domain or permission-approved sources.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
            <span className="rounded-lg border border-[var(--line)] bg-white px-3 py-2">{manifest.launchStatus}</span>
            <span>{reviewedTracks.length} reviewed programs</span>
          </div>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {manifest.stations.map((candidate) => (
          <button
            key={candidate.id}
            className={`min-h-20 rounded-lg border p-3 text-left ${candidate.id === station.id ? "border-[var(--green)] bg-[var(--green)] text-white" : "border-[var(--line)] bg-white text-[var(--ink)]"}`}
            onClick={() => changeStation(candidate.id)}
            type="button"
          >
            <span className="block text-sm font-semibold">{candidate.shortLabel}</span>
            <span className={`mt-1 block text-xs leading-5 ${candidate.id === station.id ? "text-white/75" : "text-[var(--muted)]"}`}>{candidate.description}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="min-w-0 rounded-lg border border-[var(--line)] bg-[var(--ink)] p-5 text-white shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase text-white/75">{station.title}</span>
            <Headphones size={20} className="text-[var(--gold-soft)]" />
          </div>

          {currentTrack ? (
            <>
              <div className="mt-10 min-h-32">
                <p className="text-sm font-semibold text-[var(--gold-soft)]">{currentTrack.segmentTitle}</p>
                <h2 className="mt-2 text-2xl font-semibold leading-tight">{currentTrack.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/70">{currentTrack.creator}</p>
                {currentTrack.passage && <p className="mt-1 text-sm font-semibold text-white/80">{currentTrack.passage}</p>}
              </div>

              <audio
                ref={audioRef}
                preload="metadata"
                src={currentTrack.audioUrl}
                onEnded={() => moveTrack(1)}
                onPause={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
                onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
                onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
              />

              <div className="mt-6">
                <input
                  aria-label="Program position"
                  className="h-2 w-full accent-[var(--gold)]"
                  max={duration || 1}
                  min={0}
                  onChange={(event) => seek(Number(event.target.value))}
                  step={1}
                  type="range"
                  value={Math.min(currentTime, duration || 1)}
                />
                <div className="mt-1 flex justify-between text-xs text-white/55">
                  <span>{formatTime(currentTime)}</span>
                  <span>{duration ? formatTime(duration) : currentTrack.durationLabel}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  aria-label="Shuffle"
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${shuffle ? "bg-[var(--gold)] text-[var(--ink)]" : "bg-white/10 text-white"}`}
                  onClick={() => setShuffle((value) => !value)}
                  title="Shuffle"
                  type="button"
                >
                  <Shuffle size={18} />
                </button>
                <button aria-label="Previous program" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10" onClick={() => moveTrack(-1)} title="Previous program" type="button">
                  <SkipBack size={20} />
                </button>
                <button aria-label={playing ? "Pause" : "Play"} className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--gold)] text-[var(--ink)]" onClick={() => void togglePlayback()} title={playing ? "Pause" : "Play"} type="button">
                  {playing ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
                </button>
                <button aria-label="Next program" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10" onClick={() => moveTrack(1)} title="Next program" type="button">
                  <SkipForward size={20} />
                </button>
                <label className="flex h-10 items-center gap-2 rounded-full bg-white/10 px-3" title="Volume">
                  <Volume2 size={17} />
                  <input aria-label="Volume" className="w-20 accent-[var(--gold)]" max={1} min={0} onChange={(event) => setVolume(Number(event.target.value))} step={0.05} type="range" value={volume} />
                </label>
              </div>

              {playbackMessage && <p className="mt-3 text-center text-xs font-semibold text-[var(--gold-soft)]">{playbackMessage}</p>}

              <div className="mt-6 border-t border-white/10 pt-4 text-xs leading-5 text-white/65">
                <p>{currentTrack.attribution}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span>{currentTrack.rightsLabel}</span>
                  <a className="inline-flex items-center gap-1 font-semibold text-[var(--gold-soft)]" href={currentTrack.sourceUrl} rel="noreferrer" target="_blank">
                    Official source <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-8 text-sm text-white/70">No reviewed programs are available in this station.</p>
          )}
        </section>

        <section className="min-w-0">
          <div className="flex items-end justify-between gap-3 border-b border-[var(--line)] pb-3">
            <div>
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">Up next</p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">{station.title}</h2>
            </div>
            <span className="text-xs font-semibold text-[var(--muted)]">{queue.length} programs</span>
          </div>
          <div className="mt-3 max-h-[610px] space-y-2 overflow-y-auto pr-1">
            {queue.map((track, index) => (
              <button
                key={`${station.id}-${track.id}`}
                className={`flex min-h-20 w-full items-center gap-3 rounded-lg border p-3 text-left ${index === activeIndex ? "border-[var(--green)] bg-[var(--warm)]" : "border-[var(--line)] bg-white"}`}
                onClick={() => chooseTrack(index)}
                type="button"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${index === activeIndex ? "bg-[var(--green)] text-white" : "bg-[var(--paper)] text-[var(--green)]"}`}>
                  {index === activeIndex && playing ? <Pause size={17} /> : <Play size={17} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--ink)]">{track.title}</span>
                  <span className="mt-1 block truncate text-xs text-[var(--muted)]">{track.segmentTitle} · {track.creator}</span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-[var(--muted)]">{track.durationLabel}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <footer className="mt-5 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]">
        Public beta catalog reviewed {manifest.reviewedAt}. Rights evidence and official source attribution remain attached to every program.
      </footer>
    </div>
  );
}
