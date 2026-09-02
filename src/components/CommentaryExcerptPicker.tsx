"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { COMMENTARY_EXCERPT_LIMIT, commentaryMatchContext, findCommentaryMatches, validateCommentaryExcerpt } from "../lib/commentary-excerpt";

export default function CommentaryExcerptPicker({ text, author, reference, onAdd, onClose }: {
  text: string;
  author: string;
  reference: string;
  onAdd: (excerpt: string) => void;
  onClose: () => void;
}) {
  const [selection, setSelection] = useState("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [matchIndex, setMatchIndex] = useState(0);
  const matches = useMemo(() => findCommentaryMatches(text, search), [text, search]);
  const activeMatch = matches[matchIndex];
  const context = activeMatch ? commentaryMatchContext(text, activeMatch) : null;
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
      <div className="mt-3 rounded-lg border border-[var(--line)] p-3">
        <label className="block text-xs font-semibold">Find words in this source
          <input type="search" value={search} maxLength={120} onChange={(event) => { setSearch(event.target.value); setMatchIndex(0); }} onKeyDown={(event) => {
            if (event.key === "Enter" && matches.length) { event.preventDefault(); setMatchIndex((index) => (index + (event.shiftKey ? matches.length - 1 : 1)) % matches.length); }
          }} className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line)] px-3 text-sm font-normal" />
        </label>
        <p role="status" className="mt-2 text-xs leading-5">{!search.trim() ? "Find an exact phrase, ignoring capitalization. Enter moves to the next match; Shift+Enter moves back." : context ? `Match ${matchIndex + 1} of ${matches.length} · source characters ${activeMatch.start + 1}-${activeMatch.end}` : "No matching words in this source. Try a shorter phrase. Your slide excerpt has not changed."}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" disabled={matches.length < 2} onClick={() => setMatchIndex((index) => (index + matches.length - 1) % matches.length)} className="min-h-11 rounded-lg border border-[var(--line)] px-3 text-xs disabled:opacity-50">Previous match</button>
          <button type="button" disabled={matches.length < 2} onClick={() => setMatchIndex((index) => (index + 1) % matches.length)} className="min-h-11 rounded-lg border border-[var(--line)] px-3 text-xs disabled:opacity-50">Next match</button>
        </div>
        {context && <>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6" aria-label="Matching source context">{context.start > 0 && "…"}{context.before}<mark className="bg-yellow-200 text-black">{context.matched}</mark>{context.after}{context.end < text.length && "…"}</p>
          <p className="mt-2 text-xs leading-5">Context is a short window and may begin or end mid-sentence. Review the full source below before quoting.</p>
          <button type="button" disabled={Boolean(validateCommentaryExcerpt(text, context.text).error)} onClick={() => setDraft(context.text)} className="mt-2 min-h-11 rounded-lg border border-[var(--line)] px-3 text-xs font-semibold disabled:opacity-50">Use this context as excerpt</button>
        </>}
      </div>
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
