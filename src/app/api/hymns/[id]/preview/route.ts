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
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const hymn = verifiedHymns.find((entry) => entry.id === id);

  if (!hymn) {
    return Response.json({ error: "Reviewed hymn preview not found." }, { status: 404 });
  }

  const notes = hymn.notes
    .filter((note) => note.time < PREVIEW_SECONDS)
    .map((note) => ({ ...note, duration: Math.min(note.duration, PREVIEW_SECONDS - note.time) }));

  return Response.json(
    {
      id: hymn.id,
      title: hymn.title,
      tune: hymn.tune,
      durationSeconds: PREVIEW_SECONDS,
      notes,
      musicRights: hymn.musicRights,
      musicAttribution: hymn.musicAttribution,
      musicSourceUrl: hymn.musicSourceUrl,
    },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  );
}
