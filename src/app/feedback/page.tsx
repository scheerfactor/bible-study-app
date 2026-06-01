"use client";

import Link from "next/link";
import { ChevronLeft, Clipboard, MessageSquareText } from "lucide-react";
import { useMemo, useState } from "react";

const questions = [
  "What worked?",
  "What confused you?",
  "Was the Bible reader easy to use?",
  "Did the Study tab help?",
  "What feature would you want next?",
];

export default function FeedbackPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const feedbackText = useMemo(
    () =>
      questions
        .map((question) => `${question}\n${answers[question]?.trim() || "(no answer yet)"}`)
        .join("\n\n"),
    [answers],
  );

  async function copyFeedback() {
    await navigator.clipboard.writeText(feedbackText);
    setCopied(true);
  }

  return (
    <main className="min-h-screen bg-[var(--page)] text-[var(--ink)]">
      <div className="mx-auto min-h-screen w-full max-w-3xl bg-[var(--paper)] px-4 pb-12 pt-5 shadow-2xl shadow-stone-950/10 md:my-6 md:min-h-[calc(100vh-3rem)] md:rounded-[1.75rem] md:border md:border-stone-200 md:p-8">
        <div className="sticky top-0 z-10 -mx-4 border-b border-[var(--line)] bg-[var(--paper)]/95 px-4 pb-4 pt-2 backdrop-blur md:static md:mx-0 md:border-0 md:p-0">
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--green)] shadow-sm"
            href="/"
          >
            <ChevronLeft size={17} />
            Back to Bible
          </Link>
        </div>

        <section className="mt-5 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-[var(--green)]">
            <MessageSquareText size={24} />
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)]">Private Beta Feedback</h1>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Please answer after testing John 3:16, the Study Drawer, Webster lookup, notes, highlights, bookmarks, and export.
          </p>
        </section>

        <form className="mt-4 space-y-4">
          {questions.map((question) => (
            <label key={question} className="block rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
              <span className="text-sm font-semibold text-[var(--green)]">{question}</span>
              <textarea
                className="mt-3 min-h-28 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 text-base leading-6 outline-none"
                value={answers[question] ?? ""}
                onChange={(event) => setAnswers((current) => ({ ...current, [question]: event.target.value }))}
              />
            </label>
          ))}
        </form>

        <section className="mt-4 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white"
            onClick={copyFeedback}
            type="button"
          >
            <Clipboard size={16} />
            Copy Feedback
          </button>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {copied ? "Feedback copied. Send it to the beta coordinator." : "Copy answers, then paste them into an email or message."}
          </p>
        </section>
      </div>
    </main>
  );
}
