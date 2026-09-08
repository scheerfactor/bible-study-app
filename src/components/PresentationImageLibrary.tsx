'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
export type PresentationImage = { id: string; title: string; url: string; description: string; rights: string };
export default function PresentationImageLibrary({ images, selectedId, onSelect, label = 'Images & backgrounds' }: { images: PresentationImage[]; selectedId?: string; onSelect?: (image: PresentationImage) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--green)]" onClick={() => setOpen(true)}>{label}</button>{open && createPortal(<Gallery images={images} selectedId={selectedId} onSelect={onSelect} onClose={() => setOpen(false)} />, document.body)}</>;
}
function Gallery({images, selectedId, onSelect, onClose}: { images: PresentationImage[]; selectedId?: string; onSelect?: (image: PresentationImage) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(images.find(image => image.id === selectedId) || images[0]);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.querySelector<HTMLInputElement>('input')?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.stopImmediatePropagation(); onClose(); }
      if (event.key === 'Tab') {
        const controls = Array.from(root.current?.querySelectorAll<HTMLElement>('button,input,summary') || []).filter(e=>e.getClientRects().length);
        if (event.shiftKey && document.activeElement === controls[0]) {event.preventDefault();controls.at(-1)?.focus();}
        if (!event.shiftKey && document.activeElement === controls.at(-1)) {event.preventDefault();controls[0]?.focus();}
      }
    };
    document.addEventListener('keydown', keys, true);
    return () => {document.removeEventListener('keydown', keys, true);previous?.focus();};
  }, [onClose]);
  const filtered = images.filter(image => `${image.title} ${image.description}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <div ref={root} role="dialog" aria-modal="true" aria-label="Images and backgrounds" className="fixed inset-0 overflow-y-auto bg-[var(--paper)] p-4 text-[var(--ink)] md:p-8" style={{zIndex:1400}}>
    <div className="mx-auto max-w-6xl space-y-5">
      <header className="flex items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">Images & backgrounds</h1><p className="mt-2 max-w-2xl text-sm leading-6">Your app’s built-in presentation images are all here. Choose an image to see it clearly{onSelect ? ', then apply it.' : '.'}</p></div><button className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-4 font-semibold" onClick={onClose}>Close images</button></header>
      <label className="block text-sm font-semibold">Find an image<input className="mt-2 min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-4" placeholder="Try Bible, prayer, cross, church, or Assyria" value={search} onChange={e=>setSearch(e.target.value)} /></label>
      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section aria-label="Available images"><p className="mb-3 text-sm text-[var(--muted)]">{filtered.length} images · tap a thumbnail to preview</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{filtered.map(image=><button key={image.id} aria-pressed={selected?.id===image.id} className={`overflow-hidden rounded-xl border-2 bg-white text-left ${selected?.id===image.id?'border-[var(--green)]':'border-transparent'}`} onClick={()=>setSelected(image)}><Image unoptimized src={image.url} width={400} height={225} alt={image.title} className="aspect-video w-full object-cover" /><span className="block p-3 text-sm font-semibold">{image.title}{selectedId===image.id?' · In use':''}</span></button>)}</div>{!filtered.length&&<p>No images match. Try a shorter word or clear the search.</p>}</section>
        {selected&&<section className="rounded-2xl border border-[var(--line)] bg-white p-4 lg:sticky lg:top-4" aria-label="Selected image preview"><Image unoptimized src={selected.url} width={960} height={540} alt={`${selected.title} enlarged preview`} className="aspect-video w-full rounded-xl object-cover" /><h2 className="mt-4 text-xl font-semibold">{selected.title}</h2><p className="mt-2 text-sm leading-6">{selected.description}</p>{onSelect?<button className="mt-4 min-h-12 w-full rounded-xl bg-[var(--green)] px-4 py-3 font-semibold text-white" onClick={()=>{onSelect(selected);onClose();}}>Use this image</button>:<p className="mt-4 rounded-xl bg-[var(--paper)] p-3 text-sm leading-6">To use an image, open a lesson’s slides or pre-class countdown and choose <strong>Choose background image</strong>.</p>}<details className="mt-4 text-sm"><summary className="cursor-pointer py-2 font-semibold">Image rights record</summary><p className="py-2 leading-6">{selected.rights}</p></details></section>}
      </div>
      <details className="rounded-xl border border-[var(--line)] bg-white p-4 text-sm"><summary className="cursor-pointer font-semibold">Looking for an image you added elsewhere?</summary><p className="mt-3 leading-6">This gallery contains images already included in the app. Images attached in a chat, saved in Downloads, or added to Logos or Proclaim do not automatically appear here. A saved church theme remembers an app background and its styling; it is not a separate image upload. Personal image uploads are not available in this version.</p></details>
    </div>
  </div>;
}
