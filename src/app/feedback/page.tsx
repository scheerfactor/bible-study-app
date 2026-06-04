"use client";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ChevronLeft, Clipboard, MessageSquareText, Send } from "lucide-react";
import { useMemo, useState } from "react";

const categories = [
  "General",
  "Bible Reader",
  "Study Drawer",
  "Library",
  "Listening",
  "Commentary",
  "Search",
  "Mobile Layout",
  "Bug",
  "Feature Request",
];

export default function FeedbackPage() {
  const [passageOrResource, setPassageOrResource] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [message, setMessage] = useState("");
  const [optionalEmail, setOptionalEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const feedbackText = useMemo(
    () => [
      `Passage/resource: ${passageOrResource.trim() || "(not provided)"}`,
      `Category: ${category}`,
      `Message: ${message.trim() || "(no message yet)"}`,
      `Email: ${optionalEmail.trim() || "(not provided)"}`,
    ].join("\n"),
    [category, message, optionalEmail, passageOrResource],
  );

  async function copyFeedback() {
    await navigator.clipboard.writeText(feedbackText);
    setCopied(true);
  }

  async function submitFeedback() {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setSubmitMessage("Please write a short message before sending feedback.");
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      await copyFeedback();
      setSubmitMessage("Supabase is not configured here yet, so the feedback was copied instead.");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.from("beta_feedback").insert({
      passage_or_resource: passageOrResource.trim() || null,
      category,
      message: trimmedMessage,
      optional_email: optionalEmail.trim() || null,
    });

    if (error) {
      await copyFeedback();
      setSubmitMessage("Could not send feedback yet. Your message was copied so it can still be shared.");
      return;
    }

    setSubmitMessage("Feedback sent. Thank you for helping make the app better.");
    setMessage("");
    setCopied(false);
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
            Send a short note about what you were viewing and what helped, confused you, or did not work.
          </p>
        </section>

        <form className="mt-4 space-y-4" onSubmit={(event) => event.preventDefault()}>
          <label className="block rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <span className="text-sm font-semibold text-[var(--green)]">Passage or resource being viewed</span>
            <input
              className="mt-3 h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-base outline-none"
              placeholder="John 3:16, Amos 1-4, Pilgrim's Progress..."
              value={passageOrResource}
              onChange={(event) => setPassageOrResource(event.target.value)}
            />
          </label>

          <label className="block rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <span className="text-sm font-semibold text-[var(--green)]">Category</span>
            <select
              className="mt-3 h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-base outline-none"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="block rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <span className="text-sm font-semibold text-[var(--green)]">Message</span>
            <textarea
              className="mt-3 min-h-36 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-3 text-base leading-6 outline-none"
              placeholder="What worked, what confused you, or what should be improved?"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>

          <label className="block rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <span className="text-sm font-semibold text-[var(--green)]">Optional email</span>
            <input
              className="mt-3 h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3 text-base outline-none"
              placeholder="Only if you want a follow-up"
              type="email"
              value={optionalEmail}
              onChange={(event) => setOptionalEmail(event.target.value)}
            />
          </label>
        </form>

        <section className="mt-4 rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
          <button
            className="mr-2 inline-flex items-center gap-2 rounded-full bg-[var(--green)] px-5 py-3 text-sm font-semibold text-white"
            onClick={submitFeedback}
            type="button"
          >
            <Send size={16} />
            Send Feedback
          </button>
          <button
            className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-sm font-semibold text-[var(--ink)] sm:mt-0"
            onClick={copyFeedback}
            type="button"
          >
            <Clipboard size={16} />
            Copy Feedback
          </button>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {submitMessage || (copied ? "Feedback copied. Send it to the beta coordinator." : "Send feedback directly, or copy it if you prefer to paste into an email or message.")}
          </p>
        </section>
      </div>
    </main>
  );
}
