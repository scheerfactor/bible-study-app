'use client';
import { useEffect, useRef, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createTeachingEvent, eventsInSourceOrder, emptyArchive, matchesArchive, mergeArchives, parseArchive, reuseTeachingEvent, type ArchiveSource, type DeliveryDetails, type TeachingArchive as ArchiveData, type TeachingEvent } from '@/lib/teaching-archive';
import { appendArchive, readArchive } from '@/lib/teaching-archive-storage';
import type { RecordTeachingArchiveArgs, AppendTeachingDeliveryNoteArgs } from '@/types/teaching-archive-database';
import { offlinePresentationHtml } from '@/lib/offline-presentation';

function download(name: string, data: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const button = 'min-h-11 rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--green)] disabled:opacity-40';
const input = 'mt-1 w-full rounded-xl border border-[var(--line)] bg-white p-3 text-[var(--ink)]';
export default function TeachingArchive<T extends ArchiveSource>({ scope, userId, supabase, draft, onReuse, onRecorded, onMetadataChange, showLog }: {
  scope: string; userId?: string; supabase: SupabaseClient | null; draft: T;
  onReuse: (draft: T) => void; onRecorded: (event: TeachingEvent<T>) => void;
  onMetadataChange: (patch: Partial<T>) => void; showLog: boolean;
}) {
  const [archive, setArchive] = useState<ArchiveData<T>>(emptyArchive);
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [deliveryDrafts, setDeliveryDrafts] = useState<Record<string, { notes: string; reflection: string }>>({});
  const deliveryNotes = deliveryDrafts[draft.id]?.notes || '';
  const reflection = deliveryDrafts[draft.id]?.reflection || '';
  const setDeliveryNotes = (notes: string) => setDeliveryDrafts(all => ({ ...all, [draft.id]: { notes, reflection } }));
  const setReflection = (value: string) => setDeliveryDrafts(all => ({ ...all, [draft.id]: { notes: deliveryNotes, reflection: value } }));
  const [addendum, setAddendum] = useState('');
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const importInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    mounted.current = true;
    const refresh = () => { try { setArchive(readArchive<T>(scope)); } catch { setMessage('Archive could not be read. Existing data was not replaced. Restore a valid backup in a separate browser before proceeding.'); } };
    refresh(); window.addEventListener('storage', refresh);
    return () => { mounted.current = false; window.removeEventListener('storage', refresh); };
  }, [scope]);
  const selected = archive.events.find(e => e.id === selectedId);
  const source = archive.events.find(e => e.id === draft.reusedFromEventId);
  const results = archive.events.filter(e => matchesArchive(e, query, archive.addenda) &&
    (!location || e.delivery.location.toLowerCase().includes(location.toLowerCase())) &&
    (!dateFrom || e.delivery.date >= dateFrom) && (!dateTo || e.delivery.date <= dateTo))
    .sort((a, b) => b.delivery.date.localeCompare(a.delivery.date) || b.recordedAt.localeCompare(a.recordedAt));
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await action(); } catch (error) { if (mounted.current) setMessage(error instanceof Error ? error.message : 'Archive action failed. Original records remain intact.'); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function logDelivery() {
    await run(async () => {
      const delivery: DeliveryDetails = { date: draft.deliveryDate || '', location: draft.churchLocation || '', audience: draft.audience || '', deliveredNotes: deliveryNotes, reflection };
      const event = createTeachingEvent(draft, delivery);
      // A second click after successful logging must not create a duplicate occasion.
      const existing = readArchive<T>(scope).events.find(e => e.snapshot.id === draft.id && e.delivery.date === delivery.date && e.delivery.location === delivery.location);
      if (existing) { setSelectedId(existing.id); throw new Error('This draft is already logged for this date and location. Add a delivery note below, or create a revised copy for another occasion.'); }
      const saved = await appendArchive(scope, { events: [event], addenda: [] });
      if (!mounted.current) return;
      setArchive(saved); setSelectedId(event.id); onRecorded(event);
      setMessage('Historical version saved on this device. Notes, quotes, illustrations and slides are preserved. Export an archive backup or sync your signed-in account.');
    });
  }
  async function sync() {
    await run(async () => {
      if (!supabase || !userId) throw new Error('Sign in to sync this account’s archive. Guest records stay on this device; export and restore them after signing in if desired.');
      const auth = await supabase.auth.getUser();
      if (auth.error || auth.data.user?.id !== userId) throw new Error('Account changed. Reopen the archive before syncing.');
      const events: TeachingEvent<T>[] = [];
      const notes: ArchiveData<T>['addenda'] = [];
      for (let offset = 0; ; offset += 200) {
        const { data, error } = await supabase.from('preaching_events').select('prepared_snapshot').eq('user_id', userId).eq('prepared_snapshot->>schemaVersion', '1').order('id').range(offset, offset + 199);
        if (error) throw new Error(`Cloud archive unavailable: ${error.message}. Local history is safe; retry after the archive migration is installed.`);
        events.push(...(data ?? []).map(row => row.prepared_snapshot as TeachingEvent<T>));
        if ((data?.length ?? 0) < 200) break;
      }
      for (let offset = 0; ; offset += 200) {
        const { data, error } = await supabase.from('preaching_event_addenda').select('id,event_id,created_at,body').eq('user_id', userId).order('id').range(offset, offset + 199);
        if (error) throw error;
        notes.push(...(data ?? []).map(n => ({ id: n.id, eventId: n.event_id, createdAt: new Date(n.created_at).toISOString(), body: n.body })));
        if ((data?.length ?? 0) < 200) break;
      }
      if (!mounted.current) return;
      const merged = mergeArchives(readArchive<T>(scope), parseArchive<T>({ events, addenda: notes }));
      // No upserts: the RPC rejects a differing payload for an existing historical ID.
      for (const event of eventsInSourceOrder(merged.events)) {
        if (!mounted.current) return;
        const { error } = await supabase.rpc('record_teaching_archive_event', { record: event } satisfies RecordTeachingArchiveArgs);
        if (error) throw new Error(`Sync incomplete: ${error.message}. Local records are safe; retry sync.`);
      }
      for (const note of merged.addenda) {
        if (!mounted.current) return;
        const { error } = await supabase.rpc('append_teaching_delivery_note', { note } satisfies AppendTeachingDeliveryNoteArgs);
        if (error) throw new Error(`Delivery-note sync incomplete: ${error.message}. Retry sync.`);
      }
      const saved = await appendArchive(scope, merged);
      if (mounted.current) { setArchive(saved); setMessage('Archive synced with your account. Historical records were merged without overwriting.'); }
    });
  }
  function reuse(event: TeachingEvent<T>) { setMessage(''); onReuse(reuseTeachingEvent(event)); }
  return <section aria-label="Sermon and Lesson Archive" className="space-y-4 rounded-3xl border border-[var(--line)] bg-[var(--paper)] p-4 md:p-6">
    <h2 className="text-2xl font-semibold">Sermon / Lesson Archive</h2>
    <p className="text-sm text-[var(--muted)]">Keep the version you taught. Create a revised copy to change illustrations, quotes, notes or slides for another occasion. {userId ? 'Private to this account on this device.' : 'Guest archive on this device.'}</p>
    {showLog && source && <details open className="space-y-3 rounded-xl border border-[var(--line)] p-3">
      <summary className="cursor-pointer font-semibold">Refresh illustrations and quotes for this copy</summary>
      <p className="text-sm">Source: {source.delivery.date} at {source.delivery.location}. Edit below to replace material, or keep both. Include source and rights notes for new quotations.</p>
      {(['illustrations', 'quotes'] as const).map(field => <div key={field}>
        <label className="block">{field === 'illustrations' ? 'Current illustrations / stories' : 'Current quotes and citations'}<textarea aria-label={field === 'illustrations' ? 'Current illustrations / stories' : 'Current quotes and citations'} className={input} value={draft[field]} onChange={e => onMetadataChange({ [field]: e.target.value } as Partial<T>)} /></label>
        <details><summary className="cursor-pointer text-sm">Previously taught {field}</summary><p className="whitespace-pre-wrap text-sm">{source.snapshot[field] || 'None recorded.'}</p></details>
        <div className="mt-2 flex flex-wrap gap-2"><button className={button} type="button" onClick={() => onMetadataChange({ [field]: source.snapshot[field] } as Partial<T>)}>Restore previous {field}</button><button className={button} type="button" disabled={!source.snapshot[field] || draft[field].includes(source.snapshot[field])} onClick={() => onMetadataChange({ [field]: [source.snapshot[field], draft[field]].filter(Boolean).join('\n\n') } as Partial<T>)}>Keep both {field}</button></div>
      </div>)}
    </details>}
    {showLog && <details open key={draft.id}>
      <summary className="cursor-pointer py-2 font-semibold">Log this sermon or lesson as taught</summary>
      <p className="my-2 text-sm">Review the current notes and slides first. The archive preserves these prepared materials exactly; record anything said differently below.</p>
      <div className="grid gap-3 md:grid-cols-3">
        <label>Actual teaching date<input aria-label="Actual teaching date" type="date" className={input} value={draft.deliveryDate || ''} onChange={e => onMetadataChange({ deliveryDate: e.target.value } as Partial<T>)} /></label>
        <label>Church / location<input className={input} value={draft.churchLocation || ''} onChange={e => onMetadataChange({ churchLocation: e.target.value } as Partial<T>)} /></label>
        <label>Audience<input className={input} value={draft.audience || ''} onChange={e => onMetadataChange({ audience: e.target.value } as Partial<T>)} /></label>
      </div>
      <label className="mt-3 block">What I actually said / spontaneous additions<textarea className={input} value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} /></label>
      <label className="mt-3 block">Review / what to improve next time<textarea className={input} value={reflection} onChange={e => setReflection(e.target.value)} /></label>
      <button type="button" className={button} disabled={busy} onClick={() => void logDelivery()}>Preserve taught version</button>
    </details>}
    <div className="flex flex-wrap gap-2">
      <button type="button" className={button} disabled={busy || !userId} onClick={() => void sync()}>Sync archive with my account</button>
      <button type="button" className={button} onClick={() => void run(async () => { download('ministry-archive.json', JSON.stringify(readArchive<T>(scope), null, 2), 'application/json'); setMessage('Private archive backup downloaded, including delivery notes.'); })}>Export archive backup</button>
      <button type="button" className={button} disabled={busy} onClick={() => importInput.current?.click()}>Restore archive backup</button>
      <input ref={importInput} className="sr-only" type="file" accept="application/json,.json" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void run(async () => { if (file.size > 25_000_000) throw new Error('Archive exceeds 25 MB. Keep the existing backup and import smaller batches.'); const incoming = parseArchive<T>(JSON.parse(await file.text())); const saved = await appendArchive(scope, incoming); if (mounted.current) { setArchive(saved); setMessage('Archive restored. Existing historical records were retained.'); } }); }} />
    </div>
    <p role="status" className="text-sm font-semibold">{message}</p>
    <div className="grid gap-3 md:grid-cols-2">
      <label>Search archive<input className={input} placeholder="Scripture, title, theme, quote, story, or any lesson text" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <label>Filter church / location<input className={input} value={location} onChange={e => setLocation(e.target.value)} /></label>
      <label>From teaching date<input className={input} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></label>
      <label>Through teaching date<input className={input} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></label>
    </div>
    <p className="text-sm">{results.length} teaching {results.length === 1 ? 'occasion' : 'occasions'}</p>
    <div className="grid gap-3 md:grid-cols-2">
      {results.map(event => <article key={event.id} className="min-w-0 rounded-xl border border-[var(--line)] bg-white p-4">
        <h3 className="break-words font-semibold">{event.snapshot.title}</h3>
        <p className="text-sm">{event.snapshot.passage} · {event.delivery.date} · {event.delivery.location} · {event.delivery.audience}</p>
        <p className="my-2 text-xs">{archive.events.filter(e => e.messageId === event.messageId).length} recorded occasions for this message · Preserved history</p>
        <div className="flex flex-wrap gap-2"><button className={button} type="button" onClick={() => { setSelectedId(event.id); setAddendum(''); }}>View preserved version</button><button className={button} type="button" onClick={() => reuse(event)}>Revise / reuse in Prepare to Teach</button></div>
      </article>)}
    </div>
    {!results.length && <p>No preserved versions match. Open a saved lesson, enter its teaching date and location, then preserve the taught version.</p>}
    {selected && <article className="min-w-0 space-y-3 rounded-xl border border-[var(--line)] bg-white p-4" aria-label="Preserved version">
      <h3 className="text-xl font-semibold">{selected.snapshot.title} — preserved version</h3>
      <p>{selected.delivery.date} · {selected.delivery.location} · {selected.delivery.audience}</p>
      <p className="text-sm">This record is read-only. Reuse creates a separate editable draft; the original remains here.</p>
      <div className="flex flex-wrap gap-2">
        <button className={button} type="button" onClick={() => reuse(selected)}>Create revised copy</button>
        <button className={button} type="button" disabled={!selected.snapshot.slides.length} onClick={() => download('preserved-audience-slides.html', offlinePresentationHtml(selected.snapshot.title, selected.snapshot.slides), 'text/html')}>Download preserved slides (offline)</button>
        <button className={button} type="button" onClick={() => download('preserved-lesson-pack.json', JSON.stringify({ events: archive.events.filter(e => e.messageId === selected.messageId), addenda: archive.addenda.filter(n => archive.events.some(e => e.id === n.eventId && e.messageId === selected.messageId)) }, null, 2), 'application/json')}>Download private lesson pack</button>
      </div>
      <details><summary className="cursor-pointer font-semibold">Prepared notes, quotes, illustrations and slide text</summary><pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words p-3 text-sm">{Object.entries(selected.snapshot).filter(([key]) => !['id','ministryMessageId','reusedFromEventId'].includes(key)).map(([key, value]) => `${key}\n${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}`).join('\n\n')}</pre></details>
      <h4 className="font-semibold">Actual delivery and review</h4>
      <p className="whitespace-pre-wrap">{selected.delivery.deliveredNotes || 'No delivery differences recorded.'}</p><p className="whitespace-pre-wrap">{selected.delivery.reflection}</p>
      {archive.addenda.filter(n => n.eventId === selected.id).map(n => <p key={n.id} className="whitespace-pre-wrap border-l-2 pl-3 text-sm">{new Date(n.createdAt).toLocaleString()} — {n.body}</p>)}
      <label className="block">Add a later delivery note (keeps earlier notes)<textarea className={input} value={addendum} onChange={e => setAddendum(e.target.value)} /></label>
      <button className={button} type="button" disabled={busy || !addendum.trim()} onClick={() => void run(async () => { const note = { id: crypto.randomUUID(), eventId: selected.id, createdAt: new Date().toISOString(), body: addendum.trim() }; const saved = await appendArchive(scope, { events: [selected], addenda: [note] }); if (mounted.current) { setArchive(saved); setAddendum(''); setMessage('Delivery note appended. Earlier notes and prepared version are unchanged.'); } })}>Append delivery note</button>
    </article>}
  </section>;
}
