"use client";

import { useState } from "react";
import type { PresentationExportMode } from "../lib/presentation-export";

export default function PresentationPowerPointExport({ disabled, onExport }: {
  disabled: boolean;
  onExport: (mode: PresentationExportMode) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  async function exportCopy(mode: PresentationExportMode) {
    if (busy) return;
    setBusy(true);
    try { await onExport(mode); } finally { setBusy(false); }
  }
  return <div className="mt-3 rounded-xl border border-[var(--line)] p-3">
    <p className="text-sm font-semibold">Choose your PowerPoint copy</p>
    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Slides-only omits speaker notes and private presentation-note metadata. Visible slide text and author labels remain. Keep the presenter copy for full source/rights notes; review visible slide content before sharing.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" disabled={disabled || busy} onClick={() => void exportCopy("slides-only")} className="min-h-11 rounded-full bg-[var(--green)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Slides-only PowerPoint</button>
      <button type="button" disabled={disabled || busy} onClick={() => void exportCopy("presenter")} className="min-h-11 rounded-full border border-[var(--green)] px-4 py-2 text-sm font-semibold text-[var(--green)] disabled:opacity-50">Presenter PowerPoint — includes notes</button>
    </div>
    <p role="status" className="mt-2 text-xs text-[var(--muted)]">{busy ? "Preparing PowerPoint…" : "Presenter copies and Markdown plans may contain private notes. Do not distribute them publicly."}</p>
  </div>;
}
