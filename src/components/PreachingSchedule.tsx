"use client";

import { CalendarDays, CheckCircle2, Clock3, Plus } from "lucide-react";
import { useMemo, useState } from "react";

export type PreachingScheduleDraft = {
  kind: "Sermon" | "Lesson";
  title: string;
  passage: string;
  theme: string;
  scheduledFor: string;
  service: string;
  specialDay: string;
};

type ScheduledMessage = PreachingScheduleDraft & {
  id: string;
  status: string;
};

type MinistryDay = {
  id: string;
  name: string;
  date: string;
  passage: string;
  theme: string;
  studyHelps: string[];
};

const SERVICES = ["Sunday Morning", "Sunday Evening", "Sunday School", "Wednesday Bible Study", "Special Service"];

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function nthWeekday(year: number, month: number, weekday: number, occurrence: number) {
  const first = new Date(year, month, 1);
  return 1 + ((7 + weekday - first.getDay()) % 7) + ((occurrence - 1) * 7);
}

function lastWeekday(year: number, month: number, weekday: number) {
  const last = new Date(year, month + 1, 0);
  return last.getDate() - ((7 + last.getDay() - weekday) % 7);
}

function easterDate(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function ministryDaysForYear(year: number): MinistryDay[] {
  const resurrectionSunday = easterDate(year);
  return [
    { id: `new-year-${year}`, name: "New Year", date: isoDate(year, 0, 1), passage: "Psalm 90:12", theme: "Numbering our days wisely", studyHelps: ["Trace wisdom and stewardship of time.", "Build one clear step of consecration and obedience."] },
    { id: `resurrection-${year}`, name: "Resurrection Sunday", date: isoDate(year, resurrectionSunday.getMonth(), resurrectionSunday.getDate()), passage: "1 Corinthians 15:1-4", theme: "Christ died for our sins and rose again", studyHelps: ["Read the Gospel accounts together before outlining.", "Trace resurrection hope through 1 Corinthians 15."] },
    { id: `mothers-${year}`, name: "Mother's Day", date: isoDate(year, 4, nthWeekday(year, 4, 0, 2)), passage: "Proverbs 31:10-31", theme: "Godly influence in the home", studyHelps: ["Keep the Bible text central and honor varied family circumstances.", "Compare Timothy's godly heritage in 2 Timothy 1:5."] },
    { id: `memorial-${year}`, name: "Memorial Day weekend", date: isoDate(year, 4, lastWeekday(year, 4, 1) - 1), passage: "John 15:13", theme: "Sacrifice, remembrance, and gratitude", studyHelps: ["Distinguish national remembrance from the Gospel.", "Move carefully from human sacrifice to Christ's unique sacrifice."] },
    { id: `fathers-${year}`, name: "Father's Day", date: isoDate(year, 5, nthWeekday(year, 5, 0, 3)), passage: "Ephesians 6:4", theme: "Faithful fatherhood under God", studyHelps: ["Study the father's responsibility to nurture and admonish.", "Include grace for men beginning a faithful pattern now."] },
    { id: `independence-${year}`, name: "Independence Day", date: isoDate(year, 6, 4), passage: "Psalm 33:12", theme: "A nation accountable to God", studyHelps: ["Avoid confusing national identity with the church.", "Pray for rulers from 1 Timothy 2:1-4."] },
    { id: `school-${year}`, name: "Back-to-school emphasis", date: isoDate(year, 7, nthWeekday(year, 7, 0, 1)), passage: "Proverbs 2:1-6", theme: "The LORD giveth wisdom", studyHelps: ["Prepare direct application for students, parents, and teachers.", "Connect learning with the fear of the LORD."] },
    { id: `labor-${year}`, name: "Labor Day weekend", date: isoDate(year, 8, nthWeekday(year, 8, 1, 1) - 1), passage: "Colossians 3:22-24", theme: "Serving the Lord in daily work", studyHelps: ["Study work, honesty, diligence, and witness.", "Add applications for workers, employers, homemakers, and students."] },
    { id: `pastor-${year}`, name: "Pastor Appreciation Sunday", date: isoDate(year, 9, nthWeekday(year, 9, 0, 2)), passage: "Hebrews 13:7,17", theme: "Remembering faithful spiritual leadership", studyHelps: ["Keep Christ and Scripture above personalities.", "Teach both pastoral accountability and congregational responsibility."] },
    { id: `thanksgiving-${year}`, name: "Thanksgiving", date: isoDate(year, 10, nthWeekday(year, 10, 4, 4)), passage: "Psalm 100", theme: "Enter into his gates with thanksgiving", studyHelps: ["Trace thanksgiving as worship, prayer, and testimony.", "Invite specific remembrance of the Lord's goodness."] },
    { id: `christmas-${year}`, name: "Christmas", date: isoDate(year, 11, 25), passage: "Luke 2:1-20", theme: "Unto you is born a Saviour", studyHelps: ["Read the KJV nativity text before traditions or illustrations.", "Trace the names and offices of Christ in the passage."] },
  ];
}

function displayDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function localToday() {
  const date = new Date();
  return isoDate(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function PreachingSchedule({
  messages,
  onOpen,
  onCreate,
}: {
  messages: ScheduledMessage[];
  onOpen: (id: string) => void;
  onCreate: (draft: PreachingScheduleDraft) => void;
}) {
  const today = localToday();
  const [date, setDate] = useState(today);
  const [service, setService] = useState(SERVICES[0]);
  const [kind, setKind] = useState<"Sermon" | "Lesson">("Sermon");
  const [title, setTitle] = useState("");
  const [passage, setPassage] = useState("");
  const [theme, setTheme] = useState("");
  const upcomingMessages = useMemo(
    () => messages.filter((message) => message.scheduledFor >= today).sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    [messages, today],
  );
  const ministryDays = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [...ministryDaysForYear(currentYear), ...ministryDaysForYear(currentYear + 1)]
      .filter((day) => day.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 12);
  }, [today]);

  function createGeneralDraft() {
    onCreate({
      kind,
      title: title.trim() || `${passage.trim() || "Planned"} ${kind}`,
      passage: passage.trim(),
      theme: theme.trim(),
      scheduledFor: date,
      service,
      specialDay: "",
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <section className="min-w-0 space-y-4">
        <article className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Preaching Schedule</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--ink)]">Plan the text before the week becomes crowded</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Schedule sermons and lessons by service, passage, and theme. Each plan opens in the Sermon Builder where commentary, books, word studies, quotes, illustrations, hymns, and slides can support the Bible text.</p>
            </div>
            <CalendarDays className="text-[var(--green)]" size={28} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-[var(--muted)]">Date<input className="mt-2 h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
            <label className="text-sm font-semibold text-[var(--muted)]">Service<select className="mt-2 h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" value={service} onChange={(event) => setService(event.target.value)}>{SERVICES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm font-semibold text-[var(--muted)]">Type<select className="mt-2 h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" value={kind} onChange={(event) => setKind(event.target.value as "Sermon" | "Lesson")}><option>Sermon</option><option>Lesson</option></select></label>
            <label className="text-sm font-semibold text-[var(--muted)]">Title<input className="mt-2 h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" placeholder="The Faithful Shepherd" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label className="text-sm font-semibold text-[var(--muted)]">KJV passage<input className="mt-2 h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" placeholder="John 10:1-18" value={passage} onChange={(event) => setPassage(event.target.value)} /></label>
            <label className="text-sm font-semibold text-[var(--muted)]">Theme or purpose<input className="mt-2 h-11 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)]" placeholder="Christ the Good Shepherd" value={theme} onChange={(event) => setTheme(event.target.value)} /></label>
          </div>
          <button className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--green)] px-5 py-2.5 text-sm font-semibold text-white" onClick={createGeneralDraft} type="button"><Plus size={16} /> Plan and open in Builder</button>
        </article>

        <article className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Upcoming messages</p>
          <div className="mt-4 space-y-3">
            {upcomingMessages.map((message) => (
              <button key={message.id} className="w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 text-left" onClick={() => onOpen(message.id)} type="button">
                <span className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-[var(--green)]">{message.title}</span><span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{message.status}</span></span>
                <span className="mt-2 block text-sm text-[var(--ink)]">{displayDate(message.scheduledFor)} · {message.service || "Service not set"}</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">{message.passage || "Passage not selected"}{message.specialDay ? ` · ${message.specialDay}` : ""}</span>
              </button>
            ))}
            {!upcomingMessages.length && <p className="rounded-2xl border border-dashed border-[var(--line)] p-4 text-sm leading-6 text-[var(--muted)]">No upcoming messages are scheduled. Use the planner above or choose a ministry day.</p>}
          </div>
        </article>
      </section>

      <section className="min-w-0 space-y-4">
        <article className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">Special days to remember</p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--ink)]">Passage-first planning helps</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">These are planning reminders, not required observances. Confirm each date and let the KJV text—not the occasion—govern the message.</p>
          <div className="mt-4 space-y-3">
            {ministryDays.map((day) => {
              const alreadyPlanned = messages.some((message) => message.scheduledFor === day.date && message.specialDay === day.name);
              return (
                <div key={day.id} className="rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-[var(--green)]">{day.name}</p><p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{displayDate(day.date)}</p></div>{alreadyPlanned && <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--green)]"><CheckCircle2 size={14} /> Planned</span>}</div>
                  <p className="mt-3 text-sm font-semibold text-[var(--ink)]">{day.passage} · {day.theme}</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-[var(--muted)]">{day.studyHelps.map((help) => <li key={help}>• {help}</li>)}</ul>
                  <button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-semibold text-[var(--green)]" onClick={() => onCreate({ kind: "Sermon", title: day.name, passage: day.passage, theme: day.theme, scheduledFor: day.date, service: "Sunday Morning", specialDay: day.name })} type="button"><Clock3 size={14} /> {alreadyPlanned ? "Plan another message" : "Plan this message"}</button>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
