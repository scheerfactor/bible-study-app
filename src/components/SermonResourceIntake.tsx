"use client";

import { Download, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

type CandidateKind = "Quote" | "Illustration" | "Hymn" | "Book" | "Commentary" | "Audio";
type RightsPosition = "Unknown" | "Public Domain Candidate" | "Written Permission Needed" | "Written Permission Received" | "Link Only Candidate";

type ResourceCandidate = {
  id: string;
  kind: CandidateKind;
  title: string;
  creator: string;
  content: string;
  scriptureAndTopics: string;
  sourceUrl: string;
  sourceLocator: string;
  rightsPosition: RightsPosition;
  rightsEvidence: string;
  reviewStatus: string;
  createdAt: string;
};

const STORAGE_KEY = "fathers-business-sermon-resource-intake-v1";
const candidateKinds: CandidateKind[] = ["Quote", "Illustration", "Hymn", "Book", "Commentary", "Audio"];
const rightsPositions: RightsPosition[] = ["Unknown", "Public Domain Candidate", "Written Permission Needed", "Written Permission Received", "Link Only Candidate"];

function reviewStatusForRights(position: RightsPosition) {
  if (position === "Public Domain Candidate") return "Public-domain verification";
  if (position === "Written Permission Received") return "Rights evidence review";
  if (position === "Link Only Candidate") return "Link-only review";
  return "Blocked—rights needed";
}

function loadCandidates() {
  if (typeof window === "undefined") return [] as ResourceCandidate[];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as ResourceCandidate[];
    return Array.isArray(parsed) ? parsed.filter((entry) => entry?.id && entry?.title && entry?.sourceUrl) : [];
  } catch {
    return [] as ResourceCandidate[];
  }
}

function saveCandidates(candidates: ResourceCandidate[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
}

function emptyForm() {
  return {
    kind: "Quote" as CandidateKind,
    title: "",
    creator: "",
    content: "",
    scriptureAndTopics: "",
    sourceUrl: "",
    sourceLocator: "",
    rightsPosition: "Unknown" as RightsPosition,
    rightsEvidence: "",
  };
}

export default function SermonResourceIntake() {
  const [candidates, setCandidates] = useState<ResourceCandidate[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setCandidates(loadCandidates()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const duplicate = useMemo(() => {
    const title = form.title.trim().toLowerCase();
    const creator = form.creator.trim().toLowerCase();
    return candidates.find((entry) => entry.kind === form.kind && entry.title.toLowerCase() === title && entry.creator.toLowerCase() === creator) ?? null;
  }, [candidates, form.creator, form.kind, form.title]);

  function updateForm<Key extends keyof ReturnType<typeof emptyForm>>(key: Key, value: ReturnType<typeof emptyForm>[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  function submitCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (duplicate) {
      setMessage("That title and creator are already in the candidate queue.");
      return;
    }
    if (!/^https:\/\//i.test(form.sourceUrl.trim())) {
      setMessage("Use the exact HTTPS source page so the resource can be checked later.");
      return;
    }
    const candidate: ResourceCandidate = {
      id: `resource-candidate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: form.kind,
      title: form.title.trim(),
      creator: form.creator.trim(),
      content: form.content.trim(),
      scriptureAndTopics: form.scriptureAndTopics.trim(),
      sourceUrl: form.sourceUrl.trim(),
      sourceLocator: form.sourceLocator.trim(),
      rightsPosition: form.rightsPosition,
      rightsEvidence: form.rightsEvidence.trim(),
      reviewStatus: reviewStatusForRights(form.rightsPosition),
      createdAt: new Date().toISOString(),
    };
    const next = [candidate, ...candidates].slice(0, 250);
    setCandidates(next);
    saveCandidates(next);
    setForm(emptyForm());
    setMessage("Candidate saved separately from the reviewed library.");
  }

  function removeCandidate(id: string) {
    const next = candidates.filter((candidate) => candidate.id !== id);
    setCandidates(next);
    saveCandidates(next);
    setMessage("Candidate removed from the local review queue.");
  }

  function downloadReviewPacket() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), candidates }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `fathers-business-resource-review-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Review packet downloaded. Candidates still require source, rights, and editorial review before publication.");
  }

  return (
    <article className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]"><ShieldCheck aria-hidden="true" size={17} /> Resource Intake</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">Capture more resources without losing rights discipline</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">Save exact source and rights evidence first. New entries remain candidates and never appear in the reviewed finder until their wording, doctrine, source, and reuse rights have been checked.</p>
        </div>
        <span className="rounded-full bg-[var(--warm)] px-3 py-1.5 text-xs font-semibold text-[var(--green)]">{candidates.length} candidate{candidates.length === 1 ? "" : "s"}</span>
      </div>

      <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={submitCandidate}>
        <label className="text-xs font-semibold text-[var(--muted)]">Resource type
          <select className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" onChange={(event) => updateForm("kind", event.target.value as CandidateKind)} value={form.kind}>
            {candidateKinds.map((kind) => <option key={kind}>{kind}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-[var(--muted)]">Rights position
          <select className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" onChange={(event) => updateForm("rightsPosition", event.target.value as RightsPosition)} value={form.rightsPosition}>
            {rightsPositions.map((position) => <option key={position}>{position}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-[var(--muted)]">Title
          <input className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" onChange={(event) => updateForm("title", event.target.value)} required value={form.title} />
        </label>
        <label className="text-xs font-semibold text-[var(--muted)]">Author, composer, or ministry
          <input className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" onChange={(event) => updateForm("creator", event.target.value)} required value={form.creator} />
        </label>
        <label className="text-xs font-semibold text-[var(--muted)] md:col-span-2">Exact source URL
          <input className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" onChange={(event) => updateForm("sourceUrl", event.target.value)} placeholder="https://official-source.example/resource" required type="url" value={form.sourceUrl} />
        </label>
        <label className="text-xs font-semibold text-[var(--muted)]">Source locator
          <input className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" onChange={(event) => updateForm("sourceLocator", event.target.value)} placeholder="Page, chapter, stanza, timestamp, or paragraph" value={form.sourceLocator} />
        </label>
        <label className="text-xs font-semibold text-[var(--muted)]">Scripture and topics
          <input className="mt-1 min-h-11 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" onChange={(event) => updateForm("scriptureAndTopics", event.target.value)} placeholder="John 3:16; grace; salvation" value={form.scriptureAndTopics} />
        </label>
        <label className="text-xs font-semibold text-[var(--muted)] md:col-span-2">Exact quotation, lyrics, description, or media notes
          <textarea className="mt-1 min-h-28 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-sm leading-6 text-[var(--ink)]" onChange={(event) => updateForm("content", event.target.value)} required value={form.content} />
        </label>
        <label className="text-xs font-semibold text-[var(--muted)] md:col-span-2">Rights evidence or permission notes
          <textarea className="mt-1 min-h-24 w-full rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3 text-sm leading-6 text-[var(--ink)]" onChange={(event) => updateForm("rightsEvidence", event.target.value)} placeholder="Quote the source policy, record public-domain evidence, or note who granted written permission and when." required value={form.rightsEvidence} />
        </label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--green)] px-4 text-sm font-semibold text-white" type="submit"><Plus aria-hidden="true" size={16} /> Save candidate</button>
          {duplicate && <p className="text-xs font-semibold text-amber-700">Possible duplicate: {duplicate.title} by {duplicate.creator}</p>}
          <p className="text-xs leading-5 text-[var(--muted)]">Saving does not approve a resource for public use.</p>
        </div>
      </form>

      {message && <p aria-live="polite" className="mt-3 rounded-xl bg-[var(--warm)] px-3 py-2 text-xs font-semibold text-[var(--green)]">{message}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
        <div>
          <p className="text-sm font-semibold text-[var(--ink)]">Local review queue</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Export a packet when several candidates are ready for source, doctrinal, editorial, and rights review.</p>
        </div>
        <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 text-xs font-semibold text-[var(--green)] disabled:opacity-40" disabled={!candidates.length} onClick={downloadReviewPacket} type="button"><Download aria-hidden="true" size={15} /> Download review packet</button>
      </div>
      <div className="mt-3 grid gap-2">
        {candidates.slice(0, 8).map((candidate) => (
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3" key={candidate.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--green)]">{candidate.kind} · Candidate only</p>
                <h3 className="mt-1 text-sm font-semibold text-[var(--ink)]">{candidate.title}</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">{candidate.creator} · {candidate.reviewStatus}</p>
                <a className="mt-2 block truncate text-xs font-semibold text-[var(--green)] underline" href={candidate.sourceUrl} rel="noreferrer" target="_blank">Review exact source</a>
              </div>
              <button aria-label={`Remove ${candidate.title}`} className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-white text-[var(--muted)]" onClick={() => removeCandidate(candidate.id)} type="button"><Trash2 aria-hidden="true" size={15} /></button>
            </div>
          </section>
        ))}
        {!candidates.length && <p className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--paper)] p-4 text-sm text-[var(--muted)]">No candidates yet. Begin with one exact source rather than a broad list of unverified titles.</p>}
      </div>
    </article>
  );
}
