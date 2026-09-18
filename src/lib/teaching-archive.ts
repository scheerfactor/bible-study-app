/** Historical events are immutable; editable working copies live in Prepare to Teach. */
export type ArchiveSource = {
  id: string; title: string; passage: string; theme: string; kind: string;
  illustrations: string; quotes: string; createdAt: string; updatedAt: string;
  lessonPlan?: { date: string }; slides: { title: string; subtitle: string; body: string; bibleText: string }[];
  ministryMessageId?: string; reusedFromEventId?: string;
  churchLocation?: string; audience?: string; deliveryDate?: string;
};
export type DeliveryDetails = { date: string; location: string; audience: string; deliveredNotes: string; reflection: string };
export type TeachingEvent<T extends ArchiveSource = ArchiveSource> = {
  schemaVersion: 1; id: string; messageId: string; sourceEventId: string | null;
  recordedAt: string; delivery: DeliveryDetails; snapshot: T;
};
export type DeliveryAddendum = { id: string; eventId: string; createdAt: string; body: string };
export type TeachingArchive<T extends ArchiveSource = ArchiveSource> = { events: TeachingEvent<T>[]; addenda: DeliveryAddendum[] };
export const emptyArchive = <T extends ArchiveSource>(): TeachingArchive<T> => ({ events: [], addenda: [] });
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export function validDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}
export function archiveKey(scope: string) { return `bible-study-teaching-archive-v1:${scope}`; }
export function createTeachingEvent<T extends ArchiveSource>(snapshot: T, delivery: DeliveryDetails): TeachingEvent<T> {
  if (!snapshot.title.trim()) throw new Error('Add a lesson or sermon title first.');
  if (!validDate(delivery.date)) throw new Error('Enter the actual teaching date.');
  if (!delivery.location.trim()) throw new Error('Enter the church or location.');
  return {
    schemaVersion: 1, id: crypto.randomUUID(), messageId: snapshot.ministryMessageId || crypto.randomUUID(),
    sourceEventId: snapshot.reusedFromEventId || null, recordedAt: new Date().toISOString(),
    delivery: structuredClone(delivery), snapshot: structuredClone(snapshot),
  };
}
/** Strict boundary: malformed backups must not silently discard historical records. */
export function parseArchive<T extends ArchiveSource>(value: unknown): TeachingArchive<T> {
  if (!object(value) || !Array.isArray(value.events) || !Array.isArray(value.addenda)) throw new Error('Invalid archive file.');
  for (const event of value.events) {
    if (!object(event) || event.schemaVersion !== 1 || typeof event.id !== 'string' || !uuid.test(event.id) ||
      typeof event.messageId !== 'string' || !uuid.test(event.messageId) ||
      !(event.sourceEventId === null || (typeof event.sourceEventId === 'string' && uuid.test(event.sourceEventId))) ||
      typeof event.recordedAt !== 'string' || !Number.isFinite(Date.parse(event.recordedAt)) ||
      !object(event.delivery) || !['date', 'location', 'audience', 'deliveredNotes', 'reflection'].every(k => typeof (event.delivery as Record<string, unknown>)[k] === 'string') ||
      !validDate(event.delivery.date as string) || !(event.delivery.location as string).trim() ||
      !object(event.snapshot) || !['id','title','passage','theme','kind','illustrations','quotes','createdAt','updatedAt'].every(k => typeof (event.snapshot as Record<string, unknown>)[k] === 'string') ||
      !Array.isArray(event.snapshot.slides) || !event.snapshot.slides.every(s => object(s) && ['title','subtitle','body','bibleText'].every(k => typeof s[k] === 'string'))) {
      throw new Error('Invalid historical event. Nothing was imported.');
    }
  }
  const textFields = ['title','passage','theme','seriesId','status','outline','introduction','points','illustrations','applications','conclusion','invitation','importedStudyNotes','quotes','bulletManuscript','scheduledFor','service','specialDay','preachedAt','churchLocation','audience','deliveryDate','slideTheme'];
  for (const event of value.events) {
    const snapshot = event.snapshot;
    if (textFields.some(key => snapshot[key] !== undefined && typeof snapshot[key] !== 'string') ||
        (snapshot.sectionOrder !== undefined && (!Array.isArray(snapshot.sectionOrder) || !snapshot.sectionOrder.every((s: unknown) => typeof s === 'string'))) ||
        (snapshot.targetMinutes !== undefined && (typeof snapshot.targetMinutes !== 'number' || !Number.isFinite(snapshot.targetMinutes))) ||
        snapshot.slides.some((slide: Record<string, unknown>) => Object.values(slide).some(v => !['string','number','boolean'].includes(typeof v))))
      throw new Error('Invalid prepared lesson fields. Nothing was imported.');
  }
  for (const note of value.addenda) {
    if (!object(note) || typeof note.id !== 'string' || !uuid.test(note.id) || typeof note.eventId !== 'string' ||
      !value.events.some(e => e.id === note.eventId) || typeof note.body !== 'string' || !note.body.trim() ||
      typeof note.createdAt !== 'string' || !Number.isFinite(Date.parse(note.createdAt))) throw new Error('Invalid delivery note. Nothing was imported.');
  }
  const archive = value as TeachingArchive<T>;
  return { events: mergeImmutable([], archive.events), addenda: mergeImmutable([], archive.addenda) };
}
// Canonical comparison survives JSONB key reordering without changing original content.
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (object(value)) return `{${Object.keys(value).sort().filter(k => value[k] !== undefined).map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function mergeImmutable<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const records = new Map(existing.map(item => [item.id, item]));
  for (const item of incoming) {
    const prior = records.get(item.id);
    if (prior && canonical(prior) !== canonical(item)) throw new Error('A historical record with this ID has different content. Restore stopped; originals are unchanged.');
    if (!prior) records.set(item.id, structuredClone(item));
  }
  return [...records.values()];
}
export function mergeArchives<T extends ArchiveSource>(a: TeachingArchive<T>, b: TeachingArchive<T>): TeachingArchive<T> {
  return { events: mergeImmutable(a.events, b.events), addenda: mergeImmutable(a.addenda, b.addenda) };
}
function searchable(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(searchable).join(' ');
  if (object(value)) return Object.values(value).map(searchable).join(' ');
  return '';
}
const normalized = (text: string) => text.toLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
export function matchesArchive(event: TeachingEvent, query: string, notes: DeliveryAddendum[] = []): boolean {
  const text = normalized(searchable([event.snapshot, event.delivery, notes.filter(n => n.eventId === event.id)]));
  return normalized(query).split(' ').filter(Boolean).every(term => text.includes(term));
}
export function reuseTeachingEvent<T extends ArchiveSource>(event: TeachingEvent<T>): T {
  const now = new Date().toISOString();
  const snapshot = structuredClone(event.snapshot);
  return { ...snapshot, id: crypto.randomUUID(), ministryMessageId: event.messageId, reusedFromEventId: event.id,
    title: `${snapshot.title} — revised copy`, status: 'Draft', archived: false, preachedAt: '', scheduledFor: '',
    deliveryDate: '', churchLocation: '', audience: '', specialDay: '',
    ...(snapshot.lessonPlan ? { lessonPlan: { ...snapshot.lessonPlan, date: '' } } : {}), createdAt: now, updatedAt: now };
}
/** Parents first, independent of device clock skew. Missing history is never fabricated. */
export function eventsInSourceOrder<T extends ArchiveSource>(events: TeachingEvent<T>[]): TeachingEvent<T>[] {
  const ordered: TeachingEvent<T>[] = [], visiting = new Set<string>(), visited = new Set<string>();
  const byId = new Map(events.map(e => [e.id, e]));
  function visit(event: TeachingEvent<T>) {
    if (visited.has(event.id)) return;
    if (visiting.has(event.id)) throw new Error('Archive lineage contains a cycle.');
    visiting.add(event.id);
    if (event.sourceEventId) {
      const parent = byId.get(event.sourceEventId);
      if (!parent || parent.messageId !== event.messageId) throw new Error('Restore the source teaching event before syncing this revised version.');
      visit(parent);
    }
    visiting.delete(event.id); visited.add(event.id); ordered.push(event);
  }
  events.forEach(visit); return ordered;
}
