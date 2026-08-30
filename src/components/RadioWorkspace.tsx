"use client";

import {
  CheckCircle2,
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
  coverage?: string;
  listeningMode?: string;
  markerStatus?: string;
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
  chapterMarkers?: ChapterMarker[];
};

type ChapterMarker = {
  book: string;
  chapter: number;
  startSeconds: number;
  endSeconds: number;
  status: "Estimated" | "Verified";
  method: string;
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
  chapterMarkers?: ChapterMarker[];
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
  chapterMarkers: ChapterMarker[];
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
      chapterMarkers: record.chapterMarkers ?? [],
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
    rightsLabel: record.rightsStatus === "Public Domain" ? "Public domain in the USA" : "Free public use with attribution",
    rightsEvidence: record.rightsEvidence,
    attribution: record.requiredAttribution ?? record.creator,
    chapterMarkers: record.chapterMarkers ?? [],
  };
}

const reviewedTracks = manifest.reviewedTracks
  .map(normalizedTrack)
  .filter((track): track is RadioTrack => Boolean(track));
const tracksById = new Map(reviewedTracks.map((track) => [track.id, track]));
const RADIO_PROGRESS_KEY = "fathers-business-radio-progress-v1";
const RADIO_LAST_STATION_KEY = "fathers-business-radio-last-station-v1";
const RADIO_COMPLETION_KEY = "fathers-business-radio-completion-v1";
const RADIO_PLAYLISTS_KEY = "fathers-business-radio-playlists-v1";

type RadioProgress = Record<string, { trackId: string; currentTime: number }>;
type RadioCompletion = Record<string, string[]>;
type PersonalPlaylist = { id: string; name: string; trackIds: string[] };

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
  const [completionByStation, setCompletionByStation] = useState<RadioCompletion>({});
  const [personalPlaylists, setPersonalPlaylists] = useState<PersonalPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [playlistMessage, setPlaylistMessage] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const savedProgressRef = useRef<RadioProgress>({});
  const pendingResumeSecondsRef = useRef<number | null>(null);
  const lastSavedSecondRef = useRef(-1);

  const station = manifest.stations.find((candidate) => candidate.id === stationId) ?? manifest.stations[0];
  const queue = useMemo(
    () => station.trackIds.map((trackId) => tracksById.get(trackId)).filter((track): track is RadioTrack => Boolean(track)),
    [station],
  );
  const currentTrack = queue[activeIndex] ?? queue[0] ?? null;
  const sequentialStation = station.listeningMode?.toLowerCase().includes("sequential") ?? false;
  const chapterMarkers = currentTrack?.chapterMarkers ?? [];
  const verifiedMarkerCount = chapterMarkers.filter((marker) => marker.status === "Verified").length;
  const chapterNavigationReady = chapterMarkers.length > 0 && verifiedMarkerCount === chapterMarkers.length;
  const completedTrackIdSet = useMemo(() => new Set(completionByStation[station.id] ?? []), [completionByStation, station.id]);
  const completedQueueCount = queue.filter((track) => completedTrackIdSet.has(track.id)).length;
  const playlistProgress = queue.length ? Math.round((completedQueueCount / queue.length) * 100) : 0;
  const selectedPlaylist = personalPlaylists.find((playlist) => playlist.id === selectedPlaylistId) ?? personalPlaylists[0] ?? null;
  const selectedPlaylistTracks = (selectedPlaylist?.trackIds ?? [])
    .map((trackId) => tracksById.get(trackId))
    .filter((track): track is RadioTrack => Boolean(track));

  useEffect(() => {
    let cancelled = false;
    try {
      const saved = JSON.parse(window.localStorage.getItem(RADIO_PROGRESS_KEY) ?? "{}") as RadioProgress;
      const savedCompletion = JSON.parse(window.localStorage.getItem(RADIO_COMPLETION_KEY) ?? "{}") as RadioCompletion;
      const savedPlaylistValue = JSON.parse(window.localStorage.getItem(RADIO_PLAYLISTS_KEY) ?? "[]") as unknown;
      const savedPlaylists = Array.isArray(savedPlaylistValue)
        ? savedPlaylistValue.filter(
          (playlist): playlist is PersonalPlaylist =>
            Boolean(playlist) &&
            typeof playlist.id === "string" &&
            typeof playlist.name === "string" &&
            Array.isArray(playlist.trackIds) &&
            playlist.trackIds.every((trackId: unknown) => typeof trackId === "string"),
        )
        : [];
      savedProgressRef.current = saved;
      const savedStationId = window.localStorage.getItem(RADIO_LAST_STATION_KEY);
      const savedStation = manifest.stations.find((candidate) => candidate.id === savedStationId && saved[candidate.id]);
      queueMicrotask(() => {
        if (cancelled) return;
        setCompletionByStation(savedCompletion);
        setPersonalPlaylists(savedPlaylists);
        setSelectedPlaylistId(savedPlaylists[0]?.id ?? "");
        if (!savedStation) return;
        const position = saved[savedStation.id];
        const savedIndex = savedStation.trackIds.indexOf(position.trackId);
        pendingResumeSecondsRef.current = Math.max(0, position.currentTime || 0);
        setStationId(savedStation.id);
        setActiveIndex(savedIndex >= 0 ? savedIndex : 0);
        if (position.currentTime > 5) setPlaybackMessage(`Ready to resume at ${formatTime(position.currentTime)}.`);
      });
    } catch {
      savedProgressRef.current = {};
    }
    return () => {
      cancelled = true;
    };
  }, []);

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

  function saveProgress(nextStationId: string, trackId: string, nextTime: number) {
    const nextProgress = {
      ...savedProgressRef.current,
      [nextStationId]: { trackId, currentTime: Math.max(0, nextTime) },
    };
    savedProgressRef.current = nextProgress;
    try {
      window.localStorage.setItem(RADIO_PROGRESS_KEY, JSON.stringify(nextProgress));
      window.localStorage.setItem(RADIO_LAST_STATION_KEY, nextStationId);
    } catch {
      // Radio playback remains usable when browser storage is unavailable.
    }
  }

  function markTrackComplete(nextStationId: string, trackId: string) {
    setCompletionByStation((current) => {
      const stationCompletion = current[nextStationId] ?? [];
      if (stationCompletion.includes(trackId)) return current;
      const nextCompletion = {
        ...current,
        [nextStationId]: [...stationCompletion, trackId],
      };
      try {
        window.localStorage.setItem(RADIO_COMPLETION_KEY, JSON.stringify(nextCompletion));
      } catch {
        // Completion tracking is optional when browser storage is unavailable.
      }
      return nextCompletion;
    });
  }

  function savePersonalPlaylists(nextPlaylists: PersonalPlaylist[]) {
    setPersonalPlaylists(nextPlaylists);
    try {
      window.localStorage.setItem(RADIO_PLAYLISTS_KEY, JSON.stringify(nextPlaylists));
      return true;
    } catch {
      setPlaylistMessage("This browser could not save the playlist locally.");
      return false;
    }
  }

  function createPersonalPlaylist() {
    const name = playlistName.trim().replace(/\s+/g, " ");
    if (!name) {
      setPlaylistMessage("Enter a playlist name first.");
      return;
    }
    if (personalPlaylists.some((playlist) => playlist.name.toLowerCase() === name.toLowerCase())) {
      setPlaylistMessage("A playlist with that name already exists.");
      return;
    }
    const nextPlaylist = { id: `playlist-${Date.now()}`, name, trackIds: [] };
    const saved = savePersonalPlaylists([...personalPlaylists, nextPlaylist]);
    setSelectedPlaylistId(nextPlaylist.id);
    setPlaylistName("");
    if (saved) setPlaylistMessage(`${name} created.`);
  }

  function addCurrentTrackToPlaylist() {
    if (!selectedPlaylist || !currentTrack) return;
    if (selectedPlaylist.trackIds.includes(currentTrack.id)) {
      setPlaylistMessage(`${currentTrack.segmentTitle} is already in ${selectedPlaylist.name}.`);
      return;
    }
    const saved = savePersonalPlaylists(
      personalPlaylists.map((playlist) =>
        playlist.id === selectedPlaylist.id ? { ...playlist, trackIds: [...playlist.trackIds, currentTrack.id] } : playlist,
      ),
    );
    if (saved) setPlaylistMessage(`${currentTrack.segmentTitle} added to ${selectedPlaylist.name}.`);
  }

  function playSavedTrack(trackId: string) {
    const targetStation = manifest.stations.find((candidate) => candidate.id !== "mix" && candidate.trackIds.includes(trackId))
      ?? manifest.stations.find((candidate) => candidate.trackIds.includes(trackId));
    if (!targetStation) {
      setPlaylistMessage("That program is no longer available in the reviewed catalog.");
      return;
    }
    if (currentTrack) saveProgress(station.id, currentTrack.id, audioRef.current?.currentTime ?? currentTime);
    audioRef.current?.pause();
    const nextIndex = targetStation.trackIds.indexOf(trackId);
    pendingResumeSecondsRef.current = 0;
    setStationId(targetStation.id);
    setActiveIndex(nextIndex);
    setPlaying(false);
    setPlayRequested(true);
    if (targetStation.listeningMode?.toLowerCase().includes("sequential")) setShuffle(false);
    saveProgress(targetStation.id, trackId, 0);
    setPlaylistMessage(`Opening ${tracksById.get(trackId)?.segmentTitle ?? "saved program"}.`);
  }

  function changeStation(nextStationId: string) {
    if (currentTrack) saveProgress(station.id, currentTrack.id, audioRef.current?.currentTime ?? currentTime);
    audioRef.current?.pause();
    const nextStation = manifest.stations.find((candidate) => candidate.id === nextStationId) ?? manifest.stations[0];
    const savedPosition = savedProgressRef.current[nextStationId];
    const savedIndex = savedPosition ? nextStation.trackIds.indexOf(savedPosition.trackId) : -1;
    pendingResumeSecondsRef.current = savedPosition?.currentTime ?? 0;
    setStationId(nextStation.id);
    setActiveIndex(savedIndex >= 0 ? savedIndex : 0);
    setPlaying(false);
    setPlayRequested(false);
    if (nextStation.listeningMode?.toLowerCase().includes("sequential")) setShuffle(false);
    setPlaybackMessage(savedPosition?.currentTime > 5 ? `Ready to resume at ${formatTime(savedPosition.currentTime)}.` : "");
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (playing) {
      saveProgress(station.id, currentTrack.id, audio.currentTime);
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
    if (currentTrack) saveProgress(station.id, currentTrack.id, audioRef.current?.currentTime ?? currentTime);
    const nextTrack = queue[index];
    pendingResumeSecondsRef.current = 0;
    if (nextTrack) saveProgress(station.id, nextTrack.id, 0);
    setPlayRequested(true);
    setActiveIndex(index);
  }

  function moveTrack(direction: -1 | 1) {
    if (!queue.length) return;
    if (currentTrack) saveProgress(station.id, currentTrack.id, audioRef.current?.currentTime ?? currentTime);
    const nextIndex = shuffle && !sequentialStation
      ? (activeIndex * 7 + 3 + queue.length) % queue.length
      : (activeIndex + direction + queue.length) % queue.length;
    const nextTrack = queue[nextIndex];
    pendingResumeSecondsRef.current = 0;
    if (nextTrack) saveProgress(station.id, nextTrack.id, 0);
    setPlayRequested(true);
    setActiveIndex(nextIndex);
  }

  function handleTrackEnded() {
    if (!currentTrack) return;
    markTrackComplete(station.id, currentTrack.id);
    saveProgress(station.id, currentTrack.id, duration || currentTime);
    if (sequentialStation && activeIndex === queue.length - 1) {
      setPlayRequested(false);
      setPlaying(false);
      setPlaybackMessage(`${station.coverage ?? station.title} listening complete.`);
      return;
    }
    moveTrack(1);
  }

  function completeCurrentTrack() {
    if (!currentTrack) return;
    markTrackComplete(station.id, currentTrack.id);
    setPlaybackMessage(`${currentTrack.segmentTitle} marked complete.`);
  }

  function seek(nextTime: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  async function playChapter(marker: ChapterMarker) {
    const audio = audioRef.current;
    if (!audio || !currentTrack || !chapterNavigationReady) return;
    pendingResumeSecondsRef.current = null;
    audio.currentTime = marker.startSeconds;
    setCurrentTime(marker.startSeconds);
    saveProgress(station.id, currentTrack.id, marker.startSeconds);
    setPlayRequested(true);
    try {
      await audio.play();
      setPlaying(true);
      setPlaybackMessage(`Playing ${marker.book} ${marker.chapter}.`);
    } catch {
      setPlaying(false);
      setPlaybackMessage("Chapter playback needs one more tap in this browser.");
    }
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
          {(station.coverage || station.listeningMode) && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-white/75">
              {station.coverage && <span className="rounded-full bg-white/10 px-3 py-1.5">Coverage: {station.coverage}</span>}
              {station.listeningMode && <span className="rounded-full bg-white/10 px-3 py-1.5">{station.listeningMode}</span>}
            </div>
          )}
          {station.markerStatus && (
            <p className="mt-3 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-3 py-2 text-xs leading-5 text-[var(--gold-soft)]">
              {station.markerStatus}
            </p>
          )}

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
                onEnded={handleTrackEnded}
                onPause={() => setPlaying(false)}
                onPlay={() => setPlaying(true)}
                onLoadedMetadata={(event) => {
                  const loadedDuration = event.currentTarget.duration || 0;
                  setDuration(loadedDuration);
                  const resumeSeconds = pendingResumeSecondsRef.current ?? 0;
                  if (resumeSeconds > 0 && resumeSeconds < loadedDuration - 2) {
                    event.currentTarget.currentTime = resumeSeconds;
                    setCurrentTime(resumeSeconds);
                  }
                  pendingResumeSecondsRef.current = null;
                }}
                onTimeUpdate={(event) => {
                  const nextTime = event.currentTarget.currentTime;
                  setCurrentTime(nextTime);
                  const nextSecond = Math.floor(nextTime);
                  if (nextSecond > 0 && nextSecond % 5 === 0 && nextSecond !== lastSavedSecondRef.current) {
                    lastSavedSecondRef.current = nextSecond;
                    saveProgress(station.id, currentTrack.id, nextTime);
                  }
                }}
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

              {chapterMarkers.length > 0 && (
                <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Chapter selection</p>
                    <span className="text-xs font-semibold text-white/55">
                      {verifiedMarkerCount} of {chapterMarkers.length} markers verified
                    </span>
                  </div>
                  {chapterNavigationReady ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {chapterMarkers.map((marker) => (
                        <button
                          key={`${currentTrack.id}-${marker.book}-${marker.chapter}`}
                          className="min-h-10 rounded-full bg-white/10 px-4 text-sm font-semibold text-white hover:bg-[var(--gold)] hover:text-[var(--ink)]"
                          onClick={() => void playChapter(marker)}
                          type="button"
                        >
                          {marker.book} {marker.chapter}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-[var(--gold-soft)]">
                      Chapter buttons stay locked until every marker in this recording is manually verified by ear.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  aria-label={sequentialStation ? "Shuffle unavailable for sequential Bible listening" : "Shuffle"}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${sequentialStation ? "cursor-not-allowed bg-white/5 text-white/30" : shuffle ? "bg-[var(--gold)] text-[var(--ink)]" : "bg-white/10 text-white"}`}
                  disabled={sequentialStation}
                  onClick={() => setShuffle((value) => !value)}
                  title={sequentialStation ? "Sequential Bible listening keeps canonical order" : "Shuffle"}
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
          {sequentialStation && (
            <div className="mt-3 rounded-lg border border-[var(--line)] bg-white p-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-[var(--muted)]">
                <div>
                  <span className="block">Playlist progress</span>
                  <span className="mt-1 block">{completedQueueCount} of {queue.length} programs completed</span>
                </div>
                {currentTrack && (
                  <button
                    className="min-h-9 rounded-full border border-[var(--line)] px-3 text-xs font-semibold text-[var(--green)] disabled:cursor-default disabled:text-[var(--muted)]"
                    disabled={completedTrackIdSet.has(currentTrack.id)}
                    onClick={completeCurrentTrack}
                    type="button"
                  >
                    {completedTrackIdSet.has(currentTrack.id) ? "Completed" : "Mark current complete"}
                  </button>
                )}
              </div>
              <div
                aria-label={`${station.title} playlist progress`}
                aria-valuemax={queue.length}
                aria-valuemin={0}
                aria-valuenow={completedQueueCount}
                className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--paper)]"
                role="progressbar"
              >
                <span className="block h-full rounded-full bg-[var(--green)] transition-[width]" style={{ width: `${playlistProgress}%` }} />
              </div>
            </div>
          )}
          <div className="mt-3 max-h-[610px] space-y-2 overflow-y-auto pr-1">
            {queue.map((track, index) => (
              <button
                key={`${station.id}-${track.id}`}
                className={`flex min-h-20 w-full items-center gap-3 rounded-lg border p-3 text-left ${index === activeIndex ? "border-[var(--green)] bg-[var(--warm)]" : "border-[var(--line)] bg-white"}`}
                onClick={() => chooseTrack(index)}
                type="button"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${index === activeIndex ? "bg-[var(--green)] text-white" : "bg-[var(--paper)] text-[var(--green)]"}`}>
                  {completedTrackIdSet.has(track.id) ? <CheckCircle2 aria-label="Completed" size={18} /> : index === activeIndex && playing ? <Pause size={17} /> : <Play size={17} />}
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

      <section aria-labelledby="personal-playlists-heading" className="mt-5 rounded-lg border border-[var(--line)] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--green)]">Listen your way</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]" id="personal-playlists-heading">My listening playlists</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Create named collections for Bible listening, sermon preparation, hymns, or teaching.</p>
          </div>
          <span className="text-xs font-semibold text-[var(--muted)]">Saved locally in this browser</span>
        </div>

        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            createPersonalPlaylist();
          }}
        >
          <label className="min-w-0 flex-1">
            <span className="sr-only">New playlist name</span>
            <input
              aria-label="New playlist name"
              className="min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
              maxLength={60}
              onChange={(event) => setPlaylistName(event.target.value)}
              placeholder="Example: Sunday sermon preparation"
              value={playlistName}
            />
          </label>
          <button className="min-h-11 rounded-lg bg-[var(--green)] px-4 text-sm font-semibold text-white" type="submit">Create playlist</button>
        </form>

        {personalPlaylists.length ? (
          <div className="mt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1 text-xs font-semibold text-[var(--muted)]">
                Saved playlist
                <select
                  aria-label="Saved playlist"
                  className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm text-[var(--ink)]"
                  onChange={(event) => {
                    setSelectedPlaylistId(event.target.value);
                    setPlaylistMessage("");
                  }}
                  value={selectedPlaylist?.id ?? ""}
                >
                  {personalPlaylists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.name}</option>)}
                </select>
              </label>
              <button
                className="min-h-11 rounded-lg border border-[var(--green)] px-4 text-sm font-semibold text-[var(--green)] disabled:cursor-default disabled:border-[var(--line)] disabled:text-[var(--muted)]"
                disabled={!currentTrack || Boolean(selectedPlaylist?.trackIds.includes(currentTrack.id))}
                onClick={addCurrentTrackToPlaylist}
                type="button"
              >
                {currentTrack && selectedPlaylist?.trackIds.includes(currentTrack.id) ? "Current program saved" : "Add current program"}
              </button>
            </div>

            {playlistMessage && <p aria-live="polite" className="mt-3 text-sm font-semibold text-[var(--green)]">{playlistMessage}</p>}

            {selectedPlaylistTracks.length ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {selectedPlaylistTracks.map((track) => (
                  <button
                    key={`${selectedPlaylist?.id}-${track.id}`}
                    className="flex min-h-16 items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3 text-left"
                    onClick={() => playSavedTrack(track.id)}
                    type="button"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--green)] text-white"><Play size={16} /></span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[var(--ink)]">{track.segmentTitle}</span>
                      <span className="mt-1 block truncate text-xs text-[var(--muted)]">{track.title}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-[var(--paper)] p-3 text-sm text-[var(--muted)]">This playlist is empty. Choose a program above, then add the current program.</p>
            )}
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-[var(--paper)] p-3 text-sm text-[var(--muted)]">No personal playlists yet. Create one to begin collecting programs.</p>
        )}
      </section>

      <footer className="mt-5 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)]">
        Public beta catalog reviewed {manifest.reviewedAt}. Rights evidence and official source attribution remain attached to every program.
      </footer>
    </div>
  );
}
