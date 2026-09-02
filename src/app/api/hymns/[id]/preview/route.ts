import verifiedHymnsData from "../../../../../../data/hymns/verified-hymns.json";

export const runtime = "nodejs";

const PREVIEW_SECONDS = 18;
const CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

type VerifiedHymn = {
  id: string;
  title: string;
  tune: string;
  notes: Array<{ time: number; duration: number; midi: number; velocity: number }>;
  musicRights: string;
  musicAttribution: string;
  musicSourceUrl: string;
};

const verifiedHymns = verifiedHymnsData as VerifiedHymn[];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const hymn = verifiedHymns.find((entry) => entry.id === id);
  const requestedVoice = new URL(request.url).searchParams.get("voice") ?? "melody";

  if (!hymn) {
    return Response.json({ error: "Reviewed hymn preview not found." }, { status: 404 });
  }
  if (requestedVoice !== "melody" && requestedVoice !== "full") {
    return Response.json({ error: "Preview voice must be melody or full." }, { status: 400 });
  }

  const previewNotes = hymn.notes
    .filter((note) => note.time < PREVIEW_SECONDS)
    .map((note) => ({ ...note, duration: Math.min(note.duration, PREVIEW_SECONDS - note.time) }));
  const notes = requestedVoice === "full"
    ? previewNotes
    : [...previewNotes.reduce((highestByStart, note) => {
        const current = highestByStart.get(note.time);
        if (!current || note.midi > current.midi) highestByStart.set(note.time, note);
        return highestByStart;
      }, new Map<number, (typeof previewNotes)[number]>()).values()]
        .sort((left, right) => left.time - right.time || left.midi - right.midi);

  return Response.json(
    {
      id: hymn.id,
      title: hymn.title,
      tune: hymn.tune,
      voice: requestedVoice,
      durationSeconds: PREVIEW_SECONDS,
      notes,
      musicRights: hymn.musicRights,
      musicAttribution: hymn.musicAttribution,
      musicSourceUrl: hymn.musicSourceUrl,
    },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
