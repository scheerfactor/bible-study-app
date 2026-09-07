"use client";
import { lessonSchedule, type LessonPlan } from "@/lib/sunday-school";

export default function LessonPlanEditor({ plan, targetMinutes, onChange }: {
  plan: LessonPlan; targetMinutes: number; onChange: (plan: LessonPlan) => void;
}) {
  const schedule = lessonSchedule(plan);
  const total = schedule.at(-1)?.end ?? 0;
  const field = (label: string, value: string, change: (value: string) => void, multiline = true) => (
    <label className="block text-sm font-semibold text-[var(--green)]">{label}
      {multiline ? <textarea className="mt-2 min-h-24 w-full rounded-xl border border-[var(--line)] bg-white p-3 font-normal text-[var(--ink)]" value={value} onChange={e => change(e.target.value)} /> :
        <input className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white p-3 font-normal text-[var(--ink)]" value={value} onChange={e => change(e.target.value)} />}
    </label>
  );
  return <article className="space-y-4 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
    <h2 className="text-xl font-semibold">Sunday School teaching plan</h2>
    <p className="text-sm text-[var(--muted)]">Editable teaching draft. Verify conclusions against the KJV and reviewed resources. This plan drives Teaching Mode and generated lesson slides. After editing, regenerate slides in Slide Builder, review them, and save the lesson.</p>
    <p role="status" className="font-semibold">Planned: {total} minutes · Target: {targetMinutes} minutes{total !== targetMinutes ? ` · ${Math.abs(total - targetMinutes)} minutes ${total > targetMinutes ? "over" : "under"} target` : " · Timing matches"}</p>
    {field("Teaching date (blank if not scheduled)", plan.date, date => onChange({ ...plan, date }), false)}
    {field("Lesson objective", plan.objective, objective => onChange({ ...plan, objective }))}
    {schedule.map((s, index) => <fieldset key={s.id} className="space-y-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <legend className="px-2 font-semibold">{s.start}–{s.end} min · Section {index + 1}</legend>
      {([['Title', 'title'], ['Passage (KJV)', 'passage'], ['Teaching notes', 'notes'], ['Discussion question (audience)', 'question'], ['Answer guide (teacher only)', 'answer'], ['Application', 'application']] as const).map(([label, key]) => <div key={key}>{field(label, s[key], value => onChange({ ...plan, segments: plan.segments.map((segment, i) => i === index ? { ...segment, [key]: value } : segment) }), key !== 'title' && key !== 'passage')}</div>)}
      <label className="block text-sm font-semibold">Minutes<input className="ml-3 w-24 rounded-xl border p-3" min={1} max={120} type="number" value={s.minutes} onChange={e => onChange({ ...plan, segments: plan.segments.map((segment, i) => i === index ? { ...segment, minutes: Math.min(120, Math.max(1, Math.round(Number(e.target.value) || 1))) } : segment) })} /></label>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={index === 0} className="rounded-xl border bg-white px-4 py-3 disabled:opacity-40" onClick={() => { const segments = [...plan.segments]; [segments[index - 1], segments[index]] = [segments[index], segments[index - 1]]; onChange({ ...plan, segments }); }}>Move up</button>
        <button type="button" className="rounded-xl border bg-white px-4 py-3" onClick={() => onChange({ ...plan, segments: plan.segments.filter((_, i) => i !== index) })}>Remove section</button>
      </div>
    </fieldset>)}
    <button type="button" className="rounded-xl border px-4 py-3" onClick={() => onChange({ ...plan, segments: [...plan.segments, { id: crypto.randomUUID(), title: "New section", passage: "", minutes: 5, notes: "", question: "", answer: "", application: "" }] })}>Add teaching section</button>
    {field("Prayer prompts", plan.prayer, prayer => onChange({ ...plan, prayer }))}
    {field("Resource selection and commentary comparison notes", plan.resources, resources => onChange({ ...plan, resources }))}
    {field("Hymn and media suggestions (teacher only)", plan.media, media => onChange({ ...plan, media }))}
  </article>;
}
