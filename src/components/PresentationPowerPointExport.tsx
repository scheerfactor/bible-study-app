"use client";

import { useState } from "react";
import { powerPointTextIssues, POWERPOINT_BODY_LIMIT, type PowerPointSlideText, type PresentationExportMode } from "../lib/presentation-export";

export default function PresentationPowerPointExport({ disabled, slides, onReview, onExport }: {
  disabled: boolean;
  slides: readonly PowerPointSlideText[];
  onReview: (id: string) => void;
  onExport: (mode: PresentationExportMode) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const issues = powerPointTextIssues(slides);
  const blocked = disabled || busy || issues.length > 0;
  async function exportCopy(mode: PresentationExportMode) {
    if (blocked) return;
    setBusy(true);
    try { await onExport(mode); } finally { setBusy(false); }
  }
  return <div className="mt-3 rounded-xl border border-[var(--line)] p-3">
    <p className="text-sm font-semibold">Choose your PowerPoint copy</p>
    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Slides-only omits speaker notes and private presentation-note metadata. Visible slide text and author labels remain. Keep the presenter copy for full source/rights notes; review visible slide content before sharing.</p>
    {issues.length > 0 && <div role="status" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
      <p className="font-semibold">Split long text before exporting</p>
      <p className="mt-1">Nothing has been shortened or removed. Review the affected slide, then use Split Long Passage for Scripture or Split Long Text for teaching and quotation slides.</p>
      <ul className="mt-2 space-y-2">
        {issues.map((issue) => <li key={issue.number} className="break-words">
          <span>Slide {issue.number}: {issue.title} — {issue.length.toLocaleString("en-US")} / {POWERPOINT_BODY_LIMIT.toLocaleString("en-US")} characters. </span>
          {issue.id && <button type="button" className="min-h-11 underline font-semibold" onClick={() => onReview(issue.id!)}>Review slide {issue.number}</button>}
        </li>)}
      </ul>
    </div>}
    <p className="mt-2 text-xs text-[var(--muted)]">The body-text limit prevents text loss; it does not guarantee readable type. Rehearse the exported slides on your presentation screen.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" disabled={blocked} onClick={() => void exportCopy("slides-only")} className="min-h-11 rounded-full bg-[var(--green)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Slides-only PowerPoint</button>
      <button type="button" disabled={blocked} onClick={() => void exportCopy("presenter")} className="min-h-11 rounded-full border border-[var(--green)] px-4 py-2 text-sm font-semibold text-[var(--green)] disabled:opacity-50">Presenter PowerPoint — includes notes</button>
    </div>
    <p role="status" className="mt-2 text-xs text-[var(--muted)]">{busy ? "Preparing PowerPoint…" : "Presenter copies and Markdown plans may contain private notes. Do not distribute them publicly."}</p>
  </div>;
}
