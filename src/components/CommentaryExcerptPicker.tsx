"use client";

import { useEffect, useRef, useState } from "react";
import { COMMENTARY_EXCERPT_LIMIT, validateCommentaryExcerpt } from "../lib/commentary-excerpt";

export default function CommentaryExcerptPicker({ text, author, reference, onAdd, onClose }: {
  text: string;
  author: string;
  reference: string;
  onAdd: (excerpt: string) => void;
  onClose: () => void;
}) {
  const [selection, setSelection] = useState("");
  const [draft, setDraft] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const result = validateCommentaryExcerpt(text, draft);
  return (
    <section aria-label="Commentary excerpt picker" className="mt-3 rounded-xl border border-[var(--line)] bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 ref={heading} tabIndex={-1} className="text-sm font-semibold">Choose an exact excerpt</h3>
        <button type="button" onClick={onClose} className="min-h-11 text-sm font-semibold text-[var(--green)]">Close excerpt picker</button>
      </div>
      <p className="text-sm text-[var(--muted)]">{reference} · {author}</p>
      <p className="mt-2 text-xs leading-5">Read the surrounding context. Highlight words below and choose Use selected words, or copy a continuous passage into Slide excerpt. Wording is checked against this source, not rewritten. Review commentary against the KJV.</p>
      <label className="mt-3 block text-xs font-semibold">Full commentary source
        <textarea readOnly value={text} rows={10} onSelect={(event) => {
          const field = event.currentTarget;
          setSelection(field.value.slice(field.selectionStart, field.selectionEnd));
        }} className="mt-1 w-full rounded-lg border border-[var(--line)] p-3 text-sm font-normal leading-6" />
      </label>
      <button type="button" disabled={!selection.trim()} onClick={() => setDraft(selection)} className="min-h-11 rounded-lg border border-[var(--line)] px-3 text-sm disabled:opacity-50">Use selected words</button>
      <label className="mt-3 block text-xs font-semibold">Slide excerpt
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={5} aria-describedby="commentary-excerpt-status" aria-invalid={Boolean(draft && result.error)} className="mt-1 w-full rounded-lg border border-[var(--line)] p-3 text-sm font-normal leading-6" />
      </label>
      <p id="commentary-excerpt-status" role="status" className="mt-2 text-xs leading-5">{result.text.length}/{COMMENTARY_EXCERPT_LIMIT} characters. {result.error || "Exact source wording confirmed. Author, source, rights, and excerpt location will stay in the speaker notes."}</p>
      <button type="button" disabled={Boolean(result.error)} onClick={() => { if (!result.error) onAdd(result.text); }} className="mt-3 min-h-11 rounded-lg bg-[var(--green)] px-4 text-sm font-semibold text-white disabled:opacity-50">Add selected excerpt slide</button>
    </section>
  );
}
